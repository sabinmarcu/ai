import { Command } from 'clipanion';
import { loadStackCatalog } from '../lib/stack-catalog.js';
import { readStack } from '../lib/stack.js';

export class VerifyCommand extends Command {
  static paths = [['verify']];

  static usage = Command.Usage({
    description: 'Validate stack references against the local catalog.',
  });

  async execute(): Promise<number> {
    const stack = await readStack(process.cwd());
    if (!stack) {
      throw new Error('No .ai/stack.yml found. Run `ai-lib init` first.');
    }

    const catalog = await loadStackCatalog(process.cwd(), stack);
    const invalid = stack.modules.filter((moduleId) => !catalog.modules.has(moduleId));

    if (invalid.length > 0) {
      this.context.stderr.write('Stack includes unknown modules:\n');
      for (const moduleId of invalid) {
        this.context.stderr.write(`- ${moduleId}\n`);
      }
      return 1;
    }

    this.context.stdout.write('Stack is valid against current catalog.\n');
    return 0;
  }
}
