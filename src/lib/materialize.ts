import { createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  parse,
  stringify,
} from 'yaml';
import type {
  Catalog,
  MixinManifest,
  ModuleManifest,
  StackConfig,
} from '../types.js';
import { getPackageRoot } from './package-root.js';
import type { StackResolution } from './resolve.js';

type ManagedOwner = ModuleManifest | MixinManifest;

export const MATERIALIZATION_PATH = path.join('.ai', 'materialized.yml');
export const MATERIALIZATION_VERSION = 1;

const materializedFileSchema = z.object({
  path: z.string().min(1),
  hash: z.string().length(64),
  ownerId: z.string().min(1),
  ownerType: z.enum(['baseline', 'mixin', 'module']),
  ownerVersion: z.string().min(1),
}).strict();

const materializationStateSchema = z.object({
  version: z.literal(MATERIALIZATION_VERSION),
  files: z.array(materializedFileSchema),
}).strict();

export type MaterializedFileState = z.infer<typeof materializedFileSchema>;

export type MaterializationState = z.infer<typeof materializationStateSchema>;

export interface MaterializationIssue {
  kind: 'drifted' | 'missing' | 'outdated' | 'stale' | 'stale-drifted' | 'untracked';
  ownerId: string;
  path: string;
}

export interface ApplyMaterializationResult {
  files: number;
  removed: number;
}

export interface PlannedManagedFile {
  content: string;
  hash: string;
  ownerId: string;
  ownerType: 'baseline' | 'mixin' | 'module';
  ownerVersion: string;
  sourcePath?: string;
  targetPath: string;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function renderManagedContent(
  content: string,
  owner: Pick<ManagedOwner, 'id' | 'version'>,
): string {
  const marker = `<!-- Managed by @sabinmarcu/ai from ${owner.id}@${owner.version}. Do not edit directly. -->`;
  const lines = content.split('\n');

  if (lines[0] === '---') {
    const frontmatterEnd = lines.indexOf('---', 1);
    if (frontmatterEnd > 0) {
      lines.splice(frontmatterEnd + 1, 0, marker);
      return lines.join('\n');
    }
  }

  return `${marker}\n\n${content}`;
}

function findTargetPath(owner: ManagedOwner, sourceAsset: string): string {
  const sourceSegments = sourceAsset.split('/');
  if (sourceSegments[0] !== 'files' || sourceSegments.length < 3) {
    throw new Error(`${owner.id} has unsupported source asset path: ${sourceAsset}`);
  }

  const assetKind = sourceSegments[1];
  const assetRelativeSegments = sourceSegments.slice(2);
  const managedPaths = owner.managedPaths.filter((managedPath) => (
    managedPath.split(/[\\/]/u).includes(assetKind)
  ));

  if (managedPaths.length !== 1) {
    throw new Error(`${owner.id} source asset ${sourceAsset} must match exactly one managed path.`);
  }

  const managedPath = managedPaths[0];
  const managedSegments = managedPath.split(/[\\/]/u).filter(Boolean);
  const kindIndex = managedSegments.indexOf(assetKind);
  const managedSuffix = managedSegments.slice(kindIndex + 1);
  let overlap = Math.min(managedSuffix.length, assetRelativeSegments.length);

  while (
    overlap > 0
    && managedSuffix.slice(-overlap).join('/') !== assetRelativeSegments.slice(0, overlap).join('/')
  ) {
    overlap -= 1;
  }

  return path.posix.join(managedPath, ...assetRelativeSegments.slice(overlap));
}

async function planOwner(
  owner: ManagedOwner,
  ownerType: PlannedManagedFile['ownerType'],
): Promise<PlannedManagedFile[]> {
  if (!owner.sourceRoot) {
    throw new Error(`Catalog source root is unavailable for ${owner.id}.`);
  }

  const { sourceRoot } = owner;
  return Promise.all((owner.sourceAssets ?? []).map(async (sourceAsset) => {
    const sourcePath = path.resolve(sourceRoot, sourceAsset);
    const content = renderManagedContent(await readFile(sourcePath, 'utf8'), owner);

    return {
      content,
      hash: hashContent(content),
      ownerId: owner.id,
      ownerType,
      ownerVersion: owner.version,
      sourcePath,
      targetPath: findTargetPath(owner, sourceAsset),
    };
  }));
}

export async function buildMaterializationPlan(
  catalog: Catalog,
  resolution: Pick<StackResolution, 'activeMixins' | 'effectiveModules'>,
): Promise<PlannedManagedFile[]> {
  const plannedFiles: PlannedManagedFile[] = [];

  for (const moduleId of resolution.effectiveModules) {
    const module = catalog.modules.get(moduleId);
    if (!module) {
      throw new Error(`Unknown effective module: ${moduleId}`);
    }
    plannedFiles.push(...await planOwner(module, 'module'));
  }

  for (const activeMixin of resolution.activeMixins) {
    const mixin = catalog.mixins.get(activeMixin.id);
    if (!mixin) {
      throw new Error(`Unknown active mixin: ${activeMixin.id}`);
    }
    plannedFiles.push(...await planOwner(mixin, 'mixin'));
  }

  const targetOwners = new Map<string, string>();
  for (const plannedFile of plannedFiles) {
    const existingOwner = targetOwners.get(plannedFile.targetPath);
    if (existingOwner) {
      throw new Error(`Managed file ${plannedFile.targetPath} is produced by both ${existingOwner} and ${plannedFile.ownerId}.`);
    }
    targetOwners.set(plannedFile.targetPath, plannedFile.ownerId);
  }

  return plannedFiles;
}

function sourceAssetLink(targetRoot: string, sourcePath: string): string {
  const absoluteTargetRoot = path.resolve(targetRoot);
  const absoluteSourcePath = path.resolve(sourcePath);
  if (!absoluteSourcePath.startsWith(`${absoluteTargetRoot}${path.sep}`)) {
    throw new Error(`Source asset must be contained in the target repository: ${sourcePath}`);
  }
  return path.relative(path.join(absoluteTargetRoot, '.ai'), absoluteSourcePath)
    .split(path.sep)
    .join('/');
}

function renderEntrypoint(
  catalog: Catalog,
  resolution: Pick<StackResolution, 'activeMixins' | 'effectiveModules'>,
  catalogPlan: PlannedManagedFile[],
  assetMode: StackConfig['assetMode'],
  reconciliationSkillLink: string,
  targetRoot?: string,
): string {
  const overridePaths = new Set<string>();
  const renderAssetLinks = (
    ownerType: PlannedManagedFile['ownerType'],
    include: (file: PlannedManagedFile) => boolean,
  ): string[] => (
    catalogPlan
      .filter((file) => file.ownerType === ownerType && include(file))
      .map((file) => {
        const link = assetMode === 'source'
          ? sourceAssetLink(targetRoot as string, file.sourcePath as string)
          : `../${file.targetPath}`;
        return `- [${file.ownerId}: ${path.posix.basename(link)}](${link})`;
      })
  );
  const moduleInstructionLinks = renderAssetLinks(
    'module',
    (file) => file.targetPath.startsWith('.github/instructions/'),
  );
  const mixinInstructionLinks = renderAssetLinks(
    'mixin',
    (file) => file.targetPath.startsWith('.github/instructions/'),
  );
  const sharedSkillLinks = [
    ...renderAssetLinks('module', (file) => file.targetPath.endsWith('/SKILL.md')),
    ...renderAssetLinks('mixin', (file) => file.targetPath.endsWith('/SKILL.md')),
  ];
  for (const moduleId of resolution.effectiveModules) {
    for (const overridePath of catalog.modules.get(moduleId)?.overridePaths ?? []) {
      overridePaths.add(overridePath);
    }
  }
  for (const activeMixin of resolution.activeMixins) {
    for (const overridePath of catalog.mixins.get(activeMixin.id)?.overridePaths ?? []) {
      overridePaths.add(overridePath);
    }
  }

  const lines = [
    '# AI Stack Entrypoint',
    '',
    '<!-- Managed by @sabinmarcu/ai. Do not edit directly. -->',
    '',
    '## Reconciliation',
    '',
    `Use the [stack reconciliation skill](${reconciliationSkillLink}) after repository changes may alter module applicability.`,
    '- Use the CLI workflow from that skill; do not edit managed files or stack state directly.',
    '',
    '## Required Shared Instructions',
    '',
    'Before working in this repository, open, read, and follow every linked file below. These files are the active shared instruction set, not optional references.',
    '',
    '### Module Instructions',
    '',
    ...(moduleInstructionLinks.length > 0
      ? moduleInstructionLinks
      : ['- No module instructions are active.']),
    '',
    '### Mixin Instructions',
    '',
    ...(mixinInstructionLinks.length > 0
      ? mixinInstructionLinks
      : ['- No mixin instructions are active.']),
    ...(sharedSkillLinks.length > 0
      ? [
        '',
        '## Available Shared Skills',
        '',
        'Open a skill entrypoint when its description matches the task. Supporting skill assets are resolved from the skill itself.',
        '',
        ...sharedSkillLinks,
      ]
      : []),
    '',
    '## Repository-Local Override Locations',
    '',
    ...(overridePaths.size > 0
      ? [...overridePaths].map((overridePath) => `- \`${overridePath}\``)
      : ['- No module-specific override locations are active.']),
    '',
    assetMode === 'source'
      ? 'Catalog source assets are linked in place and are not managed copies. Keep repository-specific tuning in the override locations above.'
      : 'Managed shared assets are replaced during reconciliation. Keep repository-specific tuning in the override locations above.',
    '',
  ];
  return lines.join('\n');
}

export interface CompleteMaterializationOptions {
  assetMode?: StackConfig['assetMode'];
  packageRoot?: string;
  targetRoot?: string;
}

export async function buildCompleteMaterializationPlan(
  catalog: Catalog,
  resolution: Pick<StackResolution, 'activeMixins' | 'effectiveModules'>,
  options: CompleteMaterializationOptions = {},
): Promise<PlannedManagedFile[]> {
  const assetMode = options.assetMode ?? 'materialized';
  const packageRoot = options.packageRoot ?? getPackageRoot();
  const { targetRoot } = options;
  if (assetMode === 'source' && !targetRoot) {
    throw new Error('Source asset mode requires a target repository root.');
  }
  const catalogPlan = await buildMaterializationPlan(catalog, resolution);
  if (assetMode === 'source') {
    for (const plannedFile of catalogPlan) {
      sourceAssetLink(targetRoot as string, plannedFile.sourcePath as string);
    }
  }
  const skillSourcePath = path.join(
    assetMode === 'source' ? targetRoot as string : packageRoot,
    'catalog',
    'bootstrap',
    'skills',
    'stack-reconciliation',
    'SKILL.md',
  );
  const skillContent = renderManagedContent(await readFile(skillSourcePath, 'utf8'), {
    id: 'baseline/stack-reconciliation',
    version: '1',
  });
  const reconciliationSkillLink = assetMode === 'source'
    ? sourceAssetLink(targetRoot as string, skillSourcePath)
    : '../.github/skills/stack-reconciliation/SKILL.md';
  const entrypointContent = renderEntrypoint(
    catalog,
    resolution,
    catalogPlan,
    assetMode,
    reconciliationSkillLink,
    targetRoot,
  );
  const baselinePlan: PlannedManagedFile[] = [
    {
      content: skillContent,
      hash: hashContent(skillContent),
      ownerId: 'baseline/stack-reconciliation',
      ownerType: 'baseline',
      ownerVersion: '1',
      sourcePath: skillSourcePath,
      targetPath: '.github/skills/stack-reconciliation/SKILL.md',
    },
    {
      content: entrypointContent,
      hash: hashContent(entrypointContent),
      ownerId: 'baseline/entrypoint',
      ownerType: 'baseline',
      ownerVersion: '1',
      targetPath: '.ai/AGENTS.md',
    },
  ];

  return assetMode === 'source'
    ? [baselinePlan[1] as PlannedManagedFile]
    : [...baselinePlan, ...catalogPlan];
}

export async function ensureRootEntrypointReference(cwd: string): Promise<boolean> {
  const agentsPath = path.join(cwd, 'AGENTS.md');
  const existing = await readOptionalFile(agentsPath);
  if (existing?.includes('](.ai/AGENTS.md)')) {
    return false;
  }

  const reference = [
    '<!-- @sabinmarcu/ai entrypoint -->',
    'You must open, read, and follow the [managed AI stack entrypoint](.ai/AGENTS.md) in addition to these repository instructions.',
  ].join('\n');
  const content = existing === null
    ? `# AGENTS\n\n${reference}\n`
    : `${existing.trimEnd()}\n\n${reference}\n`;
  await writeFile(agentsPath, content, 'utf8');
  return true;
}

export async function readMaterializationState(cwd: string): Promise<MaterializationState | null> {
  const statePath = path.join(cwd, MATERIALIZATION_PATH);
  const raw = await readOptionalFile(statePath);
  if (raw === null) {
    return null;
  }
  return materializationStateSchema.parse(parse(raw)) as MaterializationState;
}

async function writeMaterializationState(
  cwd: string,
  plan: PlannedManagedFile[],
): Promise<void> {
  const state = materializationStateSchema.parse({
    version: MATERIALIZATION_VERSION,
    files: plan.map((plannedFile) => ({
      path: plannedFile.targetPath,
      hash: plannedFile.hash,
      ownerId: plannedFile.ownerId,
      ownerType: plannedFile.ownerType,
      ownerVersion: plannedFile.ownerVersion,
    })),
  });
  const statePath = path.join(cwd, MATERIALIZATION_PATH);
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, stringify(state), 'utf8');
}

export async function inspectMaterialization(
  cwd: string,
  plan: PlannedManagedFile[],
): Promise<MaterializationIssue[]> {
  const state = await readMaterializationState(cwd);
  const stateByPath = new Map((state?.files ?? []).map((file) => [file.path, file]));
  const desiredByPath = new Map(plan.map((file) => [file.targetPath, file]));
  const issues: MaterializationIssue[] = [];

  for (const plannedFile of plan) {
    const stateFile = stateByPath.get(plannedFile.targetPath);
    const content = await readOptionalFile(path.join(cwd, plannedFile.targetPath));
    if (content === null) {
      issues.push({
        kind: 'missing',
        ownerId: plannedFile.ownerId,
        path: plannedFile.targetPath,
      });
    } else if (!stateFile) {
      issues.push({
        kind: 'untracked',
        ownerId: plannedFile.ownerId,
        path: plannedFile.targetPath,
      });
    } else if (hashContent(content) === stateFile.hash && stateFile.hash !== plannedFile.hash) {
      issues.push({
        kind: 'outdated',
        ownerId: plannedFile.ownerId,
        path: plannedFile.targetPath,
      });
    } else if (hashContent(content) !== plannedFile.hash) {
      issues.push({
        kind: 'drifted',
        ownerId: plannedFile.ownerId,
        path: plannedFile.targetPath,
      });
    } else if (
      stateFile.hash !== plannedFile.hash
      || stateFile.ownerId !== plannedFile.ownerId
      || stateFile.ownerType !== plannedFile.ownerType
      || stateFile.ownerVersion !== plannedFile.ownerVersion
    ) {
      issues.push({
        kind: 'outdated',
        ownerId: plannedFile.ownerId,
        path: plannedFile.targetPath,
      });
    }
  }

  for (const stateFile of state?.files ?? []) {
    if (!desiredByPath.has(stateFile.path)) {
      const content = await readOptionalFile(path.join(cwd, stateFile.path));
      issues.push({
        kind: content !== null && hashContent(content) !== stateFile.hash ? 'stale-drifted' : 'stale',
        ownerId: stateFile.ownerId,
        path: stateFile.path,
      });
    }
  }

  return issues;
}

export async function applyMaterialization(
  cwd: string,
  plan: PlannedManagedFile[],
  options: { force?: boolean } = {},
): Promise<ApplyMaterializationResult> {
  const state = await readMaterializationState(cwd);
  const stateByPath = new Map((state?.files ?? []).map((file) => [file.path, file]));
  const desiredPaths = new Set(plan.map((file) => file.targetPath));

  for (const plannedFile of plan) {
    if (!options.force && !stateByPath.has(plannedFile.targetPath)) {
      const content = await readOptionalFile(path.join(cwd, plannedFile.targetPath));
      if (content !== null && hashContent(content) !== plannedFile.hash) {
        throw new Error(`Refusing to overwrite untracked file at managed path: ${plannedFile.targetPath}`);
      }
    }
  }

  const staleFiles = (state?.files ?? []).filter((file) => !desiredPaths.has(file.path));
  for (const staleFile of staleFiles) {
    const content = await readOptionalFile(path.join(cwd, staleFile.path));
    if (!options.force && content !== null && hashContent(content) !== staleFile.hash) {
      throw new Error(`Refusing to remove drifted stale managed file: ${staleFile.path}`);
    }
  }

  for (const plannedFile of plan) {
    const targetPath = path.join(cwd, plannedFile.targetPath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, plannedFile.content, 'utf8');
  }

  let removed = 0;
  for (const staleFile of staleFiles) {
    const targetPath = path.join(cwd, staleFile.path);
    if (await readOptionalFile(targetPath) !== null) {
      await rm(targetPath);
      removed += 1;
    }
  }

  await writeMaterializationState(cwd, plan);
  return {
    files: plan.length,
    removed,
  };
}
