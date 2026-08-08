# Phase 03 - Stack Materialization and Drift Tracking

Status: Complete (2026-08-08)

## Completion Notes

- Stack format version 2 persists either `materialized` asset mode or
	repository-contained `source` asset mode.
- Materialized mode copies and tracks managed assets. Source mode tracks only
	the generated AI entrypoint and links directly to repository-relative
	catalog and bootstrap sources.
- Both modes use the same detection, resolution, reconciliation, drift, and
	root-entrypoint workflows.
- Unsupported stack versions fail strict validation. Cross-release migration
	and compatibility policy remain Phase 4 responsibilities.

## Objective

Install selected modules into consumer repositories through copied managed
assets or repository-contained source links while preserving shared-asset
integrity.

## Deliverables

- `.ai/stack.yml` state file creation and updates.
- Scoped repository and workspace inspection.
- Automatic mixin resolution from the effective module set.
- `apply` implementation for managed path materialization.
- `status` implementation for drift, missing files, and version mismatch.
- Persistent asset-mode selection, with `init --asset-mode source` choosing
	repository-contained source links instead of copied managed assets.
- Local override path bootstrap and guardrails.
- A baseline AI entrypoint that references the reconciliation skill and every
	active module and mixin AI asset according to the selected asset mode.
- A baseline stack reconciliation skill installed or source-linked regardless
	of selected modules.

## Asset Modes

Keep the CLI spelling separate from the persisted behavior:

- `init` defaults to `assetMode: materialized`.
- `init --asset-mode source` persists `assetMode: source` and a
	repository-relative
	`catalogRoot` in `.ai/stack.yml`.
- `--asset-mode` is initialization syntax, not a flag that must be repeated.
	Later `apply`, `status`, `verify`, and `reconcile` operations read the
	persisted asset mode.

Materialized mode copies baseline, module, and mixin assets into their managed
paths. It remains the portable default for globally installed or package-run
CLI use because consumer repositories do not depend on the installation source
after application.

Source mode is for a repository that contains the catalog and bootstrap
sources it consumes. It must:

- reject absolute `catalogRoot` values and paths that escape the target
	repository
- resolve catalog and bootstrap sources from the target repository rather than
	the CLI installation
- generate and track `.ai/AGENTS.md` without copying baseline, module, or mixin
	assets
- use repository-relative links from `.ai/AGENTS.md`; never emit absolute
	filesystem paths
- keep catalog source files outside managed drift tracking while continuing to
	protect the generated entrypoint
- retain the root AI instruction reference and repository-local override
	boundaries used by materialized mode

Switching from materialized mode to source mode removes unchanged stale managed
copies through the normal reconciliation path and refuses to remove drifted
stale files. Directly linked skills remain readable through the generated
entrypoint, but a host may not discover them as slash commands unless they are
also located in that host's native skill-discovery directory.

## Baseline AI Entrypoint

Create one stable, generated entrypoint for active AI files. It is bootstrap
infrastructure rather than module-owned content and therefore exists even when
no optional modules are selected.

The entrypoint must:

- reference the stack reconciliation skill
- enumerate the currently materialized or source-linked ordinary module and
	active mixin AI assets in deterministic resolution order
- distinguish managed shared assets from repository-local override locations
- be regenerated from catalog and stack state rather than edited manually
- avoid copying module guidance into the entrypoint

Initialization may add one small reference to the repository's existing root AI
instruction file, such as `AGENTS.md`, directing agents to read the generated
entrypoint. Preserve all existing root instructions and do not rewrite that file
on later reconciliation runs unless the reference is missing or invalid. Keep
host-specific adapters minimal so the generated entrypoint remains the common
source for supported agent hosts.

## Stack Reconciliation Skill

Install one baseline skill that checks whether repository changes alter module
applicability and reconciles installed AI assets. Use a skill rather than a
specialized agent because detection, resolution, drift reporting, and
application are deterministic CLI responsibilities; the AI layer only guides
the review and invocation workflow.

The skill must:

1. Inspect repository and workspace changes through the CLI rather than infer
	module applicability from memory.
2. Compare detected modules, selected stack state, effective dependencies,
	active mixins, and materialized assets.
3. Present module and mixin additions, removals, activation reasons, managed
	file changes, drift, and local-override effects before mutation.
4. Ask for approval before changing explicit module selections or repairing
	drift; automatic dependency and mixin consequences must still be explained.
5. Invoke the same reconciliation and apply implementation used by direct CLI
	workflows.
6. Regenerate the baseline AI entrypoint after successful reconciliation.
7. Report validation results and leave failed or declined changes unapplied.

Do not let the skill edit stack state, managed files, or the AI entrypoint
directly. It must delegate those operations to typed CLI services so later MCP
adapters can reuse identical behavior.

## Scoped Inspection

Use `@sabinmarcu/utils-repo` for repository roots, manifests, workspace glob
expansion, and workspace name/path maps. Keep target discovery, role
classification, detector execution, dependency resolution, and evidence
assembly in the shared engine.

Preserve target scope through ordinary module detection and dependency
resolution. Activate a mixin only when its required effective modules coexist
in the applicable target scope; do not flatten module IDs across workspaces
before mixin evaluation.

### Cache Lifecycle

Bound `@sabinmarcu/utils-repo` memoization to one top-level operation. Moize
provides `clear()` on each memoized function but no global cache registry. Until
the utility exposes a dedicated reset API, keep one tested adapter that walks
the utility's public export graph, identifies unique Moized functions, and
clears each cache.

For every CLI command or MCP operation:

1. Clear utility caches before inspection so external changes are visible.
2. Reuse memoized reads throughout that operation.
3. Await all filesystem and package-manager work.
4. Clear utility caches in `finally`, whether the operation succeeds or fails.

Serialize operations while they share process-global caches. If concurrent
operations become necessary, replace them with operation-local cache instances.

## Tasks

1. Implement stack read/write with strict versioning.
2. Resolve requested and preset modules, expand dependencies, then activate all
	matching mixins from the effective ordinary module set.
3. Keep mixins out of selected stack state while recording enough effective
	resolution detail for `status` to explain which mixins activated and why.
4. Add file copy/render pipeline for managed module and active mixin content.
5. Reconcile outputs when a stack change deactivates a mixin so stale managed
	content is removed without touching local overrides.
6. Add protected marker strategy for managed files.
7. Add drift detection for manual edits in managed paths.
8. Add clear repair workflow to restore managed files.
9. Discover repository and workspace targets, run each module's loaded detector
	per target, and retain reasons and evidence.
10. Resolve ordinary dependencies and activate mixins without losing target
	scope.
11. Enforce the repository utility cache boundary around top-level operations.
12. Add a reconcile operation that compares fresh detection with selected and
	effective stack state and produces a reviewable change summary.
13. Materialize the baseline stack reconciliation skill independently of module
	selection.
14. Generate the stable AI entrypoint from the effective assets according to
	the persisted asset mode and update it after every successful apply or
	reconciliation.
15. Add the one-time root AI instruction reference without replacing existing
	repository guidance.
16. Add `init --asset-mode source` as the CLI interface for persistent source
	asset mode.
17. Load source-mode catalogs only from repository-contained, relative catalog
	roots.
18. Generate source-mode entrypoints with direct relative links to bootstrap,
	module, and mixin source assets without copying those assets.
19. Route `apply`, `status`, `verify`, and `reconcile` through the asset mode
	persisted in stack state.
20. Reconcile materialized-to-source transitions through existing stale-file
	and drift protections.

## Exit Criteria

- Fresh `init` + `apply` produces deterministic outputs.
- Fresh `init --asset-mode source` persists source mode and produces only the
	generated managed entrypoint, with repository-relative links to the active
	bootstrap, module, and mixin sources.
- Source mode rejects absolute or repository-escaping catalog roots.
- Commands after initialization honor persisted source mode without requiring
	`--asset-mode source` again.
- Switching from materialized mode to source mode removes unchanged copied
	assets and preserves drifted stale files for explicit review.
- Identical effective module sets activate identical mixins regardless of preset
	provenance or selection order.
- Removing a required module deactivates its mixins and reconciles their managed
	outputs.
- `status` reports active mixins and their satisfied module conditions.
- `status` reports managed drift accurately.
- Override folders remain outside managed replacement logic.
- Modules detected in unrelated workspaces cannot jointly activate a mixin.
- A filesystem mutation becomes visible after the operation cache boundary.
- Repository changes that alter detector results produce an explainable
	reconciliation summary before stack or file mutations.
- The baseline reconciliation skill and AI entrypoint exist with an otherwise
	minimal stack.
- The generated entrypoint references exactly the currently materialized or
	source-linked module and active mixin AI assets in deterministic order.
- Reconciliation removes stale entrypoint references when modules or mixins
	deactivate without modifying repository-local overrides.
- Repeated reconciliation is a no-op and does not churn the root AI instruction
	file.
