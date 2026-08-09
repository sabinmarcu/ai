---
name: reflection
description: "Reflect on catalog module changes in this repository. Use after adding, editing, renaming, or removing catalog modules to reconcile the generated AI surface through the CLI, consume newly applicable guidance, and validate the result."
user-invocable: true
disable-model-invocation: false
---

# Module Reflection

Use this skill after changing files under `catalog/modules/`.

## Procedure

1. Review the module changes and their dependency closure. Check whether any
   concrete configuration or guardrail applies only when multiple ordinary
   modules coexist. Follow the mixin evaluation rules in `AGENTS.md`; do not
   create a mixin without user approval.
2. Run `yarn cli reconcile` from the repository root. Treat its repository and
   project target results as authoritative; do not infer applicability from
   memory or flatten unrelated target scopes.
3. Present all proposed selection, dependency, mixin, managed-file, drift, and
   local-override changes. Follow the stack reconciliation skill's diagnostic
   classification: propose `yarn cli reconcile --repair` for unknown modules
   or `drifted`, `stale-drifted`, or `untracked` errors; otherwise propose
   `yarn cli reconcile --apply`. Explain why the selected action is required,
   including affected paths and destructive consequences for repair, and
   obtain explicit user approval for that exact command.
4. After approval, run the proposed command. If the preview changes before
   execution, classify it again and obtain fresh approval rather than silently
   changing actions. Do not edit `.ai/stack.yml`, `.ai/materialized.yml`, or
   `.ai/AGENTS.md` directly. Treat only the command's post-mutation report as
   the resulting reconciliation state.
5. Run `yarn cli status`, then read and apply every newly linked AI asset in
   `.ai/AGENTS.md` for the remainder of the task. Do not edit shared catalog
   assets merely to reconcile the generated surface.
6. Run `yarn check`. If validation fails, report the failure and leave
   unrelated files unchanged.
7. Summarize detected additions and removals, mixin activation reasons, local
   link changes, and validation results. If detection produced no changes,
   state that reflection was a no-op.

## Boundaries

- This skill is repository-local workflow guidance. Do not copy it into a
   catalog module.
- Do not edit `AGENTS.local.md`.
- Let the CLI own stack selection and generated AI-surface updates. Do not add
   computed module, mixin, or source-asset lists to root `AGENTS.md`.
- Do not change explicit module selections or repair unrelated drift without
   user approval.
- Always use `yarn lint:fix`, either directly or through `yarn check`; never run
  the non-fixing lint command.