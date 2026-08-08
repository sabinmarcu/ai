import {
  mkdir,
  mkdtemp,
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
import { loadCatalog } from './catalog.js';
import {
  resolveMixins,
  resolveModules,
} from './resolve.js';

const baseModule: ModuleManifest = {
  id: 'base',
  name: 'Base',
  description: 'Base module',
  version: '1.0.0',
  category: 'test',
  managedPaths: ['managed/base/'],
  sourceAssets: ['files/base.md'],
  overridePaths: ['local/base/'],
  dependsOn: [],
  conflictsWith: [],
};

const baseMixin: MixinManifest = {
  id: 'mixin/base-feature',
  name: 'Base Feature',
  description: 'Base feature mixin',
  version: '1.0.0',
  managedPaths: ['managed/mixin/base-feature/'],
  sourceAssets: ['files/base.md'],
  overridePaths: ['local/mixin/base-feature/'],
  requiresAll: ['base'],
};

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, {
    recursive: true,
    force: true,
  })));
});

async function createCatalogRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-catalog-'));
  temporaryRoots.push(root);
  await mkdir(path.join(root, 'catalog', 'modules'), { recursive: true });
  await mkdir(path.join(root, 'catalog', 'mixins'), { recursive: true });
  await mkdir(path.join(root, 'catalog', 'presets'), { recursive: true });
  return root;
}

async function writeModule(
  root: string,
  folder: string,
  manifest: ModuleManifest,
  includeAsset = true,
): Promise<void> {
  const moduleRoot = path.join(root, 'catalog', 'modules', folder);
  await mkdir(path.join(moduleRoot, 'files'), { recursive: true });
  await writeFile(path.join(moduleRoot, 'module.json'), JSON.stringify(manifest), 'utf8');
  if (includeAsset) {
    await writeFile(path.join(moduleRoot, 'files', 'base.md'), 'base', 'utf8');
  }
}

async function writePreset(root: string, modules: string[]): Promise<void> {
  await writeFile(path.join(root, 'catalog', 'presets', 'test.json'), JSON.stringify({
    id: 'test',
    name: 'Test',
    description: 'Test preset',
    modules,
  }), 'utf8');
}

async function writeMixin(
  root: string,
  folder: string,
  manifest: MixinManifest,
  includeAsset = true,
): Promise<void> {
  const mixinRoot = path.join(root, 'catalog', 'mixins', folder);
  await mkdir(path.join(mixinRoot, 'files'), { recursive: true });
  await writeFile(path.join(mixinRoot, 'mixin.json'), JSON.stringify(manifest), 'utf8');
  if (includeAsset) {
    await writeFile(path.join(mixinRoot, 'files', 'base.md'), 'base', 'utf8');
  }
}

function createModule(id: string, overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    ...baseModule,
    id,
    name: id,
    managedPaths: [`managed/${id}/`],
    overridePaths: [`local/${id}/`],
    sourceAssets: [],
    ...overrides,
  };
}

function createCatalog(
  modules: ModuleManifest[],
  mixins: MixinManifest[] = [],
): Catalog {
  return {
    modules: new Map(modules.map((module) => [module.id, module])),
    mixins: new Map(mixins.map((mixin) => [mixin.id, mixin])),
    presets: new Map(),
  };
}

test('loadCatalog accepts valid references and assets', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule);
  await writeMixin(root, 'base-feature', baseMixin);
  await writePreset(root, ['base']);

  const catalog = await loadCatalog(root);

  expect([...catalog.modules.keys()]).toEqual(['base']);
  expect([...catalog.mixins.keys()]).toEqual(['mixin/base-feature']);
  expect([...catalog.presets.keys()]).toEqual(['test']);
});

test('loadCatalog discovers a conventional module detector', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule);
  await writeFile(
    path.join(root, 'catalog', 'modules', 'base', 'detect.mjs'),
    'export default function detect() { return { applies: true }; }',
    'utf8',
  );

  const catalog = await loadCatalog(root);

  expect(catalog.modules.get('base')?.detect).toBeTypeOf('function');
});

test('loadCatalog rejects a conventional detector without a default function', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule);
  await writeFile(
    path.join(root, 'catalog', 'modules', 'base', 'detect.mjs'),
    'export const detect = true;',
    'utf8',
  );

  await expect(loadCatalog(root)).rejects.toThrow(
    'Module base detector must default-export a function.',
  );
});

test('loadCatalog rejects detector path indirection in module manifests', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', {
    ...baseModule,
    detector: 'detect.mjs',
  } as ModuleManifest);

  await expect(loadCatalog(root)).rejects.toThrow('Unrecognized key');
});

test('loadCatalog rejects mixins that require unknown modules', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule);
  await writeMixin(root, 'base-feature', {
    ...baseMixin,
    requiresAll: ['missing'],
  });
  await writePreset(root, ['base']);

  await expect(loadCatalog(root)).rejects.toThrow(
    'Mixin mixin/base-feature requires unknown module: missing',
  );
});

test('loadCatalog rejects mixin references in presets', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule);
  await writeMixin(root, 'base-feature', baseMixin);
  await writePreset(root, ['mixin/base-feature']);

  await expect(loadCatalog(root)).rejects.toThrow(
    'Preset test cannot reference mixin: mixin/base-feature',
  );
});

test('loadCatalog rejects managed path ownership shared by a module and mixin', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule);
  await writeMixin(root, 'base-feature', {
    ...baseMixin,
    managedPaths: baseModule.managedPaths,
  });
  await writePreset(root, ['base']);

  await expect(loadCatalog(root)).rejects.toThrow(
    'Managed path managed/base/ is owned by both base and mixin/base-feature.',
  );
});

test('loadCatalog rejects unknown preset modules', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule);
  await writePreset(root, ['missing']);

  await expect(loadCatalog(root)).rejects.toThrow('Preset test references unknown module: missing');
});

test('loadCatalog rejects missing source assets with module context', async () => {
  const root = await createCatalogRoot();
  await writeModule(root, 'base', baseModule, false);
  await writePreset(root, ['base']);

  await expect(loadCatalog(root)).rejects.toThrow(
    'Module base source asset does not exist: files/base.md',
  );
});

test('resolveModules expands dependencies in stable topological order', () => {
  const catalog = createCatalog([
    createModule('feature', { dependsOn: ['base'] }),
    createModule('base'),
  ]);

  const resolution = resolveModules(catalog, ['feature', 'feature']);

  expect(resolution).toEqual({
    modules: ['base', 'feature'],
  });
});

test('resolveModules permits explicit selection before detector signals exist', () => {
  const catalog = createCatalog([
    createModule('lang/typescript'),
  ]);

  const resolution = resolveModules(catalog, ['lang/typescript']);

  expect(resolution).toEqual({
    modules: ['lang/typescript'],
  });
});

test('resolveModules rejects selected conflicts', () => {
  const catalog = createCatalog([
    createModule('first', { conflictsWith: ['second'] }),
    createModule('second'),
  ]);

  expect(() => resolveModules(catalog, ['second', 'first'])).toThrow(
    'Conflicting modules selected: first and second',
  );
});

test('resolveModules rejects direct mixin selection', () => {
  const catalog = createCatalog(
    [createModule('base')],
    [baseMixin],
  );

  expect(() => resolveModules(catalog, ['mixin/base-feature'])).toThrow(
    'Mixin cannot be selected directly: mixin/base-feature',
  );
});

test('resolveMixins activates satisfied mixins in stable ID order', () => {
  const catalog = createCatalog(
    [createModule('base'), createModule('feature')],
    [
      {
        ...baseMixin,
        id: 'mixin/z-feature',
        requiresAll: ['base', 'feature'],
      },
      {
        ...baseMixin,
        id: 'mixin/a-base',
      },
    ],
  );

  expect(resolveMixins(catalog, ['feature', 'base']).map((mixin) => mixin.id)).toEqual([
    'mixin/a-base',
    'mixin/z-feature',
  ]);
  expect(resolveMixins(catalog, ['base']).map((mixin) => mixin.id)).toEqual([
    'mixin/a-base',
  ]);
});
