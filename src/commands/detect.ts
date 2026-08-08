import { Command } from 'clipanion';
import { loadCatalog } from '../lib/catalog.js';
import {
  detectRepository,
  resolveDetectedRepository,
} from '../lib/detect.js';

export class DetectCommand extends Command {
  static paths = [['detect']];

  static usage = Command.Usage({
    description: 'Detect suggested modules for the current repository.',
  });

  async execute(): Promise<number> {
    const catalog = await loadCatalog();
    const repository = await detectRepository(catalog, process.cwd());
    const detection = resolveDetectedRepository(catalog, repository);
    this.context.stdout.write(`Repository: ${detection.root}\n`);

    for (const target of detection.targets) {
      this.context.stdout.write(`\n${target.path} (${target.kind})\n`);
      this.context.stdout.write('  Effective modules:\n');
      for (const moduleId of target.effectiveModules) {
        this.context.stdout.write(`  - ${moduleId}\n`);
      }
      if (target.activeMixins.length > 0) {
        this.context.stdout.write('  Active mixins:\n');
        for (const mixin of target.activeMixins) {
          this.context.stdout.write(`  - ${mixin.id}: ${mixin.reason}\n`);
        }
      }
    }

    return 0;
  }
}
