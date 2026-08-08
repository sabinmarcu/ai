import path from 'node:path';
import type {
  Catalog,
  StackConfig,
} from '../types.js';
import { loadCatalog } from './catalog.js';

export function resolveStackCatalogRoot(cwd: string, stack: StackConfig): string | undefined {
  if (stack.assetMode === 'materialized') {
    return undefined;
  }

  if (path.isAbsolute(stack.catalogRoot)) {
    throw new Error('Source catalog root must be repository-relative.');
  }
  const targetRoot = path.resolve(cwd);
  const catalogPackageRoot = path.resolve(targetRoot, stack.catalogRoot, '..');
  if (
    catalogPackageRoot !== targetRoot
    && !catalogPackageRoot.startsWith(`${targetRoot}${path.sep}`)
  ) {
    throw new Error('Source catalog root must be contained in the target repository.');
  }
  return catalogPackageRoot;
}

export function loadStackCatalog(cwd: string, stack: StackConfig): Promise<Catalog> {
  return loadCatalog(resolveStackCatalogRoot(cwd, stack));
}
