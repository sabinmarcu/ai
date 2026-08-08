import {
  expect,
  test,
} from 'vitest';
import { withRepoUtilityCacheScope } from './repo-utility-cache.js';

function noop(): void {}

test('serializes operations that share repository utility caches', async () => {
  const events: string[] = [];
  let releaseFirst: () => void = noop;
  let markFirstStarted: () => void = noop;
  const firstStarted = new Promise<void>((resolve) => {
    markFirstStarted = resolve;
  });
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = withRepoUtilityCacheScope(async () => {
    events.push('first:start');
    markFirstStarted();
    await firstGate;
    events.push('first:end');
  });
  await firstStarted;
  const second = withRepoUtilityCacheScope(() => {
    events.push('second:start');
  });

  await Promise.resolve();
  expect(events).toEqual(['first:start']);
  releaseFirst();
  await Promise.all([first, second]);
  expect(events).toEqual(['first:start', 'first:end', 'second:start']);
});

test('allows nested work to reuse the active operation scope', async () => {
  const events: string[] = [];

  await withRepoUtilityCacheScope(async () => {
    events.push('outer');
    await withRepoUtilityCacheScope(() => {
      events.push('inner');
    });
  });

  expect(events).toEqual(['outer', 'inner']);
});
