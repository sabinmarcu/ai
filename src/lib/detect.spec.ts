import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getWorkspacesPaths } from '@sabinmarcu/utils-repo';
import {
  afterEach,
  expect,
  test,
} from 'vitest';
import { loadCatalog } from './catalog.js';
import {
  detectRepository,
  resolveDetectedRepository,
} from './detect.js';
import { clearRepoUtilityCaches } from './repo-utility-cache.js';
import { resolveModules } from './resolve.js';

const temporaryRoots: string[] = [];

afterEach(async () => {
  clearRepoUtilityCaches();
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, {
    recursive: true,
    force: true,
  })));
});

async function createMonorepo(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-detect-'));
  temporaryRoots.push(root);
  await mkdir(path.join(root, 'packages', 'app'), { recursive: true });
  await mkdir(path.join(root, 'packages', 'web-library'), { recursive: true });
  await mkdir(path.join(root, 'packages', 'node-library'), { recursive: true });
  await mkdir(path.join(root, 'packages', 'tool'), { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'fixture-root',
    private: true,
    packageManager: 'yarn@4.17.0',
    workspaces: ['packages/*'],
    devDependencies: {
      '@commitlint/cli': '^19.0.0',
      eslint: '^9.0.0',
      husky: '^9.0.0',
      'lint-staged': '^16.0.0',
      typescript: '^5.0.0',
    },
  }), 'utf8');
  await writeFile(path.join(root, 'packages', 'app', 'package.json'), JSON.stringify({
    name: 'fixture-app',
    private: true,
    scripts: { start: 'node index.js' },
    dependencies: {
      eslint: '^9.0.0',
      react: '^19.0.0',
    },
  }), 'utf8');
  await writeFile(path.join(root, 'packages', 'app', 'tsconfig.json'), '{}', 'utf8');
  await writeFile(path.join(root, 'packages', 'app', 'eslint.config.mjs'), 'export default [];', 'utf8');
  await writeFile(path.join(root, 'packages', 'web-library', 'package.json'), JSON.stringify({
    name: 'fixture-web-library',
    dependencies: {
      eslint: '^9.0.0',
      react: '^19.0.0',
      typescript: '^5.0.0',
    },
  }), 'utf8');
  await writeFile(path.join(root, 'packages', 'node-library', 'package.json'), JSON.stringify({
    name: 'fixture-node-library',
    devDependencies: {
      '@types/node': '^24.0.0',
      typescript: '^5.0.0',
    },
  }), 'utf8');
  await writeFile(path.join(root, 'packages', 'tool', 'package.json'), JSON.stringify({
    name: 'fixture-tool',
    bin: './dist/cli.js',
    devDependencies: {
      '@types/node': '^24.0.0',
      typescript: '^5.0.0',
    },
  }), 'utf8');
  return root;
}

test('detects modules independently for repository and workspace targets', async () => {
  const root = await createMonorepo();
  const catalog = await loadCatalog();
  const detection = await detectRepository(catalog, root);

  expect(detection.targets.map((target) => target.path)).toEqual([
    '.',
    'packages/app',
    'packages/node-library',
    'packages/tool',
    'packages/web-library',
  ]);
  expect(detection.targets[0].modules.map((module) => module.id)).toContain('arch/monorepo');
  expect(detection.targets[0].modules.map((module) => module.id)).toContain('arch/node-root-package');
  expect(detection.targets[0].modules.map((module) => module.id)).toEqual(expect.arrayContaining([
    'tooling/commitlint',
    'tooling/eslint',
    'tooling/husky',
    'tooling/lint-staged',
    'tooling/yarn',
  ]));
  expect(detection.targets[1]).not.toHaveProperty('role');
  expect(detection.targets[1].modules.map((module) => module.id)).not.toContain('arch/node-root-package');
  expect(detection.targets[1].modules.map((module) => module.id)).toContain('arch/web-application');
  expect(detection.targets[1].modules.map((module) => module.id)).toContain('arch/web-react');
  expect(detection.targets[1].modules.map((module) => module.id)).toContain('tooling/eslint');
  expect(detection.targets[1].modules.map((module) => module.id)).not.toContain('lang/typescript');
  expect(detection.targets[1].modules.find((module) => module.id === 'tooling/eslint')?.evidence).toContainEqual({
    kind: 'file',
    value: 'eslint.config.mjs',
  });
  expect(detection.targets[2]).not.toHaveProperty('role');
  expect(detection.targets[2].modules.map((module) => module.id)).toContain('lang/typescript');
  expect(detection.targets[2].modules.map((module) => module.id)).toContain('arch/node-library');
  expect(detection.targets[3].modules.map((module) => module.id)).toContain('arch/node-tool');
  expect(detection.targets[3].modules.map((module) => module.id)).toContain('arch/node-library');
  expect(detection.targets[4].modules.map((module) => module.id)).toContain('arch/web-library');
  expect(detection.targets[4].modules.map((module) => module.id)).not.toContain('arch/node-library');
});

test('activates mixins from each target dependency closure only', async () => {
  const root = await createMonorepo();
  const catalog = await loadCatalog();
  const detection = resolveDetectedRepository(catalog, await detectRepository(catalog, root));
  const repository = detection.targets[0];
  const application = detection.targets[1];
  const nodeLibrary = detection.targets[2];
  const tool = detection.targets[3];
  const webLibrary = detection.targets[4];

  expect(repository.activeMixins.map((mixin) => mixin.id)).toEqual(expect.arrayContaining([
    'mixin/commitlint-conventional-commits',
    'mixin/commitlint-monorepo-scopes',
    'mixin/conventional-commits-monorepo',
    'mixin/eslint-lint-staged',
    'mixin/husky-commitlint',
    'mixin/husky-lint-staged',
    'mixin/husky-typescript',
    'mixin/husky-yarn-monorepo',
  ]));
  expect(application.activeMixins.map((mixin) => mixin.id)).toContain('mixin/react-eslint');
  expect(application.effectiveModules).not.toContain('lang/typescript');
  expect(application.activeMixins.map((mixin) => mixin.id)).not.toContain('mixin/typescript-eslint');
  expect(nodeLibrary.activeMixins.map((mixin) => mixin.id)).toContain('mixin/typescript-library');
  expect(tool.activeMixins.map((mixin) => mixin.id)).toContain('mixin/typescript-library');
  expect(webLibrary.activeMixins.map((mixin) => mixin.id)).toContain('mixin/typescript-eslint');
  expect(webLibrary.activeMixins.map((mixin) => mixin.id)).toContain('mixin/typescript-library');
  expect(webLibrary.activeMixins.map((mixin) => mixin.id)).toContain('mixin/react-eslint');
});

test('permits node tools as node libraries while keeping deployed apps and library runtimes exclusive', async () => {
  const catalog = await loadCatalog();

  expect(resolveModules(catalog, ['arch/node-tool']).modules).toEqual(expect.arrayContaining([
    'arch/node-package-application',
    'arch/node-package-library',
    'arch/node-library',
    'arch/node-tool',
  ]));
  expect(() => resolveModules(catalog, ['arch/node-application', 'arch/node-library'])).toThrow(
    'Conflicting modules selected: arch/node-application and arch/node-library',
  );
  expect(() => resolveModules(catalog, ['arch/web-application', 'arch/web-library'])).toThrow(
    'Conflicting modules selected: arch/web-application and arch/web-library',
  );
  expect(() => resolveModules(catalog, ['arch/node-library', 'arch/web-library'])).toThrow(
    'Conflicting modules selected: arch/node-library and arch/web-library',
  );
});

test('keeps ESLint and lint-staged independently selectable', async () => {
  const catalog = await loadCatalog();

  expect(resolveModules(catalog, ['tooling/eslint']).modules).not.toContain('tooling/lint-staged');
  expect(resolveModules(catalog, ['tooling/lint-staged']).modules).not.toContain('tooling/eslint');
});

test('loads Conventional Commits guidance through the global baseline', async () => {
  const catalog = await loadCatalog();
  const { modules } = resolveModules(catalog, ['global/core']);

  expect(modules).toContain('guidance/commits');
  expect(modules).toContain('guidance/conventional-commits');
});

test('keeps root-package policy out of the node-web application preset', async () => {
  const catalog = await loadCatalog();
  const preset = catalog.presets.get('node-web');

  expect(preset).toBeDefined();
  const { modules } = resolveModules(catalog, preset?.modules ?? []);
  expect(modules).toContain('arch/node-package');
  expect(modules).not.toContain('arch/node-root-package');
});

test('applies the root tooling baseline to a standalone Node package', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-root-package-'));
  temporaryRoots.push(root);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'fixture-standalone',
  }), 'utf8');

  const catalog = await loadCatalog();
  const detection = resolveDetectedRepository(catalog, await detectRepository(catalog, root));
  const repository = detection.targets[0];

  expect(repository.modules.map((module) => module.id)).toContain('arch/node-root-package');
  expect(repository.modules.map((module) => module.id)).not.toContain('arch/monorepo');
  expect(repository.effectiveModules).toEqual(expect.arrayContaining([
    'guidance/conventional-commits',
    'tooling/commitlint',
    'tooling/eslint',
    'tooling/husky',
    'tooling/lint-staged',
  ]));
  expect(repository.activeMixins.map((mixin) => mixin.id)).toContain(
    'mixin/commitlint-conventional-commits',
  );
  expect(repository.activeMixins.map((mixin) => mixin.id)).not.toContain(
    'mixin/conventional-commits-monorepo',
  );
  expect(repository.activeMixins.map((mixin) => mixin.id)).not.toContain(
    'mixin/commitlint-monorepo-scopes',
  );
});

test('clears every exported utility cache after workspace topology changes', async () => {
  const root = await createMonorepo();
  expect(getWorkspacesPaths.sync(root)).toHaveLength(4);

  await mkdir(path.join(root, 'packages', 'new-package'), { recursive: true });
  await writeFile(path.join(root, 'packages', 'new-package', 'package.json'), JSON.stringify({
    name: 'fixture-new-package',
  }), 'utf8');

  expect(getWorkspacesPaths.sync(root)).toHaveLength(4);
  expect(clearRepoUtilityCaches()).toBeGreaterThan(0);
  expect(getWorkspacesPaths.sync(root)).toHaveLength(5);
});
