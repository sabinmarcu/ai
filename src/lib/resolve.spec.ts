import {
  expect,
  test,
} from 'vitest';
import type {
  Catalog,
  MixinManifest,
  ModuleManifest,
  PresetManifest,
} from '../types.js';
import { resolveStack } from './resolve.js';

function createModule(id: string, dependsOn: string[] = []): ModuleManifest {
  return {
    id,
    name: id,
    description: id,
    version: '1.0.0',
    category: 'test',
    managedPaths: [],
    overridePaths: [],
    dependsOn,
  };
}

function createCatalog(): Catalog {
  const modules = [
    createModule('base'),
    createModule('feature', ['base']),
    createModule('tooling'),
  ];
  const mixin: MixinManifest = {
    id: 'mixin/feature-tooling',
    name: 'Feature tooling',
    description: 'Feature tooling',
    version: '1.0.0',
    managedPaths: [],
    overridePaths: [],
    requiresAll: ['feature', 'tooling'],
  };
  const preset: PresetManifest = {
    id: 'feature',
    name: 'Feature',
    description: 'Feature',
    modules: ['feature'],
  };

  return {
    modules: new Map(modules.map((module) => [module.id, module])),
    mixins: new Map([[mixin.id, mixin]]),
    presets: new Map([[preset.id, preset]]),
  };
}

test('preserves requested provenance while resolving dependencies and mixins', () => {
  const resolution = resolveStack(createCatalog(), {
    presets: ['feature'],
    modules: ['tooling'],
  });

  expect(resolution).toEqual({
    requestedModules: ['feature', 'tooling'],
    effectiveModules: ['base', 'feature', 'tooling'],
    activeMixins: [{
      id: 'mixin/feature-tooling',
      reason: 'Requires active modules: feature, tooling',
      requiresAll: ['feature', 'tooling'],
    }],
  });
});

test('produces identical effective results regardless of selection order', () => {
  const catalog = createCatalog();

  const first = resolveStack(catalog, {
    presets: ['feature'],
    modules: ['tooling', 'feature'],
  });
  const second = resolveStack(catalog, {
    presets: ['feature', 'feature'],
    modules: ['feature', 'tooling'],
  });

  expect(second).toEqual(first);
});

test('rejects unknown presets', () => {
  expect(() => resolveStack(createCatalog(), {
    presets: ['missing'],
    modules: [],
  })).toThrow('Unknown preset: missing');
});
