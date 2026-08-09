import {
  Cli,
} from 'clipanion';
import {
  readFile,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  expect,
  test,
} from 'vitest';
import { readStack } from '../lib/stack.js';
import {
  InitCommand,
  parseAssetMode,
} from './init.js';

function createCli(): Cli {
  const cli = new Cli({
    binaryName: 'ai',
  });
  cli.register(InitCommand);
  return cli;
}

test('parses native source asset mode with preset and module selections', () => {
  const command = createCli().process([
    'init',
    '--asset-mode',
    'source',
    '--preset',
    'universal',
    '-m',
    'arch/node-tool',
  ]) as InitCommand;

  expect(command.assetMode).toBe('source');
  expect(command.explicitModules).toEqual(['arch/node-tool']);
  expect(command.presetIds).toEqual(['universal']);
});

test('defaults to materialized asset mode', () => {
  const command = createCli().process(['init']) as InitCommand;

  expect(command.assetMode).toBe('materialized');
  expect(command.explicitModules).toEqual([]);
  expect(command.presetIds).toEqual([]);
});

test('rejects unsupported asset modes', () => {
  expect(() => parseAssetMode('remote')).toThrow(
    'Unsupported asset mode: remote. Expected materialized or source.',
  );
});

test('rejects missing values and the legacy local flag through Clipanion', () => {
  expect(() => createCli().process(['init', '--asset-mode'])).toThrow();
  expect(() => createCli().process(['init', '--local'])).toThrow();
});

test('initializes detected modules and applies the managed AI setup', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-init-'));
  const previousCwd = process.cwd();
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    devDependencies: {
      '@types/node': '^24.0.0',
      typescript: '^5.8.3',
    },
  }), 'utf8');

  try {
    process.chdir(root);
    const cli = createCli();
    const exitCode = await cli.run(['init']);

    expect(exitCode).toBe(0);
    const stack = await readStack(root);
    expect(stack?.modules).toContain('lang/typescript');
    expect(await readFile(path.join(root, '.ai/AGENTS.md'), 'utf8')).toContain('# AI Stack Entrypoint');
    expect(await readFile(path.join(root, 'AGENTS.md'), 'utf8')).toContain('](.ai/AGENTS.md)');
  } finally {
    process.chdir(previousCwd);
    await rm(root, {
      recursive: true,
      force: true,
    });
  }
});
