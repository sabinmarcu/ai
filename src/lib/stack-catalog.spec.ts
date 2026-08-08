import {
  expect,
  test,
} from 'vitest';
import type { StackConfig } from '../types.js';
import { resolveStackCatalogRoot } from './stack-catalog.js';

function sourceStack(catalogRoot: string): StackConfig {
  return {
    version: 2,
    createdAt: '2026-08-08T00:00:00.000Z',
    assetMode: 'source',
    catalogRoot,
    presets: [],
    modules: [],
  };
}

test('resolves a repository-contained source catalog package root', () => {
  expect(resolveStackCatalogRoot('/repo', sourceStack('catalog'))).toBe('/repo');
});

test('rejects source catalogs outside the target repository', () => {
  expect(() => resolveStackCatalogRoot('/repo', sourceStack('../catalog'))).toThrow(
    'Source catalog root must be contained in the target repository.',
  );
  expect(() => resolveStackCatalogRoot('/repo', sourceStack('/global/catalog'))).toThrow(
    'Source catalog root must be repository-relative.',
  );
});
