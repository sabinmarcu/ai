import path from 'node:path';
import {
  Command,
  Option,
} from 'clipanion';
import {
  buildCompleteMaterializationPlan,
  inspectMaterialization,
} from '../lib/materialize.js';
import { resolveStack } from '../lib/resolve.js';
import { loadStackCatalog } from '../lib/stack-catalog.js';
import { readStack } from '../lib/stack.js';

export function parseVerbosity(shortVerbosity: number, longVerbosity?: string): number {
  if (longVerbosity === undefined) {
    return Math.min(shortVerbosity, 2);
  }
  if (!/^[0-2]$/u.test(longVerbosity)) {
    throw new Error(`Unsupported verbosity: ${longVerbosity}. Expected 0, 1, or 2.`);
  }
  return Math.max(Math.min(shortVerbosity, 2), Number(longVerbosity));
}

function displayPath(cwd: string, sourceRoot: string): string {
  const relativePath = path.relative(cwd, sourceRoot);
  return relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)
    ? sourceRoot
    : relativePath || '.';
}

export class StatusCommand extends Command {
  static paths = [['status']];

  static usage = Command.Usage({
    description: 'Show stack and catalog status.',
  });

  verbose = Option.Counter('-v', 0, {
    description: 'Increase detail; repeat to include catalog paths.',
  });

  verbosity = Option.String('--verbosity', {
    description: 'Detail level: 0, 1, or 2.',
  });

  async execute(): Promise<number> {
    const stack = await readStack(process.cwd());

    if (!stack) {
      this.context.stdout.write('No .ai/stack.yml present in current repository.\n');
      return 0;
    }

    const catalog = await loadStackCatalog(process.cwd(), stack);
    const verbosity = parseVerbosity(this.verbose, this.verbosity);

    const unknownModules = stack.modules.filter((moduleId) => !catalog.modules.has(moduleId));
    if (unknownModules.length > 0) {
      this.context.stdout.write('Unknown modules in stack:\n');
      for (const moduleId of unknownModules) {
        this.context.stdout.write(`- ${moduleId}\n`);
      }
    }

    const unknownPresets = stack.presets.filter((presetId) => !catalog.presets.has(presetId));
    if (unknownPresets.length > 0) {
      this.context.stdout.write('Unknown presets in stack:\n');
      for (const presetId of unknownPresets) {
        this.context.stdout.write(`- ${presetId}\n`);
      }
    }

    if (unknownModules.length > 0 || unknownPresets.length > 0) {
      return 1;
    }

    const resolution = resolveStack(catalog, stack);
    this.context.stdout.write(`Modules (${resolution.effectiveModules.length}):\n`);
    for (const moduleId of resolution.effectiveModules) {
      const sourceRoot = catalog.modules.get(moduleId)?.sourceRoot;
      const source = verbosity >= 2 && sourceRoot
        ? ` (${displayPath(process.cwd(), sourceRoot)})`
        : '';
      this.context.stdout.write(`- ${moduleId}${source}\n`);
    }
    this.context.stdout.write(`Mixins: ${resolution.activeMixins.length}\n`);
    if (verbosity >= 1) {
      for (const activeMixin of resolution.activeMixins) {
        const sourceRoot = catalog.mixins.get(activeMixin.id)?.sourceRoot;
        const source = verbosity >= 2 && sourceRoot
          ? ` (${displayPath(process.cwd(), sourceRoot)})`
          : '';
        this.context.stdout.write(`- ${activeMixin.id}${source}\n`);
      }
    }
    this.context.stdout.write(`Asset mode: ${stack.assetMode}\n`);

    const plan = await buildCompleteMaterializationPlan(catalog, resolution, {
      assetMode: stack.assetMode,
      targetRoot: process.cwd(),
    });
    const issues = await inspectMaterialization(process.cwd(), plan);
    this.context.stdout.write(`Managed files: ${plan.length}\n`);
    if (issues.length === 0) {
      this.context.stdout.write('Managed status: current\n');
      return 0;
    }

    this.context.stdout.write('Managed issues:\n');
    for (const issue of issues) {
      this.context.stdout.write(`- ${issue.kind}: ${issue.path} (${issue.ownerId})\n`);
    }

    return 1;
  }
}
