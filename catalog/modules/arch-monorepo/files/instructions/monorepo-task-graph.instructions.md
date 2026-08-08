---
description: "Task ownership, dependency, caching, and execution guardrails for repositories containing multiple coordinated projects."
---

# Monorepo Task Graph

## Task Ownership

- Use one authoritative task graph for repository-wide build, development, lint, test, and release workflows.
- Keep root commands as stable entry points into the task graph rather than as a second source of workflow behavior.
- Define shared task contracts by project role.
- Keep framework-specific or project-specific task overrides local to the owning project.
- Avoid duplicating the same workflow logic across project commands and root orchestration.

## Dependencies

- Express every artifact, configuration, and setup prerequisite as an explicit task dependency.
- Build upstream projects before consumers when consumers require generated artifacts.
- Treat shared configuration and repository tooling as real graph dependencies.
- Do not rely on ambient outputs, manual command order, or a previously successful local run.
- Reject task dependency cycles and root bootstrap cycles.

## Inputs, Outputs, and Caching

- Declare the meaningful inputs and outputs of cacheable tasks.
- Include shared configuration in task inputs when it can change task behavior.
- Disable caching for persistent, interactive, nondeterministic, destructive, and release tasks.
- Keep watch and development tasks out of automated validation runs.
- Do not declare outputs that a successful task does not reliably produce.

## Mutation Boundaries

- Keep validation tasks free of source and manifest mutations.
- Make generation, cleanup, migration, versioning, and publication explicit operations.
- Require release tasks to be invoked intentionally rather than discovered as ordinary automated validation work.
- Preserve user-owned files and unrelated project outputs during repository-wide operations.
- Document destructive task behavior and provide a narrower alternative when practical.