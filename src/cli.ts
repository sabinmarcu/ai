#!/usr/bin/env node

import { createRequire } from 'node:module';
import {
  Builtins,
  Cli,
} from 'clipanion';
import { ApplyCommand } from './commands/apply.js';
import { DetectCommand } from './commands/detect.js';
import { InitCommand } from './commands/init.js';
import { ReconcileCommand } from './commands/reconcile.js';
import { StatusCommand } from './commands/status.js';
import { VerifyCommand } from './commands/verify.js';
import { withRepoUtilityCacheScope } from './lib/repo-utility-cache.js';

const targetRoot = process.env.AI_TARGET_ROOT;
if (targetRoot) {
  Reflect.deleteProperty(process.env, 'AI_TARGET_ROOT');
  process.chdir(targetRoot);
}

const packageManifest = createRequire(import.meta.url)('../package.json') as { version: string };

const cli = new Cli({
  binaryLabel: 'AI Library CLI',
  binaryName: 'ai',
  binaryVersion: packageManifest.version,
});

cli.register(ApplyCommand);
cli.register(DetectCommand);
cli.register(InitCommand);
cli.register(ReconcileCommand);
cli.register(StatusCommand);
cli.register(VerifyCommand);
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);

await withRepoUtilityCacheScope(() => (
  cli.runExit(process.argv.slice(2), Cli.defaultContext)
));
