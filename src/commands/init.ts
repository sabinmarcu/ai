import {
  Command,
  Option,
} from 'clipanion';
import { loadCatalog } from '../lib/catalog.js';
import {
  applyReconciliation,
  planReconciliation,
} from '../lib/reconcile.js';
import {
  STACK_VERSION,
} from '../lib/stack.js';
import type { StackConfig } from '../types.js';

export function parseAssetMode(value: string): StackConfig['assetMode'] {
  if (value !== 'materialized' && value !== 'source') {
    throw new Error(`Unsupported asset mode: ${value}. Expected materialized or source.`);
  }
  return value;
}

export class InitCommand extends Command {
  static paths = [['init']];

  static usage = Command.Usage({
    description: 'Create .ai/stack.yml from selected presets and modules.',
    details: [
      'Examples:',
      '  ai init --preset node-web --module unix/zsh',
      '  ai init --asset-mode source',
      '',
      'Asset modes: materialized (default) or source.',
    ].join('\n'),
  });

  assetMode = Option.String('--asset-mode', 'materialized', {
    description: 'Asset handling mode: materialized or source.',
  });

  presetIds = Option.Array('-p,--preset', [], {
    description: 'Preset to include; may be repeated.',
  });

  explicitModules = Option.Array('-m,--module', [], {
    description: 'Module to include; may be repeated.',
  });

  async execute(): Promise<number> {
    const cwd = process.cwd();
    const assetMode = parseAssetMode(this.assetMode);
    const explicitModules = [...this.explicitModules];
    const presetIds = [...this.presetIds];
    const catalog = await loadCatalog(assetMode === 'source' ? cwd : undefined);

    if (presetIds.length === 0 && explicitModules.length === 0) {
      explicitModules.push('global/core');
    }

    const selectedStack = {
      presets: [...new Set(presetIds)].sort(),
      modules: [...new Set(explicitModules)].sort(),
    };
    const stack: StackConfig = {
      version: STACK_VERSION,
      createdAt: new Date().toISOString(),
      ...(assetMode === 'source'
        ? {
          assetMode: 'source',
          catalogRoot: 'catalog',
        } as const
        : { assetMode: 'materialized' } as const),
      ...selectedStack,
    };

    const plan = await planReconciliation(cwd, catalog, stack);
    const result = await applyReconciliation(cwd, plan);

    this.context.stdout.write(`Initialized AI stack with ${plan.proposedResolution.effectiveModules.length} effective modules.\n`);
    this.context.stdout.write(`Applied ${result.files} managed files.\n`);
    this.context.stdout.write(`Asset mode: ${assetMode}\n`);
    return 0;
  }
}
