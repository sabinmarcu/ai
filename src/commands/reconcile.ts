import {
  Command,
  Option,
} from 'clipanion';
import {
  applyReconciliation,
  planReconciliation,
} from '../lib/reconcile.js';
import type { ReconciliationPlan } from '../lib/reconcile.js';
import { loadStackCatalog } from '../lib/stack-catalog.js';
import { readStack } from '../lib/stack.js';

function writeList(
  stdout: { write(value: string): unknown },
  label: string,
  values: string[],
): void {
  stdout.write(`${label}: ${values.length}\n`);
  for (const value of values) {
    stdout.write(`- ${value}\n`);
  }
}

function writePlan(stdout: { write(value: string): unknown }, plan: ReconciliationPlan): void {
  stdout.write(`Target: ${plan.target.path} (${plan.target.kind})\n`);
  writeList(stdout, 'Detected modules', plan.detectedModules);
  writeList(stdout, 'Selection additions', plan.selectionAdditions);
  writeList(stdout, 'Selection removals', plan.selectionRemovals);
  writeList(stdout, 'Effective additions', plan.effectiveAdditions);
  writeList(stdout, 'Effective removals', plan.effectiveRemovals);
  stdout.write(`Proposed active mixins: ${plan.proposedResolution.activeMixins.length}\n`);
  for (const mixin of plan.proposedResolution.activeMixins) {
    stdout.write(`- ${mixin.id}: ${mixin.reason}\n`);
  }
  stdout.write(`Mixin additions: ${plan.mixinAdditions.length}\n`);
  for (const mixin of plan.mixinAdditions) {
    stdout.write(`- ${mixin.id}: ${mixin.reason}\n`);
  }
  stdout.write(`Mixin removals: ${plan.mixinRemovals.length}\n`);
  for (const mixin of plan.mixinRemovals) {
    stdout.write(`- ${mixin.id}: ${mixin.reason}\n`);
  }
  writeList(stdout, 'Local override additions', plan.localOverrideAdditions);
  writeList(stdout, 'Local override removals', plan.localOverrideRemovals);
  stdout.write(`Managed issues: ${plan.managedIssues.length}\n`);
  for (const issue of plan.managedIssues) {
    stdout.write(`- ${issue.kind}: ${issue.path} (${issue.ownerId})\n`);
  }
}

export class ReconcileCommand extends Command {
  static paths = [['reconcile']];

  static usage = Command.Usage({
    description: 'Review and reconcile detected modules and managed AI assets.',
  });

  apply = Option.Boolean('--apply', false, {
    description: 'Apply the reviewed selection and managed file changes.',
  });

  async execute(): Promise<number> {
    const stack = await readStack(process.cwd());
    if (!stack) {
      throw new Error('No .ai/stack.yml found. Run `ai-lib init` first.');
    }
    const catalog = await loadStackCatalog(process.cwd(), stack);
    const plan = await planReconciliation(process.cwd(), catalog, stack);
    writePlan(this.context.stdout, plan);

    if (!this.apply) {
      this.context.stdout.write('No changes applied. Review the plan, then run with --apply after approval.\n');
      return 0;
    }

    const result = await applyReconciliation(process.cwd(), plan);
    this.context.stdout.write(`Applied ${result.files} managed files.\n`);
    this.context.stdout.write(`Removed ${result.removed} stale managed files.\n`);
    this.context.stdout.write(`Root AI reference: ${result.addedRootReference ? 'added' : 'current'}\n`);
    return 0;
  }
}
