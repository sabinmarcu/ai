import type {
  ActiveMixin,
  Catalog,
} from '../types.js';

export interface ModuleResolution {
  modules: string[];
}

export function resolveModules(
  catalog: Catalog,
  requestedModuleIds: Iterable<string>,
): ModuleResolution {
  const requested = [...new Set(requestedModuleIds)].sort();
  const resolved = new Set<string>();
  const resolving = new Set<string>();

  const visit = (moduleId: string): void => {
    if (resolved.has(moduleId)) {
      return;
    }

    const module = catalog.modules.get(moduleId);
    if (!module) {
      if (catalog.mixins.has(moduleId)) {
        throw new Error(`Mixin cannot be selected directly: ${moduleId}`);
      }
      throw new Error(`Unknown module: ${moduleId}`);
    }

    if (resolving.has(moduleId)) {
      throw new Error(`Module dependency cycle encountered while resolving: ${moduleId}`);
    }

    resolving.add(moduleId);
    for (const dependencyId of [...(module.dependsOn ?? [])].sort()) {
      visit(dependencyId);
    }
    resolving.delete(moduleId);
    resolved.add(moduleId);
  };

  for (const moduleId of requested) {
    visit(moduleId);
  }

  for (const moduleId of resolved) {
    const module = catalog.modules.get(moduleId);
    for (const conflictId of module?.conflictsWith ?? []) {
      if (resolved.has(conflictId)) {
        throw new Error(`Conflicting modules selected: ${moduleId} and ${conflictId}`);
      }
    }
  }

  return {
    modules: [...resolved],
  };
}

export function resolveMixins(
  catalog: Catalog,
  effectiveModuleIds: Iterable<string>,
): ActiveMixin[] {
  const effectiveModules = new Set(effectiveModuleIds);

  return [...catalog.mixins.values()]
    .filter((mixin) => (
      mixin.requiresAll.every((moduleId) => effectiveModules.has(moduleId))
    ))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((mixin) => ({
      id: mixin.id,
      reason: `Requires active modules: ${mixin.requiresAll.join(', ')}`,
      requiresAll: [...mixin.requiresAll],
    }));
}
