import {
  expect,
  test,
} from 'vitest';
import { AiCli } from './cli-errors.js';

test('formats command failures as user-facing errors without a stack trace', () => {
  const cli = new AiCli({
    binaryName: 'ai',
    enableColors: false,
  });
  const output = cli.error(new Error('Stack is invalid.'));

  expect(output).toBe('Error: Stack is invalid.\n');
  expect(output).not.toContain('Internal Error');
  expect(output).not.toContain('at ');
});

test('formats nested error causes as diagnostic details', () => {
  const cli = new AiCli({
    binaryName: 'ai',
    enableColors: false,
  });
  const output = cli.error(new Error('Catalog loading failed.', {
    cause: new Error('Invalid module manifest.'),
  }));

  expect(output).toBe([
    'Error: Catalog loading failed.',
    '  Caused by: Invalid module manifest.',
    '',
  ].join('\n'));
});
