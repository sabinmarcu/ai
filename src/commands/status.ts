import { Command } from 'clipanion';
import { loadCatalog } from '../lib/catalog.js';
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

    return 0;
  }
}
