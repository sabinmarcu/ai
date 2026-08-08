import { Command } from 'clipanion';
import { readStack } from '../lib/stack.js';

export class ApplyCommand extends Command {
  static paths = [['apply']];

  static usage = Command.Usage({
    description: 'Apply managed module assets to the current repository.',
    details: 'Phase 01 provides scaffolding only. Materialization lands in Phase 03.',
  });

  async execute(): Promise<number> {
    const stack = await readStack(process.cwd());
    if (!stack) {
      throw new Error('No .ai/stack.yml found. Run `ai-lib init` first.');
    }

    this.context.stdout.write('Apply is currently a scaffold placeholder.\n');
    this.context.stdout.write(`Stack has ${stack.modules.length} modules selected.\n`);
    return 0;
  }
}
