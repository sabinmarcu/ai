---
name: stack-reconciliation
description: "Inspect repository changes for AI stack applicability, review module and mixin changes, and reconcile managed AI assets through the ai CLI."
user-invocable: true
disable-model-invocation: false
---

# Stack Reconciliation

Use this skill after repository or workspace changes may have altered applicable
AI modules.

## Procedure

1. Run `ai reconcile` to inspect fresh repository and workspace detection,
   selected modules, effective dependencies, active mixins, managed drift, and
   local override effects.
2. Present all proposed selection changes, automatic dependency and mixin
   consequences, managed file changes, and drift before mutation.
3. Ask for approval before changing explicit module selections or repairing
   drift.
4. After approval, run `ai reconcile --apply`. Do not edit `.ai/stack.yml`,
   managed files, or `.ai/AGENTS.md` directly.
5. Run `ai status` and report the resulting validation state. Leave failed
   or declined changes unapplied.