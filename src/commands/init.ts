import {
  Command,
  Option,
} from 'clipanion';
import { loadCatalog } from '../lib/catalog.js';
import { resolveModules } from '../lib/resolve.js';
import { writeStack } from '../lib/stack.js';

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

    const requestedModules = new Set<string>();

    for (const presetId of presetIds) {
      const preset = catalog.presets.get(presetId);
      if (!preset) {
        throw new Error(`Unknown preset: ${presetId}`);
      }

      for (const moduleId of preset.modules) {
        requestedModules.add(moduleId);
      }
    }

    for (const moduleId of explicitModules) {
      requestedModules.add(moduleId);
    }

    if (requestedModules.size === 0) {
      requestedModules.add('global/core');
    }

    const resolution = resolveModules(catalog, requestedModules);

    await writeStack(process.cwd(), {
      version: 1,
      createdAt: new Date().toISOString(),
      presets: presetIds,
      modules: resolution.modules,
    });

    this.context.stdout.write(`Wrote .ai/stack.yml with ${resolution.modules.length} modules.\n`);
    return 0;
  }
}
