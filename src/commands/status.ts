import { Command } from 'clipanion';
import { loadCatalog } from '../lib/catalog.js';
import {
  buildCompleteMaterializationPlan,
  inspectMaterialization,
} from '../lib/materialize.js';
import { resolveStack } from '../lib/resolve.js';
import { readStack } from '../lib/stack.js';

export class StatusCommand extends Command {
  static paths = [['status']];

  static usage = Command.Usage({
    description: 'Show stack and catalog status.',
  });

  async execute(): Promise<number> {
    const stack = await readStack(process.cwd());
    const catalog = await loadCatalog();

    this.context.stdout.write(`Catalog modules: ${catalog.modules.size}\n`);
    this.context.stdout.write(`Catalog mixins: ${catalog.mixins.size}\n`);
    this.context.stdout.write(`Catalog presets: ${catalog.presets.size}\n`);

    if (!stack) {
      this.context.stdout.write('No .ai/stack.yml present in current repository.\n');
      return 0;
    }

    this.context.stdout.write(`Stack modules: ${stack.modules.length}\n`);
    this.context.stdout.write(`Stack presets: ${stack.presets.length}\n`);

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
    this.context.stdout.write(`Effective modules: ${resolution.effectiveModules.length}\n`);
    this.context.stdout.write(`Active mixins: ${resolution.activeMixins.length}\n`);
    for (const mixin of resolution.activeMixins) {
      this.context.stdout.write(`- ${mixin.id}: ${mixin.reason}\n`);
    }

    const plan = await buildCompleteMaterializationPlan(catalog, resolution);
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
