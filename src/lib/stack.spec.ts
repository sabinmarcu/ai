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
import type { StackConfig } from '../types.js';
import {
  readStack,
  STACK_VERSION,
  writeStack,
} from './stack.js';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, {
    recursive: true,
    force: true,
  })));
});

async function createTemporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-lib-stack-'));
  temporaryRoots.push(root);
  return root;
}

function createStack(): StackConfig {
  return {
    version: STACK_VERSION,
    createdAt: '2026-08-08T00:00:00.000Z',
    assetMode: 'materialized',
    presets: ['universal'],
    modules: ['global/core'],
  };
}

test('returns null when the stack file does not exist', async () => {
  const root = await createTemporaryRoot();

  await expect(readStack(root)).resolves.toBeNull();
});

test('round-trips a valid current stack', async () => {
  const root = await createTemporaryRoot();
  const stack = createStack();

  await writeStack(root, stack);

  await expect(readStack(root)).resolves.toEqual(stack);
});

test('rejects malformed stack state', async () => {
  const root = await createTemporaryRoot();
  await mkdir(path.join(root, '.ai'));
  await writeFile(path.join(root, '.ai', 'stack.yml'), 'modules: [', 'utf8');

  await expect(readStack(root)).rejects.toThrow();
});

test('rejects unsupported stack versions when reading and writing', async () => {
  const root = await createTemporaryRoot();
  await mkdir(path.join(root, '.ai'));
  await writeFile(path.join(root, '.ai', 'stack.yml'), [
    'version: 3',
    'createdAt: 2026-08-08T00:00:00.000Z',
    'assetMode: materialized',
    'presets: []',
    'modules: []',
  ].join('\n'), 'utf8');

  await expect(readStack(root)).rejects.toThrow();
  await expect(writeStack(root, {
    ...createStack(),
    version: 3,
  } as unknown as StackConfig)).rejects.toThrow();
});

test('round-trips source mode with a repository-relative catalog', async () => {
  const root = await createTemporaryRoot();
  const stack: StackConfig = {
    ...createStack(),
    assetMode: 'source',
    catalogRoot: 'catalog',
  };

  await writeStack(root, stack);

  await expect(readStack(root)).resolves.toEqual(stack);
});
