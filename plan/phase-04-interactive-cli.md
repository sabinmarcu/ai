# Phase 04 - Interactive CLI Stack Management

Status: Planned

## Objective

Add an interactive terminal interface to the existing `ai` CLI for inspecting
and managing the shared AI stack installed in a repository. Build the interface
with React and Ink while keeping catalog resolution, reconciliation, mutation,
and validation in the existing shared engine.

The interface must show explicitly selected modules, effective dependency
modules, and automatically triggered mixins as distinct concepts. Users can
select new ordinary modules, remove existing explicit module selections, review
the resulting dependency, mixin, and managed-file changes, and apply the plan
without editing stack state or managed files directly.

This phase establishes a usable management interface before the package is
published. It does not replace scriptable CLI commands or make terminal UI code
a source of domain behavior.

## Terminology

In this phase, an installed shared AI stack means the repository-local state and
assets managed by the CLI, including `.ai/stack.yml`, the generated AI
entrypoint, selected module assets, active mixin assets, and baseline bootstrap
assets. It does not mean a machine-global module installation.

Use these labels consistently in the interface:

- **Selected module:** an ordinary module explicitly persisted in stack state,
  directly or through a preset.
- **Dependency module:** an ordinary module present because another effective
  module depends on it.
- **Active mixin:** automatically triggered content whose `requiresAll`
  conditions are satisfied by effective ordinary modules.
- **Available module:** an ordinary catalog module that is not currently an
  effective member of the applicable stack.
- **Drift:** a managed output that differs from the expected materialized
  content.

Do not describe mixins as installed modules or expose direct mixin selection.

## Decisions

### One CLI and One Engine

Ship the interactive interface from the existing package and `ai` executable.
Add an explicit `ai manage` command as the stable entrypoint. An explicit
command keeps automation predictable and avoids changing no-argument behavior
based on whether standard input happens to be a TTY.

The Ink application is an adapter over the existing catalog, stack resolution,
reconciliation, materialization, and verification services. It must not:

- edit `.ai/stack.yml` directly
- copy or remove managed files directly
- implement a second dependency, conflict, or mixin resolver
- infer active mixins from display state
- shell out to the public CLI for operations already available through shared
  TypeScript services

Extract or extend shared application services where command classes currently
contain behavior needed by both Clipanion commands and the Ink adapter.

### Intent Before Mutation

Selection changes remain staged in memory until the user requests a preview.
The interface then creates the same immutable reconciliation plan used by
non-interactive workflows and presents its consequences before asking for
confirmation.

Applying a change must use the reviewed plan and retain existing stale-plan,
drift, override, and managed-file protections. A declined or failed plan leaves
stack state and managed outputs unchanged.

### Ordinary Module Selection

Users may add or remove explicit ordinary module selections. The interface must
make the following consequences clear:

- selecting a module may activate transitive dependencies and mixins
- removing a selected module may remove dependencies that are no longer needed
- removing one requirement may deactivate one or more mixins
- removing a directly selected dependency does not remove it from the effective
  stack while another selected module still requires it
- presets and explicit selections may produce the same effective module
- conflicts must be reported before a plan can be applied

Do not offer install or remove actions on mixins. A mixin row may show its
requirements and activation reason, but its state changes only through ordinary
module resolution.

### Initial Scope Boundary

The first interface manages the stack model available when this phase begins.
It must preserve target and scope information exposed by the engine, but it does
not independently invent the scoped stack-state model planned for the later CLI
and MCP bootstrap phase.

Keep view models keyed by stable scope and catalog IDs so the later scoped model
can add repository and project navigation without replacing selection logic or
component identity.

## User Experience

### Launch and Environment Checks

`ai manage` must:

1. Resolve the target repository using the same rules as other CLI commands.
2. Require an interactive terminal and fail with a concise actionable message
   when input or output is not a TTY.
3. Load and strictly validate catalog and stack state before rendering.
4. Inspect current managed state, detection evidence, drift, effective modules,
   and active mixins.
5. Render a clear empty or initialization action when no stack exists rather
   than crashing or silently initializing it.

The interface must restore terminal state after normal exit, cancellation, and
handled failure. Long-running inspection and apply operations need visible
progress and must prevent duplicate submissions.

### Main Layout

Use a stable three-region terminal layout that degrades cleanly in narrow
terminals:

- a summary header with repository, asset mode, selected/effective counts,
  active mixin count, drift state, and pending-change count
- a searchable module list grouped or filterable by catalog category and state
- a detail panel showing description, selection provenance, dependencies,
  conflicts, detection evidence, managed paths, and triggered mixins

In narrow terminals, replace side-by-side list and detail regions with a single
focused view and explicit navigation between them. Content must remain usable
without color; symbols and labels must carry state meaning.

### Module Browsing and Selection

Provide:

- search by module ID, name, description, and category
- filters for selected, effective, available, conflicting, and drift-related
  modules
- deterministic ordering within categories
- keyboard navigation and discoverable contextual key hints
- selection toggles only for directly selectable ordinary modules
- clear badges or labels for explicit, preset, dependency, detected, pending,
  and conflicting states
- a read-only active-mixins view with requirements and activation reasons

Search and filtering affect presentation only. They must never alter the staged
selection set.

### Review and Apply

The review view must summarize:

- explicit selection additions and removals
- effective dependency additions and removals
- mixin activations and deactivations with reasons
- managed files to create, update, or remove
- preserved drift and override effects
- warnings, conflicts, and validations

The user can return to selection, discard staged changes, or confirm application.
Use an explicit confirmation action for mutation; a generic list toggle or
navigation key must never apply a plan.

After application, re-inspect from disk and display the resulting state. Do not
optimistically treat staged state as applied state.

### Failure and Recovery

Errors must leave the application navigable when recovery is possible. Show a
concise summary and an expandable or scrollable detail view for:

- invalid or unsupported stack state
- catalog load failures
- module conflicts
- managed drift that blocks removal or replacement
- stale plans caused by external filesystem changes
- failed validation or application operations

Offer retry only when it reruns a safe idempotent inspection or planning step.
Never retry mutation automatically.

## Architecture

### Adapter Boundary

Use a small adapter layer between Ink components and shared engine services.
The adapter owns asynchronous orchestration and maps domain results into view
models. React components own rendering, focus, local navigation, search text,
and staged user intent.

Suggested boundaries:

```ts
interface StackManagementService {
  inspect(target: string): Promise<StackManagementSnapshot>;
  plan(
    snapshot: StackManagementSnapshot,
    selection: DesiredModuleSelection,
  ): Promise<ReconciliationPlan>;
  apply(plan: ReconciliationPlan): Promise<StackManagementSnapshot>;
}
```

The final names should follow existing engine terminology. Do not expose mutable
catalog maps or filesystem primitives to components.

### State Model

Keep three states separate:

- the last inspected persisted snapshot
- staged desired explicit selections
- the current immutable reconciliation plan

Any staged-selection change invalidates the current plan. Any relevant external
filesystem change must make application reject the stale plan through the shared
engine rather than through UI timestamps.

Derive effective modules and active mixins from engine results. Do not duplicate
resolved domain state into independently mutable React state.

### React and Ink

Add compatible `react`, `ink`, and React type dependencies according to their
runtime and build requirements. Keep Ink-specific imports out of the shared
engine and non-interactive command paths.

Use focused components for the application shell, module list, module details,
active mixins, review, confirmation, progress, and error presentation. Prefer
Ink primitives and established Ink input helpers over custom terminal escape
handling.

Do not add a browser frontend, persistent daemon, alternate package, or custom
terminal renderer in this phase.

## Accessibility and Terminal Compatibility

- Support keyboard-only operation.
- Never use color as the only state indicator.
- Respect narrow terminal widths and avoid horizontal overflow for essential
  actions.
- Truncate or wrap long IDs and paths while keeping the selected row stable.
- Provide a consistent escape path from dialogs and a clear quit action.
- Avoid key bindings that can apply destructive changes accidentally.
- Keep animations minimal and disable them when output is not suitable.
- Test with common light and dark terminal color schemes.

## Testing Strategy

### Unit Tests

- snapshot-to-view-model mapping
- selection staging without persisted mutation
- explicit, preset, dependency, detected, and mixin state labels
- search, category, and state filtering
- plan invalidation after selection changes
- conflict and blocked-removal presentation
- narrow-layout selection
- keyboard action reducers or equivalent state transitions

### Component Tests

Use Ink's supported testing utilities to verify rendered output and keyboard
flows for:

- loading, empty, ready, planning, review, applying, success, and error states
- adding a module and reviewing dependency and mixin activation
- removing a module and reviewing mixin deactivation
- attempting to act on a read-only mixin
- cancelling review without mutation
- applying a reviewed plan and refreshing from persisted state
- resizing between wide and narrow layouts

Avoid snapshots as the only assertion for interaction behavior. Assert visible
state, service calls, and resulting focus or navigation state.

### Integration Tests

Run the interface against isolated fixture repositories with deterministic
catalog and service boundaries:

- initialized stack with selected and dependency modules
- stack with one or more active mixins
- available module whose selection activates a mixin
- removal that leaves a dependency effective through another module
- conflicting module selection
- materialized stack with managed drift
- source-mode stack
- missing stack
- stale plan after an external change

Integration tests must verify that confirmed operations produce the same stack
and managed outputs as equivalent non-interactive reconciliation operations.

### Manual Validation

Before completion, manually verify:

- common terminal widths, including a narrow split fallback
- light and dark terminal themes
- keyboard navigation, search, review, cancellation, and quit behavior
- terminal restoration after success, cancellation, and failure
- responsive feedback during catalog inspection and application
- accurate module provenance and mixin activation explanations

## Tasks

1. Extract a reusable stack-management service from existing command-level
   orchestration without changing reconciliation semantics.
2. Define immutable management snapshots and view models that preserve module
   provenance, dependency reasons, active mixins, drift, and asset mode.
3. Add React, Ink, type support, and focused test utilities compatible with the
   supported Node runtime and ESM build.
4. Register the explicit `ai manage` command and enforce TTY requirements.
5. Implement loading, missing-stack, ready, planning, review, applying, success,
   and recoverable-error application states.
6. Implement searchable and filterable ordinary module browsing.
7. Display explicit selections, preset provenance, dependencies, detection
   evidence, conflicts, and managed paths distinctly.
8. Add the read-only active-mixins view with requirements and activation
   reasons.
9. Stage ordinary module additions and removals without mutating persisted
   state.
10. Generate and render reconciliation plans with selection, effective module,
    mixin, file, drift, warning, and validation consequences.
11. Require explicit confirmation and apply only the reviewed plan through the
    shared engine.
12. Re-inspect persisted state after successful application.
13. Add wide and narrow layouts with stable focus and keyboard navigation.
14. Add unit, component, fixture integration, and terminal-restoration tests.
15. Document `ai manage`, its TTY requirement, and the distinction between
    selected modules, dependencies, and active mixins.
16. Verify equivalent outcomes between interactive and non-interactive module
    management flows.

## Exit Criteria

- `ai manage` opens a React and Ink interface in an initialized repository.
- The interface accurately distinguishes explicit selections, preset modules,
  dependencies, detected modules, available modules, and active mixins.
- Users can search and inspect catalog modules and mixin activation reasons.
- Users can stage ordinary module additions and removals without direct stack or
  filesystem mutation.
- Mixins are visible but cannot be selected or removed directly.
- Review shows dependency, conflict, mixin, managed-file, drift, and validation
  consequences before confirmation.
- Confirmed changes use the shared reconciliation engine and produce the same
  result as non-interactive operations.
- Cancellation and failed plans leave persisted state unchanged.
- Successful apply refreshes the interface from disk.
- Source and materialized asset modes retain their existing semantics.
- The interface remains usable in narrow terminals and without color cues.
- Terminal state is restored after success, cancellation, and handled failure.
- Unit, component, integration, type checking, and `yarn lint:fix` validation
  pass.

## Out of Scope

- direct mixin installation or removal
- editing catalog module or mixin definitions
- replacing non-interactive commands
- machine-global module state
- remote catalog browsing or third-party catalog installation
- implementing the later scoped monorepo bootstrap state model
- release, registry publication, or documentation-site implementation
