import {
  existsSync,
} from 'node:fs';
import path from 'node:path';
import {
  getWorkspacesPaths,
  manifestOfSync,
  resolveRootSync,
  resolveRootViaGit,
  resolveRootViaPackageJson,
} from '@sabinmarcu/utils-repo';
import { z } from 'zod';
import type {
  Catalog,
  DetectedModule,
  DetectionEvidence,
  DetectionTarget,
  RepositoryDetection,
  ResolvedRepositoryDetection,
} from '../types.js';
import { withRepoUtilityCacheScope } from './repo-utility-cache.js';
import {
  resolveMixins,
  resolveModules,
} from './resolve.js';

const packageJsonSchema = z.object({
  name: z.string().optional(),
  private: z.boolean().optional(),
  packageManager: z.string().optional(),
  bin: z.union([z.string(), z.record(z.string())]).optional(),
  scripts: z.record(z.string()).optional(),
  workspaces: z.union([
    z.array(z.string()),
    z.object({ packages: z.array(z.string()) }),
  ]).optional(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  optionalDependencies: z.record(z.string()).optional(),
});

type PackageJson = z.infer<typeof packageJsonSchema>;

const detectionEvidenceSchema = z.object({
  kind: z.enum(['file', 'manifest', 'dependency']),
  value: z.string(),
});

const moduleDetectionResultSchema = z.object({
  applies: z.boolean(),
  reason: z.string().optional(),
  evidence: z.array(detectionEvidenceSchema).optional(),
});

const dependencyBuckets = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

function dependencyEvidence(packageJson: PackageJson, dependencies: string[]): DetectionEvidence[] {
  const evidence: DetectionEvidence[] = [];

  for (const bucket of dependencyBuckets) {
    const dependencyMap = packageJson[bucket];
    for (const dependency of dependencies) {
      if (dependencyMap && dependency in dependencyMap) {
        evidence.push({
          kind: 'dependency',
          value: `${bucket}.${dependency}`,
        });
      }
    }
  }

  return evidence;
}

function resolveRepositoryRoot(target: string): string {
  const resolvers = [
    resolveRootSync,
    resolveRootViaPackageJson.sync,
    resolveRootViaGit.sync,
  ];

  for (const resolver of resolvers) {
    try {
      return path.resolve(resolver(target));
    } catch {
      // Try the next repository boundary.
    }
  }

  return path.resolve(target);
}

function readPackageJson(target: string): PackageJson | undefined {
  try {
    return packageJsonSchema.parse(manifestOfSync(target));
  } catch {
    return undefined;
  }
}

async function detectTarget(
  catalog: Catalog,
  root: string,
  relativePath: string,
  kind: DetectionTarget['kind'],
): Promise<DetectionTarget> {
  const absolutePath = relativePath === '.' ? root : path.join(root, relativePath);
  const packageJson = readPackageJson(absolutePath);
  const modules: DetectedModule[] = [];

  const sortedModules = [...catalog.modules.values()]
    .sort((left, right) => left.id.localeCompare(right.id));

  for (const module of sortedModules) {
    if (module.detect) {
      const result = moduleDetectionResultSchema.parse(await module.detect({
        target: {
          root,
          path: relativePath,
          absolutePath,
          kind,
        },
        ...(packageJson ? { packageJson } : {}),
        exists: (filePath) => existsSync(path.join(absolutePath, filePath)),
        dependency: (name) => (packageJson
          ? dependencyEvidence(packageJson, [name])
          : []),
      }));

      if (result.applies) {
        modules.push({
          id: module.id,
          reason: result.reason ?? `Detected by module ${module.id}.`,
          evidence: result.evidence ?? [],
        });
      }
    }
  }

  return {
    path: relativePath,
    kind,
    ...(packageJson?.name ? { packageName: packageJson.name } : {}),
    modules,
  };
}

async function detectRepositoryUncached(
  catalog: Catalog,
  target: string,
): Promise<RepositoryDetection> {
  const root = resolveRepositoryRoot(target);
  const rootPackageJson = readPackageJson(root);
  const workspacePaths = rootPackageJson?.workspaces
    ? [...getWorkspacesPaths.sync(root)].sort()
    : [];

  return {
    root,
    targets: await Promise.all([
      detectTarget(catalog, root, '.', 'repository'),
      ...workspacePaths.map((workspacePath) => detectTarget(catalog, root, workspacePath, 'project')),
    ]),
  };
}

export function detectRepository(catalog: Catalog, target: string): Promise<RepositoryDetection> {
  return withRepoUtilityCacheScope(() => detectRepositoryUncached(catalog, target));
}

export function resolveDetectedRepository(
  catalog: Catalog,
  detection: RepositoryDetection,
): ResolvedRepositoryDetection {
  return {
    root: detection.root,
    targets: detection.targets.map((target) => {
      const resolution = resolveModules(
        catalog,
        target.modules.map((module) => module.id),
      );

      return {
        ...target,
        effectiveModules: resolution.modules,
        activeMixins: resolveMixins(catalog, resolution.modules),
      };
    }),
  };
}

export async function detectSuggestedModules(catalog: Catalog, cwd: string): Promise<string[]> {
  const detection = await detectRepository(catalog, cwd);
  const targetPath = path.resolve(cwd);
  const target = detection.targets.find((candidate) => (
    path.resolve(detection.root, candidate.path) === targetPath
  )) ?? detection.targets[0];
  return target.modules.map((module) => module.id);
}
