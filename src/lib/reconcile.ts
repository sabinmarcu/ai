import path from 'node:path';
import type {
  ActiveMixin,
  Catalog,
  DetectionTarget,
  StackConfig,
} from '../types.js';
import {
  detectRepository,
  resolveDetectedRepository,
} from './detect.js';
import {
  applyMaterialization,
  buildCompleteMaterializationPlan,
  ensureRootEntrypointReference,
  inspectMaterialization,
} from './materialize.js';
import type {
  ApplyMaterializationResult,
  MaterializationIssue,
  PlannedManagedFile,
} from './materialize.js';
import {
  resolveStack,
} from './resolve.js';
import type { StackResolution } from './resolve.js';
import { writeStack } from './stack.js';

export interface ReconciliationPlan {
  currentResolution: StackResolution;
  detectedModules: string[];
  effectiveAdditions: string[];
  effectiveRemovals: string[];
  localOverrideAdditions: string[];
  localOverrideRemovals: string[];
  managedIssues: MaterializationIssue[];
  materializationPlan: PlannedManagedFile[];
  mixinAdditions: ActiveMixin[];
  mixinRemovals: ActiveMixin[];
  proposedResolution: StackResolution;
  proposedStack: StackConfig;
  selectionAdditions: string[];
  selectionRemovals: string[];
  target: DetectionTarget;
}

export interface ApplyReconciliationResult extends ApplyMaterializationResult {
  addedRootReference: boolean;
}

function difference(values: Iterable<string>, other: Iterable<string>): string[] {
  const otherValues = new Set(other);
  return [...values].filter((value) => !otherValues.has(value));
}

function activeOverridePaths(catalog: Catalog, resolution: StackResolution): string[] {
  const paths = new Set<string>();
  for (const moduleId of resolution.effectiveModules) {
    for (const overridePath of catalog.modules.get(moduleId)?.overridePaths ?? []) {
      paths.add(overridePath);
    }
  }
  for (const activeMixin of resolution.activeMixins) {
    for (const overridePath of catalog.mixins.get(activeMixin.id)?.overridePaths ?? []) {
      paths.add(overridePath);
    }
  }
  return [...paths];
}

export function proposeStackSelection(
  catalog: Catalog,
  stack: StackConfig,
  target: DetectionTarget,
): StackConfig {
  const presetModules = new Set<string>();
  for (const presetId of stack.presets) {
    const preset = catalog.presets.get(presetId);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }
    for (const moduleId of preset.modules) {
      presetModules.add(moduleId);
    }
  }

  const selectedModules = new Set(target.modules.map((module) => module.id));
  for (const moduleId of stack.modules) {
    if (!catalog.modules.get(moduleId)?.detect) {
      selectedModules.add(moduleId);
    }
  }
  for (const presetModule of presetModules) {
    selectedModules.delete(presetModule);
  }

  return {
    ...stack,
    presets: [...new Set(stack.presets)].sort(),
    modules: [...selectedModules].sort(),
  };
}

export async function planReconciliation(
  cwd: string,
  catalog: Catalog,
  stack: StackConfig,
): Promise<ReconciliationPlan> {
  const detection = resolveDetectedRepository(
    catalog,
    await detectRepository(catalog, cwd),
  );
  const absoluteCwd = path.resolve(cwd);
  const target = detection.targets.find((candidate) => (
    path.resolve(detection.root, candidate.path) === absoluteCwd
  )) ?? detection.targets[0];
  if (!target) {
    throw new Error('Repository detection produced no targets.');
  }

  const currentResolution = resolveStack(catalog, stack);
  const proposedStack = proposeStackSelection(catalog, stack, target);
  const proposedResolution = resolveStack(catalog, proposedStack);
  const materializationPlan = await buildCompleteMaterializationPlan(catalog, proposedResolution, {
    assetMode: stack.assetMode,
    targetRoot: cwd,
  });
  const currentOverrides = activeOverridePaths(catalog, currentResolution);
  const proposedOverrides = activeOverridePaths(catalog, proposedResolution);

  return {
    currentResolution,
    detectedModules: target.modules.map((module) => module.id),
    effectiveAdditions: difference(
      proposedResolution.effectiveModules,
      currentResolution.effectiveModules,
    ),
    effectiveRemovals: difference(
      currentResolution.effectiveModules,
      proposedResolution.effectiveModules,
    ),
    localOverrideAdditions: difference(proposedOverrides, currentOverrides),
    localOverrideRemovals: difference(currentOverrides, proposedOverrides),
    managedIssues: await inspectMaterialization(cwd, materializationPlan),
    materializationPlan,
    mixinAdditions: proposedResolution.activeMixins.filter((mixin) => (
      !currentResolution.activeMixins.some((current) => current.id === mixin.id)
    )),
    mixinRemovals: currentResolution.activeMixins.filter((mixin) => (
      !proposedResolution.activeMixins.some((proposed) => proposed.id === mixin.id)
    )),
    proposedResolution,
    proposedStack,
    selectionAdditions: difference(proposedStack.modules, stack.modules),
    selectionRemovals: difference(stack.modules, proposedStack.modules),
    target,
  };
}

export async function applyReconciliation(
  cwd: string,
  plan: ReconciliationPlan,
): Promise<ApplyReconciliationResult> {
  const result = await applyMaterialization(cwd, plan.materializationPlan);
  await writeStack(cwd, plan.proposedStack);
  const addedRootReference = await ensureRootEntrypointReference(cwd);
  return {
    ...result,
    addedRootReference,
  };
}
