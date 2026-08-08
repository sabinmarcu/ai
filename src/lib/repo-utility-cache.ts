import { AsyncLocalStorage } from 'node:async_hooks';
// Invalidation must traverse every public utility export.
// eslint-disable-next-line import/no-namespace
import * as repoUtilities from '@sabinmarcu/utils-repo';

interface MoizedFunction {
  (...arguments_: unknown[]): unknown;
  clear(): unknown;
  isMoized: true;
}

let operationQueue = Promise.resolve();
const operationScope = new AsyncLocalStorage<boolean>();

function noop(): void {}

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

export async function withRepoUtilityCacheScope<T>(
  operation: () => Promise<T> | T,
): Promise<T> {
  if (operationScope.getStore()) {
    return operation();
  }

  const previousOperation = operationQueue;
  let releaseOperation: () => void = noop;
  operationQueue = new Promise<void>((resolve) => {
    releaseOperation = resolve;
  });

  await previousOperation;
  clearRepoUtilityCaches();
  try {
    return await operationScope.run(true, operation);
  } finally {
    clearRepoUtilityCaches();
    releaseOperation();
  }
}
