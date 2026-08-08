---
name: reflection
description: "Reflect on catalog module changes in this repository. Use after adding, editing, renaming, or removing catalog modules to redetect applicable modules and mixins, refresh repository-local AI links when needed, consume newly applicable guidance, and validate the result."
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
2. Run `yarn cli detect` from the repository root. Treat its repository and
   project target results as authoritative; do not infer applicability from
   memory or flatten unrelated target scopes.
3. Compare the detector-confirmed effective modules and active mixins with the
   `Active Repository AI Links` section in `AGENTS.md`.
4. If the section is stale, update only that section so it lists the current
   effective modules, active mixins, and every source AI asset declared by
   their manifests. Use repository-relative paths and deterministic resolution
   order. Remove links for modules or mixins that no longer apply.
5. Read and apply every newly linked AI asset for the remainder of the task.
   Do not edit shared catalog assets merely to reconcile the local links.
6. Run `yarn check`. If validation fails, report the failure and leave
   unrelated files unchanged.
7. Summarize detected additions and removals, mixin activation reasons, local
   link changes, and validation results. If detection produced no changes,
   state that reflection was a no-op.

## Boundaries

- This skill is repository-local workflow guidance. Do not copy it into a
  catalog module or modify CLI source code to support it.
- Do not edit `AGENTS.local.md`.
- Do not change explicit module selections or repair unrelated drift without
  user approval.
- Always use `yarn lint:fix`, either directly or through `yarn check`; never run
  the non-fixing lint command.