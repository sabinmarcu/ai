# Phase 02 - Module Catalog and Preset Model

Status: Complete (2026-08-08)

## Objective

Define a composable catalog format that supports mix-and-match project bootstrapping.

## Deliverables

- Module manifest schema and loader.
- Convention-based loading of self-contained module detectors.
- Mixin manifest schema and loader for guidance activated by module combinations.
- Preset schema and loader.
- Baseline modules for global, web, TypeScript, node architecture, and unix tooling.
- Stack state model for selected modules/presets.

## Mixin Model

Use **mixin** for catalog content that is neither directly selected nor owned by
a preset, but becomes active when all of its required modules are present in the
resolved stack. This name keeps automatic combination guidance distinct from
ordinary modules and from repository-based module applicability.

Example:

```json
{
	"id": "mixin/monorepo-typescript",
	"requiresAll": [
		"arch/monorepo",
		"lang/typescript"
	]
}
```

Mixin rules:

- Store mixins as a separate catalog entity under `catalog/mixins`.
- Give mixins the same managed asset and override path ownership model as
	modules.
- Activate a mixin automatically when every ID in `requiresAll` is present
	after requested modules, preset modules, and transitive module dependencies
	have resolved.
- Treat only effective ordinary modules as present for mixin activation.
- Do not allow mixin IDs in presets, explicit module selections, or the selected
	module list in stack state.
- Keep presets unaware of mixins; the resolver must activate them regardless of
	which preset or explicit selection produced the required module set.
- Resolve active mixins in stable ID order and expose their activation reasons
	for status and diagnostics.
- Limit the initial condition model to `requiresAll`. Add alternative or
	negative conditions only when a concrete use case requires them.
- Evaluate activation from the resolved ordinary module set rather than from
	other mixins, preventing implicit activation chains.

## Module-Owned Detection

An ordinary module is a self-contained definition. Its manifest, optional
detector, guidance assets, and future implementation capability live under the
same module directory:

```text
catalog/modules/<module>/
	module.json
	detect.mjs
	files/
```

Discover the optional detector by the conventional colocated `detect.mjs`
entrypoint. Do not add a detector path to `module.json`, maintain a central
module-to-detector registry, or place module-specific detection policy in
`src/lib`. A module may import generic utility functions, but must not reference
another module's implementation; module relationships are declared through
manifest dependencies.

The catalog loader validates and loads the conventional detector as part of the
module definition. The generic detector runner supplies target metadata, the
parsed package manifest, an `exists` helper, and exact dependency evidence
across the standard package dependency buckets. It validates detector output
and retains the module-provided reason and evidence.

Language and tooling modules apply only when their package is declared in
`package.json`. In particular, `lang/typescript` requires the `typescript`
dependency and `tooling/eslint` requires the `eslint` dependency. Configuration
files may strengthen evidence but do not substitute for the package dependency.
Architecture modules own their structural or dependency signals locally.

Mixins do not have detectors. They activate from the effective ordinary module
set after scoped dependency resolution.

## Tasks

1. Add typed module and preset interfaces.
2. Add a typed mixin interface with `requiresAll` module conditions.
3. Implement filesystem-backed catalog loading for modules, mixins, and presets.
4. Add metadata for dependencies, conflicts, and managed/override paths.
5. Validate mixin module references and reject mixin references from presets.
6. Add initial module manifests grouped by concern.
7. Add starter presets for common project archetypes.
8. Discover, validate, and execute conventional module-local detectors without
	manifest path indirection.

## Exit Criteria

- Catalog load succeeds from local repository.
- Presets resolve to module lists deterministically.
- Mixins activate deterministically when all required modules resolve.
- Presets and explicit module selections cannot reference mixins.
- Unknown module IDs in mixin conditions fail fast with actionable errors.
- Unknown module IDs fail fast with actionable errors.
- Module detection policy is executable from its own module directory without
	changes to a central rule table.
- TypeScript, ESLint, and other language/tool modules do not activate from
	configuration files alone.
