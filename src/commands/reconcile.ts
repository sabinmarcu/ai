import {
  Command,
  Option,
} from 'clipanion';
import pc from 'picocolors';
import {
  applyReconciliation,
  planReconciliation,
  repairUnknownModules,
} from '../lib/reconcile.js';
import type { ReconciliationPlan } from '../lib/reconcile.js';
import { loadStackCatalog } from '../lib/stack-catalog.js';
import { readStack } from '../lib/stack.js';

export type ReconcileEntryState = 'ok' | 'added' | 'updated' | 'removed';

export interface ReconcileEntry {
  id: string;
  state: ReconcileEntryState;
}

const stateDisplay: Record<ReconcileEntryState, {
  color(value: string): string;
  label: string;
  symbol: string;
}> = {
  ok: {
    color: pc.green,
    label: 'all ok',
    symbol: '●',
  },
  added: {
    color: pc.blue,
    label: 'to be added',
    symbol: '+',
  },
  updated: {
    color: pc.yellow,
    label: 'to be updated',
    symbol: '◆',
  },
  removed: {
    color: pc.red,
    label: 'to be removed',
    symbol: '−',
  },
};

function entryState(
  id: string,
  additions: Set<string>,
  updates: Set<string>,
  removals: Set<string>,
): ReconcileEntryState {
  if (removals.has(id)) return 'removed';
  if (additions.has(id)) return 'added';
  if (updates.has(id)) return 'updated';
  return 'ok';
}

export function reconcileEntries(
  plan: ReconciliationPlan,
  repairedModules: Iterable<string> = [],
): { mixins: ReconcileEntry[]; modules: ReconcileEntry[] } {
  const repaired = new Set(repairedModules);
  const issueOwners = new Set(plan.managedIssues.map((issue) => issue.ownerId));
  const moduleAdditions = new Set(plan.effectiveAdditions);
  const moduleUpdates = new Set([
    ...plan.effectiveRemovals,
    ...plan.selectionAdditions,
    ...plan.selectionRemovals.filter((id) => !repaired.has(id)),
    ...issueOwners,
  ]);
  const moduleIds = new Set([
    ...plan.currentResolution.effectiveModules,
    ...plan.proposedResolution.effectiveModules,
    ...repaired,
  ]);
  const mixinAdditions = new Set(plan.mixinAdditions.map((mixin) => mixin.id));
  const mixinUpdates = new Set([
    ...plan.mixinRemovals.map((mixin) => mixin.id),
    ...issueOwners,
  ]);
  const mixinIds = new Set([
    ...plan.currentResolution.activeMixins.map((mixin) => mixin.id),
    ...plan.proposedResolution.activeMixins.map((mixin) => mixin.id),
  ]);

  return {
    modules: [...moduleIds].sort().map((id) => ({
      id,
      state: entryState(id, moduleAdditions, moduleUpdates, repaired),
    })),
    mixins: [...mixinIds].sort().map((id) => ({
      id,
      state: entryState(id, mixinAdditions, mixinUpdates, new Set()),
    })),
  };
}

function writeEntries(
  stdout: { write(value: string): unknown },
  label: string,
  entries: ReconcileEntry[],
): void {
  stdout.write(`\n${pc.bold(label)} (${entries.length})\n`);
  for (const entry of entries) {
    const display = stateDisplay[entry.state];
    stdout.write(`${display.color(display.symbol)} ${entry.id}  ${display.color(display.label)}\n`);
  }
}

const blockingIssueKinds = new Set(['drifted', 'stale-drifted', 'untracked']);

export function hasReconciliationErrors(
  plan: ReconciliationPlan,
  repairedModules: string[],
): boolean {
  return repairedModules.length > 0
    || plan.managedIssues.some((issue) => blockingIssueKinds.has(issue.kind));
}

function writeDiagnostics(
  stdout: { write(value: string): unknown },
  plan: ReconciliationPlan,
  repairedModules: string[],
): void {
  if (plan.managedIssues.length === 0 && repairedModules.length === 0) {
    stdout.write(`${pc.green('✓')} No managed file issues.\n`);
    return;
  }

  for (const moduleId of repairedModules) {
    stdout.write(`${pc.red('ERROR')} [unknown-module] ${moduleId}\n`);
    stdout.write('  The selected module is absent from the current catalog.\n');
  }
  for (const issue of plan.managedIssues) {
    const blocking = blockingIssueKinds.has(issue.kind);
    const severity = blocking ? pc.red('ERROR') : pc.yellow('WARNING');
    stdout.write(`${severity} [${issue.kind}] ${issue.path}\n`);
    stdout.write(`  Owner: ${issue.ownerId}\n`);
  }
}

function writePlan(
  stdout: { write(value: string): unknown },
  plan: ReconciliationPlan,
  repairedModules: string[],
): void {
  const entries = reconcileEntries(plan, repairedModules);
  stdout.write(`${pc.bold('Reconciliation')} · ${plan.target.path} (${plan.target.kind})\n`);
  writeEntries(stdout, 'Modules', entries.modules);
  writeEntries(stdout, 'Mixins', entries.mixins);

  stdout.write(`\n${pc.bold('Diagnostics')}\n`);
  writeDiagnostics(stdout, plan, repairedModules);
}

async function createReconciliationPlan(): Promise<{
  plan: ReconciliationPlan;
  repairedModules: string[];
}> {
  const stack = await readStack(process.cwd());
  if (!stack) {
    throw new Error('No .ai/stack.yml found. Run `ai init` first.');
  }
  const catalog = await loadStackCatalog(process.cwd(), stack);
  const repair = repairUnknownModules(catalog, stack);
  const plan = await planReconciliation(process.cwd(), catalog, repair.stack);
  plan.selectionRemovals = [
    ...new Set([...repair.removedModules, ...plan.selectionRemovals]),
  ].sort();
  return {
    plan,
    repairedModules: repair.removedModules,
  };
}

export class ReconcileCommand extends Command {
  static paths = [['reconcile']];

  static usage = Command.Usage({
    description: 'Review and reconcile detected modules and managed AI assets.',
  });

  apply = Option.Boolean('--apply', false, {
    description: 'Apply a clean reconciliation plan.',
  });

  repair = Option.Boolean('--repair', false, {
    description: 'Force reconciliation when unknown modules or managed-file errors exist.',
  });

  async execute(): Promise<number> {
    const initial = await createReconciliationPlan();
    const { plan } = initial;

    if (!this.apply && !this.repair) {
      writePlan(this.context.stdout, plan, initial.repairedModules);
      this.context.stdout.write('No changes applied. Review the plan, then run with --apply after approval.\n');
      return 0;
    }

    if (this.apply && this.repair) {
      this.context.stderr.write(`${pc.red('Error:')} Choose either --apply or --repair, not both.\n`);
      return 1;
    }

    const hasErrors = hasReconciliationErrors(plan, initial.repairedModules);
    if (this.repair && !hasErrors) {
      this.context.stdout.write(`${pc.green('State is clean.')} Repair is neither required nor permitted. Use --apply to apply the reconciliation plan.\n`);
      return 1;
    }

    if (this.apply && hasErrors) {
      this.context.stderr.write(`${pc.red('Reconciliation cannot be applied safely.')} Resolve the following issues or use --repair to force all planned changes.\n\n`);
      writeDiagnostics(this.context.stderr, plan, initial.repairedModules);
      return 1;
    }

    try {
      const result = await applyReconciliation(process.cwd(), plan, {
        force: this.repair,
      });
      const final = await createReconciliationPlan();
      const finalHasErrors = hasReconciliationErrors(final.plan, final.repairedModules);
      const finalHasIssues = final.plan.managedIssues.length > 0;
      const finalHasChanges = final.plan.selectionAdditions.length > 0
        || final.plan.selectionRemovals.length > 0
        || final.plan.effectiveAdditions.length > 0
        || final.plan.effectiveRemovals.length > 0
        || final.plan.mixinAdditions.length > 0
        || final.plan.mixinRemovals.length > 0;
      const succeeded = !finalHasErrors && !finalHasIssues && !finalHasChanges;
      const outcome = succeeded
        ? pc.green('Reconciliation succeeded.')
        : pc.red('Reconciliation finished with unresolved issues.');
      this.context.stdout.write(`${outcome} Applied ${result.files} managed files and removed ${result.removed} stale managed files.\n\n`);
      writePlan(this.context.stdout, final.plan, final.repairedModules);
      this.context.stdout.write(`\nRoot AI reference: ${result.addedRootReference ? 'added' : 'current'}\n`);
      if (!succeeded) return 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.context.stderr.write(`${pc.red('Reconciliation failed:')} ${message}\n`);
      return 1;
    }
    return 0;
  }
}
