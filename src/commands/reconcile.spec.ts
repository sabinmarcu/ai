import {
  expect,
  test,
} from 'vitest';
import type { ReconciliationPlan } from '../lib/reconcile.js';
import {
  hasReconciliationErrors,
  reconcileEntries,
} from './reconcile.js';

function createPlan(): ReconciliationPlan {
  return {
    currentResolution: {
      requestedModules: ['module/current', 'module/updated'],
      effectiveModules: ['module/current', 'module/updated'],
      activeMixins: [{
        id: 'mixin/current',
        reason: 'Current',
        requiresAll: ['module/current'],
      }],
    },
    detectedModules: [],
    effectiveAdditions: ['module/added'],
    effectiveRemovals: [],
    localOverrideAdditions: [],
    localOverrideRemovals: [],
    managedIssues: [{
      kind: 'outdated',
      ownerId: 'module/updated',
      path: 'managed.md',
    }],
    materializationPlan: [],
    mixinAdditions: [{
      id: 'mixin/added',
      reason: 'Added',
      requiresAll: ['module/added'],
    }],
    mixinRemovals: [],
    proposedResolution: {
      requestedModules: ['module/added', 'module/current', 'module/updated'],
      effectiveModules: ['module/added', 'module/current', 'module/updated'],
      activeMixins: [{
        id: 'mixin/added',
        reason: 'Added',
        requiresAll: ['module/added'],
      }, {
        id: 'mixin/current',
        reason: 'Current',
        requiresAll: ['module/current'],
      }],
    },
    proposedStack: {
      version: 2,
      createdAt: '2026-08-09T00:00:00.000Z',
      assetMode: 'materialized',
      presets: [],
      modules: ['module/added', 'module/current', 'module/updated'],
    },
    selectionAdditions: ['module/added'],
    selectionRemovals: [],
    target: {
      path: '.',
      kind: 'repository',
      modules: [],
    },
  };
}

test('classifies current, added, updated, and unknown module removal states', () => {
  const entries = reconcileEntries(createPlan(), ['module/removed']);

  expect(entries.modules).toEqual([
    {
      id: 'module/added',
      state: 'added',
    },
    {
      id: 'module/current',
      state: 'ok',
    },
    {
      id: 'module/removed',
      state: 'removed',
    },
    {
      id: 'module/updated',
      state: 'updated',
    },
  ]);
  expect(entries.mixins).toEqual([
    {
      id: 'mixin/added',
      state: 'added',
    },
    {
      id: 'mixin/current',
      state: 'ok',
    },
  ]);
});

test('treats unknown modules and blocking managed issues as reconciliation errors', () => {
  const cleanPlan = createPlan();
  expect(hasReconciliationErrors(cleanPlan, [])).toBe(false);
  expect(hasReconciliationErrors(cleanPlan, ['module/unknown'])).toBe(true);

  const uncleanPlan = createPlan();
  uncleanPlan.managedIssues = [{
    kind: 'drifted',
    ownerId: 'module/current',
    path: 'managed.md',
  }];
  expect(hasReconciliationErrors(uncleanPlan, [])).toBe(true);
});
