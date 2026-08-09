import path from 'node:path';
import { Command } from 'clipanion';
import { render } from 'ink';
import { InteractiveApp } from '../components/InteractiveApp.js';
import { detectRepository } from '../lib/detect.js';
import { resolveStack } from '../lib/resolve.js';
import { loadStackCatalog } from '../lib/stack-catalog.js';
import { readStack } from '../lib/stack.js';
import type { DetectionEvidence } from '../types.js';

function formatDetectionEvidence(evidence: DetectionEvidence): string {
  if (evidence.kind === 'dependency') {
    const [bucket, ...nameParts] = evidence.value.split('.');
    return `${nameParts.join('.')} found in package.json (${bucket})`;
  }
  if (evidence.kind === 'manifest') {
    const [field, ...valueParts] = evidence.value.split(':');
    const value = valueParts.join(':');
    return value
      ? `${field} is ${value} in package.json`
      : `${field} found in package.json`;
  }
  return `${evidence.value} found in the repository`;
}

export class InteractiveCommand extends Command {
  static paths = [['interactive']];

  static usage = Command.Usage({
    description: 'Manage the repository AI stack interactively.',
  });

  async execute(): Promise<number> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      this.context.stderr.write('The interactive command requires a TTY.\n');
      return 1;
    }

    const cwd = process.cwd();
    const stack = await readStack(cwd);
    if (!stack) {
      this.context.stderr.write('No .ai/stack.yml present in current repository.\n');
      return 1;
    }

    const catalog = await loadStackCatalog(cwd, stack);
    const resolution = resolveStack(catalog, stack);
    const detection = await detectRepository(catalog, cwd);
    const absoluteCwd = path.resolve(cwd);
    const target = detection.targets.find((candidate) => (
      path.resolve(detection.root, candidate.path) === absoluteCwd
    )) ?? detection.targets[0];
    const detectedModules = new Map(target?.modules.map((module) => [module.id, module]) ?? []);
    const effectiveModules = new Set(resolution.effectiveModules);
    const selectedModules = new Set(stack.modules);
    const selectedByPreset = new Map<string, string[]>();
    for (const presetId of stack.presets) {
      const preset = catalog.presets.get(presetId);
      for (const moduleId of preset?.modules ?? []) {
        const presetIds = selectedByPreset.get(moduleId) ?? [];
        presetIds.push(presetId);
        selectedByPreset.set(moduleId, presetIds);
      }
    }
    const activeDependents = new Map<string, string[]>();
    for (const moduleId of resolution.effectiveModules) {
      const module = catalog.modules.get(moduleId);
      for (const dependencyId of module?.dependsOn ?? []) {
        const dependentIds = activeDependents.get(dependencyId) ?? [];
        dependentIds.push(moduleId);
        activeDependents.set(dependencyId, dependentIds);
      }
    }
    const modules = [...catalog.modules.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((module) => {
        const detected = detectedModules.get(module.id);
        const selectedByPresets = selectedByPreset.get(module.id)?.sort() ?? [];
        const selectionReasons = detected
          ? (detected.evidence.length > 0
            ? detected.evidence.map(formatDetectionEvidence)
            : [detected.reason])
          : [];
        selectionReasons.push(...selectedByPresets.map((presetId) => `Selected by preset: ${presetId}`));
        if (selectedModules.has(module.id) && selectionReasons.length === 0) {
          selectionReasons.push('Explicitly selected in .ai/stack.yml');
        }

        return {
          id: module.id,
          name: module.name,
          category: module.category,
          description: module.description,
          dependedOnBy: activeDependents.get(module.id)?.sort() ?? [],
          dependsOn: [...(module.dependsOn ?? [])].sort(),
          effective: effectiveModules.has(module.id),
          selected: selectedModules.has(module.id),
          selectedByPresets,
          selectionReasons,
        };
      });

    const instance = render(<InteractiveApp modules={modules} />);
    await instance.waitUntilExit();
    return 0;
  }
}
