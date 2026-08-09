import { Cli } from 'clipanion';
import {
  expect,
  test,
} from 'vitest';
import {
  parseVerbosity,
  StatusCommand,
} from './status.js';

function parseStatus(arguments_: string[]): StatusCommand {
  const cli = new Cli({ binaryName: 'ai' });
  cli.register(StatusCommand);
  return cli.process(['status', ...arguments_]) as StatusCommand;
}

test('supports repeatable short verbosity and an explicit long level', () => {
  expect(parseVerbosity(parseStatus([]).verbose)).toBe(0);
  expect(parseVerbosity(parseStatus(['-v']).verbose)).toBe(1);
  expect(parseVerbosity(parseStatus(['-vv']).verbose)).toBe(2);
  const explicit = parseStatus(['--verbosity', '2']);
  expect(parseVerbosity(explicit.verbose, explicit.verbosity)).toBe(2);
});

test('rejects unsupported explicit verbosity levels', () => {
  expect(() => parseVerbosity(0, '3')).toThrow(
    'Unsupported verbosity: 3. Expected 0, 1, or 2.',
  );
});
