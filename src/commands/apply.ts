import { Command } from 'clipanion';
import { loadCatalog } from '../lib/catalog.js';
import {
  applyMaterialization,
  buildCompleteMaterializationPlan,
  ensureRootEntrypointReference,
} from '../lib/materialize.js';
import { resolveStack } from '../lib/resolve.js';
import { readStack } from '../lib/stack.js';

export class ApplyCommand extends Command {
  static paths = [['apply']];

  static usage = Command.Usage({
    description: 'Apply managed module assets to the current repository.',
    details: 'Materialize effective module and active mixin assets, repairing managed drift.',
  });

  async execute(): Promise<number> {
    const stack = await readStack(process.cwd());
    if (!stack) {
      throw new Error('No .ai/stack.yml found. Run `ai-lib init` first.');
    }

    const catalog = await loadCatalog();
    const resolution = resolveStack(catalog, stack);
    const plan = await buildCompleteMaterializationPlan(catalog, resolution);
    const result = await applyMaterialization(process.cwd(), plan);
    const addedRootReference = await ensureRootEntrypointReference(process.cwd());

    this.context.stdout.write(`Applied ${result.files} managed files.\n`);
    this.context.stdout.write(`Removed ${result.removed} stale managed files.\n`);
    this.context.stdout.write(`Root AI reference: ${addedRootReference ? 'added' : 'current'}\n`);
    return 0;
  }
}
