// Invalidation must traverse every public utility export.
// eslint-disable-next-line import/no-namespace
import * as repoUtilities from '@sabinmarcu/utils-repo';

interface MoizedFunction {
  (...arguments_: unknown[]): unknown;
  clear(): unknown;
  isMoized: true;
}

function isMoizedFunction(value: unknown): value is MoizedFunction {
  return typeof value === 'function'
    && Reflect.get(value, 'isMoized') === true
    && typeof Reflect.get(value, 'clear') === 'function';
}

export function clearRepoUtilityCaches(): number {
  const visited = new Set<unknown>();
  const memoizedFunctions = new Set<MoizedFunction>();

  const visit = (value: unknown): void => {
    if (
      value === null
      || (typeof value !== 'object' && typeof value !== 'function')
      || visited.has(value)
    ) {
      return;
    }

    visited.add(value);
    if (isMoizedFunction(value)) {
      memoizedFunctions.add(value);
      return;
    }

    if (typeof value === 'object') {
      for (const child of Object.values(value)) {
        visit(child);
      }
    }
  };

  visit(repoUtilities);
  for (const memoizedFunction of memoizedFunctions) {
    memoizedFunction.clear();
  }

  return memoizedFunctions.size;
}

export function withRepoUtilityCacheScopeSync<T>(operation: () => T): T {
  clearRepoUtilityCaches();
  try {
    return operation();
  } finally {
    clearRepoUtilityCaches();
  }
}

export async function withRepoUtilityCacheScope<T>(
  operation: () => Promise<T> | T,
): Promise<T> {
  clearRepoUtilityCaches();
  try {
    return await operation();
  } finally {
    clearRepoUtilityCaches();
  }
}
