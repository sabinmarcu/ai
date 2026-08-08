#!/usr/bin/env node

import {
  Builtins,
  Cli,
} from 'clipanion';
import { ApplyCommand } from './commands/apply.js';
import { DetectCommand } from './commands/detect.js';
import { InitCommand } from './commands/init.js';
import { StatusCommand } from './commands/status.js';
import { VerifyCommand } from './commands/verify.js';

const cli = new Cli({
  binaryLabel: 'AI Library CLI',
  binaryName: 'ai-lib',
  binaryVersion: '0.1.0',
});

cli.register(ApplyCommand);
cli.register(DetectCommand);
cli.register(InitCommand);
cli.register(StatusCommand);
cli.register(VerifyCommand);
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);

await cli.runExit(process.argv.slice(2), Cli.defaultContext);
