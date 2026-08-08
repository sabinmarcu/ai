import {
  Command,
  Option,
} from 'clipanion';
import { loadCatalog } from '../lib/catalog.js';
import { resolveStack } from '../lib/resolve.js';
import {
  STACK_VERSION,
  writeStack,
} from '../lib/stack.js';

function collectArgumentValues(arguments_: string[], names: string[]): string[] {
  const values: string[] = [];

  for (let index = 0; index < arguments_.length; index += 1) {
    const token = arguments_[index];
    if (names.includes(token)) {
      const next = arguments_[index + 1];
      if (next && !next.startsWith('-')) {
        values.push(next);
        index += 1;
      }
    }
  }

  return values;
}

export class InitCommand extends Command {
  static paths = [['init']];

  static usage = Command.Usage({
    description: 'Create .ai/stack.yml from selected presets and modules.',
    details: 'Example: ai-lib init --preset node-web --module unix/zsh',
  });

  args = Option.Proxy();

  async execute(): Promise<number> {
    const catalog = await loadCatalog();

    const presetIds = collectArgumentValues(this.args, ['--preset', '-p']);
    const explicitModules = collectArgumentValues(this.args, ['--module', '-m']);

    if (presetIds.length === 0 && explicitModules.length === 0) {
      explicitModules.push('global/core');
    }

    const selectedStack = {
      presets: [...new Set(presetIds)].sort(),
      modules: [...new Set(explicitModules)].sort(),
    };
    const resolution = resolveStack(catalog, selectedStack);

    await writeStack(process.cwd(), {
      version: STACK_VERSION,
      createdAt: new Date().toISOString(),
      ...selectedStack,
    });

    this.context.stdout.write(`Wrote .ai/stack.yml with ${resolution.effectiveModules.length} effective modules.\n`);
    return 0;
  }
}
