export type ModuleId = string;
export type MixinId = string;

export interface DetectionEvidence {
  kind: 'file' | 'manifest' | 'dependency';
  value: string;
}

export interface ModuleDetectionResult {
  applies: boolean;
  reason?: string;
  evidence?: DetectionEvidence[];
}

export interface ModuleDetectionContext {
  target: {
    root: string;
    path: string;
    absolutePath: string;
    kind: DetectionTarget['kind'];
  };
  packageJson?: Record<string, unknown>;
  exists(relativePath: string): boolean;
  dependency(name: string): DetectionEvidence[];
}

export type ModuleDetector = (
  context: ModuleDetectionContext,
) => ModuleDetectionResult | Promise<ModuleDetectionResult>;

export interface DetectedModule {
  id: ModuleId;
  reason: string;
  evidence: DetectionEvidence[];
}

export interface DetectionTarget {
  path: string;
  kind: 'repository' | 'project';
  packageName?: string;
  modules: DetectedModule[];
}

export interface RepositoryDetection {
  root: string;
  targets: DetectionTarget[];
}

export interface ActiveMixin {
  id: MixinId;
  reason: string;
  requiresAll: ModuleId[];
}

export interface ResolvedDetectionTarget extends DetectionTarget {
  effectiveModules: ModuleId[];
  activeMixins: ActiveMixin[];
}

export interface ResolvedRepositoryDetection {
  root: string;
  targets: ResolvedDetectionTarget[];
}

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  description: string;
  version: string;
  sourceRoot?: string;
  category: string;
  managedPaths: string[];
  sourceAssets?: string[];
  overridePaths: string[];
  detect?: ModuleDetector;
  dependsOn?: ModuleId[];
  conflictsWith?: ModuleId[];
}

export interface PresetManifest {
  id: string;
  name: string;
  description: string;
  modules: ModuleId[];
}

export interface MixinManifest {
  id: MixinId;
  name: string;
  description: string;
  version: string;
  sourceRoot?: string;
  managedPaths: string[];
  sourceAssets?: string[];
  overridePaths: string[];
  requiresAll: ModuleId[];
}

export interface StackConfig {
  version: number;
  createdAt: string;
  presets: string[];
  modules: ModuleId[];
}

export interface Catalog {
  modules: Map<ModuleId, ModuleManifest>;
  mixins: Map<MixinId, MixinManifest>;
  presets: Map<string, PresetManifest>;
}
