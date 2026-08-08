import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  afterEach,
  expect,
  test,
} from 'vitest';
import type {
  Catalog,
  MixinManifest,
  ModuleManifest,
} from '../types.js';
import {
  applyMaterialization,
  buildCompleteMaterializationPlan,
  buildMaterializationPlan,
  ensureRootEntrypointReference,
  inspectMaterialization,
  MATERIALIZATION_PATH,
} from './materialize.js';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, {
    recursive: true,
    force: true,
  })));
});

async function createModule(): Promise<ModuleManifest> {
  const sourceRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-materialize-'));
  temporaryRoots.push(sourceRoot);
  await mkdir(path.join(sourceRoot, 'files', 'instructions'), { recursive: true });
  await mkdir(path.join(sourceRoot, 'files', 'skills', 'release', 'assets'), { recursive: true });
  await writeFile(
    path.join(sourceRoot, 'files', 'instructions', 'base.instructions.md'),
    '---\ndescription: "Base"\n---\n\n# Base\n',
    'utf8',
  );
  await writeFile(
    path.join(sourceRoot, 'files', 'skills', 'release', 'SKILL.md'),
    '# Release\n',
    'utf8',
  );
  await writeFile(
    path.join(sourceRoot, 'files', 'skills', 'release', 'assets', 'template.md'),
    'template\n',
    'utf8',
  );

  return {
    id: 'test/base',
    name: 'Base',
    description: 'Base',
    version: '1.2.3',
    sourceRoot,
    category: 'test',
    managedPaths: [
      '.github/instructions/shared/base/',
      '.github/skills/release/',
    ],
    sourceAssets: [
      'files/instructions/base.instructions.md',
      'files/skills/release/SKILL.md',
      'files/skills/release/assets/template.md',
    ],
    overridePaths: ['.github/instructions/local/base/'],
  };
}

test('plans marked assets at deterministic managed paths without duplicating path segments', async () => {
  const module = await createModule();
  const catalog: Catalog = {
    modules: new Map([[module.id, module]]),
    mixins: new Map(),
    presets: new Map(),
  };

  const plan = await buildMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [],
  });

  expect(plan.map((file) => file.targetPath)).toEqual([
    '.github/instructions/shared/base/base.instructions.md',
    '.github/skills/release/SKILL.md',
    '.github/skills/release/assets/template.md',
  ]);
  expect(plan[0]?.content).toContain(
    '---\n<!-- Managed by @sabinmarcu/ai from test/base@1.2.3. Do not edit directly. -->\n\n# Base',
  );
});

test('applies, repairs, and removes managed files without touching overrides', async () => {
  const module = await createModule();
  const catalog: Catalog = {
    modules: new Map([[module.id, module]]),
    mixins: new Map(),
    presets: new Map(),
  };
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-consumer-'));
  temporaryRoots.push(targetRoot);
  const overridePath = path.join(targetRoot, '.github', 'instructions', 'local', 'base', 'custom.md');
  await mkdir(path.dirname(overridePath), { recursive: true });
  await writeFile(overridePath, 'local\n', 'utf8');
  const plan = await buildMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [],
  });

  await expect(applyMaterialization(targetRoot, plan)).resolves.toEqual({
    files: 3,
    removed: 0,
  });
  await expect(inspectMaterialization(targetRoot, plan)).resolves.toEqual([]);
  await expect(readFile(path.join(targetRoot, MATERIALIZATION_PATH), 'utf8')).resolves.toContain(
    'version: 1',
  );

  const managedPath = path.join(targetRoot, plan[0]?.targetPath ?? '');
  await writeFile(managedPath, 'manual edit\n', 'utf8');
  await expect(inspectMaterialization(targetRoot, plan)).resolves.toEqual(expect.arrayContaining([
    expect.objectContaining({
      kind: 'drifted',
      path: plan[0]?.targetPath,
    }),
  ]));
  await applyMaterialization(targetRoot, plan);
  await expect(readFile(managedPath, 'utf8')).resolves.toBe(plan[0]?.content);

  await expect(applyMaterialization(targetRoot, [])).resolves.toEqual({
    files: 0,
    removed: 3,
  });
  await expect(readFile(overridePath, 'utf8')).resolves.toBe('local\n');
});

test('refuses to replace untracked files or remove drifted stale files', async () => {
  const module = await createModule();
  const catalog: Catalog = {
    modules: new Map([[module.id, module]]),
    mixins: new Map(),
    presets: new Map(),
  };
  const plan = await buildMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [],
  });
  const untrackedRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-untracked-'));
  temporaryRoots.push(untrackedRoot);
  const managedPath = path.join(untrackedRoot, plan[0]?.targetPath ?? '');
  await mkdir(path.dirname(managedPath), { recursive: true });
  await writeFile(managedPath, 'existing\n', 'utf8');

  await expect(applyMaterialization(untrackedRoot, plan)).rejects.toThrow(
    `Refusing to overwrite untracked file at managed path: ${plan[0]?.targetPath}`,
  );

  const staleRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-stale-'));
  temporaryRoots.push(staleRoot);
  await applyMaterialization(staleRoot, plan);
  const stalePath = path.join(staleRoot, plan[0]?.targetPath ?? '');
  await writeFile(stalePath, 'drifted\n', 'utf8');

  await expect(applyMaterialization(staleRoot, [])).rejects.toThrow(
    `Refusing to remove drifted stale managed file: ${plan[0]?.targetPath}`,
  );
  await expect(readFile(stalePath, 'utf8')).resolves.toBe('drifted\n');
});

test('removes a deactivated mixin without removing active module files', async () => {
  const module = await createModule();
  const mixinRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-mixin-'));
  temporaryRoots.push(mixinRoot);
  await mkdir(path.join(mixinRoot, 'files', 'instructions'), { recursive: true });
  await writeFile(
    path.join(mixinRoot, 'files', 'instructions', 'integration.instructions.md'),
    '# Integration\n',
    'utf8',
  );
  const mixin: MixinManifest = {
    id: 'mixin/integration',
    name: 'Integration',
    description: 'Integration',
    version: '1.0.0',
    sourceRoot: mixinRoot,
    managedPaths: ['.github/instructions/shared/mixins/integration/'],
    sourceAssets: ['files/instructions/integration.instructions.md'],
    overridePaths: ['.github/instructions/local/mixins/integration/'],
    requiresAll: [module.id],
  };
  const catalog: Catalog = {
    modules: new Map([[module.id, module]]),
    mixins: new Map([[mixin.id, mixin]]),
    presets: new Map(),
  };
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-deactivate-'));
  temporaryRoots.push(targetRoot);
  const activePlan = await buildMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [{
      id: mixin.id,
      reason: 'test',
      requiresAll: [module.id],
    }],
  });
  await applyMaterialization(targetRoot, activePlan);
  const modulePath = activePlan.find((file) => file.ownerType === 'module')?.targetPath ?? '';
  const mixinPath = activePlan.find((file) => file.ownerType === 'mixin')?.targetPath ?? '';

  const inactivePlan = await buildMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [],
  });
  await expect(applyMaterialization(targetRoot, inactivePlan)).resolves.toEqual({
    files: 3,
    removed: 1,
  });
  await expect(readFile(path.join(targetRoot, modulePath), 'utf8')).resolves.toBeDefined();
  await expect(readFile(path.join(targetRoot, mixinPath), 'utf8')).rejects.toThrow();
});

test('includes baseline infrastructure and generates deterministic asset and override links', async () => {
  const module = await createModule();
  const catalog: Catalog = {
    modules: new Map([[module.id, module]]),
    mixins: new Map(),
    presets: new Map(),
  };

  const plan = await buildCompleteMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [],
  });

  expect(plan.slice(0, 2).map((file) => file.targetPath)).toEqual([
    '.github/skills/stack-reconciliation/SKILL.md',
    '.ai/AGENTS.md',
  ]);
  const entrypoint = plan[1]?.content ?? '';
  expect(entrypoint).toContain(
    '[test/base](../.github/instructions/shared/base/base.instructions.md)',
  );
  expect(entrypoint).toContain('`.github/instructions/local/base/`');
  expect(entrypoint).not.toContain('# Base');
  for (const managedFile of plan.slice(2)) {
    expect(entrypoint).toContain(`../${managedFile.targetPath}`);
  }
});

test('materializes baseline infrastructure with an otherwise empty stack', async () => {
  const catalog: Catalog = {
    modules: new Map(),
    mixins: new Map(),
    presets: new Map(),
  };

  const plan = await buildCompleteMaterializationPlan(catalog, {
    effectiveModules: [],
    activeMixins: [],
  });

  expect(plan.map((file) => file.targetPath)).toEqual([
    '.github/skills/stack-reconciliation/SKILL.md',
    '.ai/AGENTS.md',
  ]);
  expect(plan[1]?.content).toContain('No module-specific override locations are active.');
});

test('regenerates the entrypoint without references to a deactivated mixin', async () => {
  const module = await createModule();
  const mixinRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-entrypoint-mixin-'));
  temporaryRoots.push(mixinRoot);
  await mkdir(path.join(mixinRoot, 'files', 'instructions'), { recursive: true });
  await writeFile(
    path.join(mixinRoot, 'files', 'instructions', 'integration.instructions.md'),
    '# Integration\n',
    'utf8',
  );
  const mixin: MixinManifest = {
    id: 'mixin/integration',
    name: 'Integration',
    description: 'Integration',
    version: '1.0.0',
    sourceRoot: mixinRoot,
    managedPaths: ['.github/instructions/shared/mixins/integration/'],
    sourceAssets: ['files/instructions/integration.instructions.md'],
    overridePaths: ['.github/instructions/local/mixins/integration/'],
    requiresAll: [module.id],
  };
  const catalog: Catalog = {
    modules: new Map([[module.id, module]]),
    mixins: new Map([[mixin.id, mixin]]),
    presets: new Map(),
  };
  const activePlan = await buildCompleteMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [{
      id: mixin.id,
      reason: 'test',
      requiresAll: [module.id],
    }],
  });
  const inactivePlan = await buildCompleteMaterializationPlan(catalog, {
    effectiveModules: [module.id],
    activeMixins: [],
  });

  expect(activePlan[1]?.content).toContain('mixin/integration');
  expect(inactivePlan[1]?.content).not.toContain('mixin/integration');
  expect(inactivePlan[1]?.content).not.toContain(
    '.github/instructions/local/mixins/integration/',
  );
});

test('adds the root entrypoint reference once without replacing existing instructions', async () => {
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-entrypoint-'));
  temporaryRoots.push(targetRoot);
  const agentsPath = path.join(targetRoot, 'AGENTS.md');
  await writeFile(agentsPath, '# Existing\n\nKeep this.\n', 'utf8');

  await expect(ensureRootEntrypointReference(targetRoot)).resolves.toBe(true);
  const firstContent = await readFile(agentsPath, 'utf8');
  expect(firstContent).toContain('# Existing\n\nKeep this.');
  expect(firstContent).toContain('[managed AI stack entrypoint](.ai/AGENTS.md)');
  await expect(ensureRootEntrypointReference(targetRoot)).resolves.toBe(false);
  await expect(readFile(agentsPath, 'utf8')).resolves.toBe(firstContent);
});
