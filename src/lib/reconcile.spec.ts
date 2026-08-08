import {
  mkdtemp,
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
  DetectionTarget,
  ModuleManifest,
  StackConfig,
} from '../types.js';
import { loadCatalog } from './catalog.js';
import { inspectMaterialization } from './materialize.js';
import {
  applyReconciliation,
  planReconciliation,
  proposeStackSelection,
} from './reconcile.js';
import { readStack } from './stack.js';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, {
    recursive: true,
    force: true,
  })));
});

function createModule(id: string, detected: boolean): ModuleManifest {
  return {
    id,
    name: id,
    description: id,
    version: '1.0.0',
    category: 'test',
    managedPaths: [],
    overridePaths: [],
    ...(detected ? { detect: () => ({ applies: true }) } : {}),
  };
}

test('reconciles detector-backed selections while preserving presets and manual modules', () => {
  const modules = [
    createModule('detected/new', true),
    createModule('detected/stale', true),
    createModule('manual/only', false),
    createModule('preset/module', true),
  ];
  const catalog: Catalog = {
    modules: new Map(modules.map((module) => [module.id, module])),
    mixins: new Map(),
    presets: new Map([['base', {
      id: 'base',
      name: 'Base',
      description: 'Base',
      modules: ['preset/module'],
    }]]),
  };
  const stack: StackConfig = {
    version: 2,
    createdAt: '2026-08-08T00:00:00.000Z',
    assetMode: 'materialized',
    presets: ['base'],
    modules: ['detected/stale', 'manual/only', 'preset/module'],
  };
  const target: DetectionTarget = {
    path: '.',
    kind: 'repository',
    modules: [{
      id: 'detected/new',
      reason: 'Detected',
      evidence: [],
    }, {
      id: 'preset/module',
      reason: 'Detected',
      evidence: [],
    }],
  };

  expect(proposeStackSelection(catalog, stack, target)).toEqual({
    ...stack,
    modules: ['detected/new', 'manual/only'],
  });
});

test('previews without mutation and applies the proposed stack and managed assets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-reconcile-'));
  temporaryRoots.push(root);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'fixture-reconcile',
    devDependencies: {
      '@types/node': '^24.0.0',
      typescript: '^5.0.0',
    },
  }), 'utf8');
  await writeFile(path.join(root, 'AGENTS.md'), '# Existing\n\nKeep this.\n', 'utf8');
  const stack: StackConfig = {
    version: 2,
    createdAt: '2026-08-08T00:00:00.000Z',
    assetMode: 'materialized',
    presets: [],
    modules: [],
  };
  const catalog = await loadCatalog();

  const plan = await planReconciliation(root, catalog, stack);
  expect(plan.selectionAdditions).toContain('arch/node-root-package');
  expect(plan.managedIssues.every((issue) => issue.kind === 'missing')).toBe(true);
  await expect(readStack(root)).resolves.toBeNull();

  await applyReconciliation(root, plan);

  await expect(readStack(root)).resolves.toEqual(plan.proposedStack);
  await expect(inspectMaterialization(root, plan.materializationPlan)).resolves.toEqual([]);
  await expect(readFile(path.join(root, 'AGENTS.md'), 'utf8')).resolves.toContain(
    '# Existing\n\nKeep this.',
  );
  await expect(readFile(path.join(root, '.ai', 'AGENTS.md'), 'utf8')).resolves.toContain(
    '## Managed Shared Assets',
  );
});

test('repeated reconciliation is a no-op without churning stack or AI files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-reconcile-repeat-'));
  temporaryRoots.push(root);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'fixture-reconcile-repeat',
    devDependencies: {
      '@types/node': '^24.0.0',
      typescript: '^5.0.0',
    },
  }), 'utf8');
  await writeFile(path.join(root, 'AGENTS.md'), '# Existing\n\nKeep this.\n', 'utf8');
  const stack: StackConfig = {
    version: 2,
    createdAt: '2026-08-08T00:00:00.000Z',
    assetMode: 'materialized',
    presets: [],
    modules: [],
  };
  const catalog = await loadCatalog();
  const firstPlan = await planReconciliation(root, catalog, stack);
  await applyReconciliation(root, firstPlan);
  const paths = [
    path.join(root, '.ai', 'stack.yml'),
    path.join(root, '.ai', 'materialized.yml'),
    path.join(root, '.ai', 'AGENTS.md'),
    path.join(root, 'AGENTS.md'),
  ];
  const before = await Promise.all(paths.map((filePath) => readFile(filePath, 'utf8')));

  const secondPlan = await planReconciliation(root, catalog, firstPlan.proposedStack);

  expect(secondPlan.selectionAdditions).toEqual([]);
  expect(secondPlan.selectionRemovals).toEqual([]);
  expect(secondPlan.effectiveAdditions).toEqual([]);
  expect(secondPlan.effectiveRemovals).toEqual([]);
  expect(secondPlan.mixinAdditions).toEqual([]);
  expect(secondPlan.mixinRemovals).toEqual([]);
  expect(secondPlan.managedIssues).toEqual([]);
  await expect(applyReconciliation(root, secondPlan)).resolves.toMatchObject({
    addedRootReference: false,
    removed: 0,
  });
  await expect(Promise.all(paths.map((filePath) => readFile(filePath, 'utf8')))).resolves.toEqual(
    before,
  );
});
