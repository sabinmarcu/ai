import {
  Cli,
} from 'clipanion';
import {
  expect,
  test,
} from 'vitest';
import {
  InitCommand,
  parseAssetMode,
} from './init.js';

function createCli(): Cli {
  const cli = new Cli({
    binaryName: 'ai-lib',
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
