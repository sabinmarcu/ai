import {
  readdir,
  readFile,
  stat,
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { getPackageRoot } from './package-root.js';
import type {
  Catalog,
  MixinManifest,
  ModuleManifest,
  PresetManifest,
} from '../types.js';

const moduleManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  category: z.string().min(1),
  managedPaths: z.array(z.string()),
  sourceAssets: z.array(z.string()).optional(),
  overridePaths: z.array(z.string()),
  dependsOn: z.array(z.string()).optional(),
  conflictsWith: z.array(z.string()).optional(),
}).strict();

const mixinManifestSchema = z.object({
  id: z.string().startsWith('mixin/'),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  managedPaths: z.array(z.string()),
  sourceAssets: z.array(z.string()).optional(),
  overridePaths: z.array(z.string()),
  requiresAll: z.array(z.string().min(1)).min(1),
});

const presetManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  modules: z.array(z.string()),
});

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function assertRelativePath(
  ownerType: 'Mixin' | 'Module',
  ownerId: string,
  field: string,
  value: string,
): void {
  if (!value || path.isAbsolute(value) || value.split(/[\\/]/u).includes('..')) {
    throw new Error(`${ownerType} ${ownerId} has invalid ${field} path: ${value}`);
  }
}

function assertUniqueValues(
  ownerType: 'Mixin' | 'Module',
  ownerId: string,
  field: string,
  values: string[],
): void {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) {
    throw new Error(`${ownerType} ${ownerId} has duplicate ${field} value: ${duplicate}`);
  }
}

async function assertSourceAsset(
  ownerRoot: string,
  ownerType: 'Mixin' | 'Module',
  ownerId: string,
  sourceAsset: string,
): Promise<void> {
  const assetPath = path.resolve(ownerRoot, sourceAsset);
  if (!assetPath.startsWith(`${ownerRoot}${path.sep}`)) {
    throw new Error(`${ownerType} ${ownerId} has invalid sourceAssets path: ${sourceAsset}`);
  }

  try {
    const assetStat = await stat(assetPath);
    if (!assetStat.isFile()) {
      throw new Error(`${ownerType} ${ownerId} source asset is not a file: ${sourceAsset}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${ownerType} ${ownerId}`)) {
      throw error;
    }
    throw new Error(`${ownerType} ${ownerId} source asset does not exist: ${sourceAsset}`, { cause: error });
  }
}

async function loadModuleDetector(moduleRoot: string, moduleId: string): Promise<ModuleManifest['detect']> {
  const detectorPath = path.join(moduleRoot, 'detect.mjs');
  try {
    const detectorStat = await stat(detectorPath);
    if (!detectorStat.isFile()) {
      throw new Error(`Module ${moduleId} detector is not a file: detect.mjs`);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }

  const detectorModule = await import(pathToFileURL(detectorPath).href) as { default?: unknown };
  if (typeof detectorModule.default !== 'function') {
    throw new TypeError(`Module ${moduleId} detector must default-export a function.`);
  }
  return detectorModule.default as ModuleManifest['detect'];
}

function validateCatalogReferences(catalog: Catalog): void {
  const managedPathOwners = new Map<string, string>();

  for (const module of catalog.modules.values()) {
    for (const managedPath of module.managedPaths) {
      const normalizedPath = path.normalize(managedPath);
      const existingOwner = managedPathOwners.get(normalizedPath);
      if (existingOwner) {
        throw new Error(`Managed path ${managedPath} is owned by both ${existingOwner} and ${module.id}.`);
      }
      managedPathOwners.set(normalizedPath, module.id);
    }

    for (const dependencyId of module.dependsOn ?? []) {
      if (dependencyId === module.id) {
        throw new Error(`Module ${module.id} cannot depend on itself.`);
      }
      if (!catalog.modules.has(dependencyId)) {
        throw new Error(`Module ${module.id} depends on unknown module: ${dependencyId}`);
      }
    }

    for (const conflictId of module.conflictsWith ?? []) {
      if (conflictId === module.id) {
        throw new Error(`Module ${module.id} cannot conflict with itself.`);
      }
      if (!catalog.modules.has(conflictId)) {
        throw new Error(`Module ${module.id} conflicts with unknown module: ${conflictId}`);
      }
    }
  }

  for (const mixin of catalog.mixins.values()) {
    if (catalog.modules.has(mixin.id)) {
      throw new Error(`Catalog ID is used by both a module and a mixin: ${mixin.id}`);
    }

    for (const managedPath of mixin.managedPaths) {
      const normalizedPath = path.normalize(managedPath);
      const existingOwner = managedPathOwners.get(normalizedPath);
      if (existingOwner) {
        throw new Error(`Managed path ${managedPath} is owned by both ${existingOwner} and ${mixin.id}.`);
      }
      managedPathOwners.set(normalizedPath, mixin.id);
    }

    for (const moduleId of mixin.requiresAll) {
      if (!catalog.modules.has(moduleId)) {
        throw new Error(`Mixin ${mixin.id} requires unknown module: ${moduleId}`);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (moduleId: string, chain: string[]): void => {
    if (visiting.has(moduleId)) {
      throw new Error(`Module dependency cycle: ${[...chain, moduleId].join(' -> ')}`);
    }
    if (visited.has(moduleId)) {
      return;
    }

    visiting.add(moduleId);
    const module = catalog.modules.get(moduleId);
    for (const dependencyId of module?.dependsOn ?? []) {
      visit(dependencyId, [...chain, moduleId]);
    }
    visiting.delete(moduleId);
    visited.add(moduleId);
  };

  for (const moduleId of catalog.modules.keys()) {
    visit(moduleId, []);
  }

  for (const preset of catalog.presets.values()) {
    for (const moduleId of preset.modules) {
      if (catalog.mixins.has(moduleId)) {
        throw new Error(`Preset ${preset.id} cannot reference mixin: ${moduleId}`);
      }
      if (!catalog.modules.has(moduleId)) {
        throw new Error(`Preset ${preset.id} references unknown module: ${moduleId}`);
      }
    }
  }
}

export async function loadCatalog(packageRoot = getPackageRoot()): Promise<Catalog> {
  const modulesRoot = path.join(packageRoot, 'catalog', 'modules');
  const mixinsRoot = path.join(packageRoot, 'catalog', 'mixins');
  const presetsRoot = path.join(packageRoot, 'catalog', 'presets');

  const moduleFolders = await readdir(modulesRoot, { withFileTypes: true });
  const modules = new Map<string, ModuleManifest>();

  for (const entry of moduleFolders) {
    if (entry.isDirectory()) {
      const moduleRoot = path.resolve(modulesRoot, entry.name);
      const manifestPath = path.join(moduleRoot, 'module.json');
      const manifest = moduleManifestSchema.parse(
        await readJsonFile(manifestPath),
      ) as ModuleManifest;
      if (modules.has(manifest.id)) {
        throw new Error(`Duplicate module ID: ${manifest.id}`);
      }

      for (const managedPath of manifest.managedPaths) {
        assertRelativePath('Module', manifest.id, 'managedPaths', managedPath);
      }
      for (const overridePath of manifest.overridePaths) {
        assertRelativePath('Module', manifest.id, 'overridePaths', overridePath);
      }
      for (const sourceAsset of manifest.sourceAssets ?? []) {
        assertRelativePath('Module', manifest.id, 'sourceAssets', sourceAsset);
        await assertSourceAsset(moduleRoot, 'Module', manifest.id, sourceAsset);
      }
      manifest.detect = await loadModuleDetector(moduleRoot, manifest.id);
      assertUniqueValues('Module', manifest.id, 'managedPaths', manifest.managedPaths);
      assertUniqueValues('Module', manifest.id, 'sourceAssets', manifest.sourceAssets ?? []);
      assertUniqueValues('Module', manifest.id, 'overridePaths', manifest.overridePaths);
      assertUniqueValues('Module', manifest.id, 'dependsOn', manifest.dependsOn ?? []);
      assertUniqueValues('Module', manifest.id, 'conflictsWith', manifest.conflictsWith ?? []);
      modules.set(manifest.id, manifest);
    }
  }

  const mixinFolders = await readdir(mixinsRoot, { withFileTypes: true });
  const mixins = new Map<string, MixinManifest>();

  for (const entry of mixinFolders) {
    if (entry.isDirectory()) {
      const mixinRoot = path.resolve(mixinsRoot, entry.name);
      const manifestPath = path.join(mixinRoot, 'mixin.json');
      const manifest = mixinManifestSchema.parse(
        await readJsonFile(manifestPath),
      ) as MixinManifest;
      if (mixins.has(manifest.id)) {
        throw new Error(`Duplicate mixin ID: ${manifest.id}`);
      }

      for (const managedPath of manifest.managedPaths) {
        assertRelativePath('Mixin', manifest.id, 'managedPaths', managedPath);
      }
      for (const overridePath of manifest.overridePaths) {
        assertRelativePath('Mixin', manifest.id, 'overridePaths', overridePath);
      }
      for (const sourceAsset of manifest.sourceAssets ?? []) {
        assertRelativePath('Mixin', manifest.id, 'sourceAssets', sourceAsset);
        await assertSourceAsset(mixinRoot, 'Mixin', manifest.id, sourceAsset);
      }
      assertUniqueValues('Mixin', manifest.id, 'managedPaths', manifest.managedPaths);
      assertUniqueValues('Mixin', manifest.id, 'sourceAssets', manifest.sourceAssets ?? []);
      assertUniqueValues('Mixin', manifest.id, 'overridePaths', manifest.overridePaths);
      assertUniqueValues('Mixin', manifest.id, 'requiresAll', manifest.requiresAll);
      mixins.set(manifest.id, manifest);
    }
  }

  const presetEntries = await readdir(presetsRoot, { withFileTypes: true });
  const presets = new Map<string, PresetManifest>();

  for (const entry of presetEntries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      const presetPath = path.join(presetsRoot, entry.name);
      const preset = presetManifestSchema.parse(await readJsonFile(presetPath)) as PresetManifest;
      if (presets.has(preset.id)) {
        throw new Error(`Duplicate preset ID: ${preset.id}`);
      }
      presets.set(preset.id, preset);
    }
  }

  const catalog = {
    modules,
    mixins,
    presets,
  };
  validateCatalogReferences(catalog);
  return catalog;
}
