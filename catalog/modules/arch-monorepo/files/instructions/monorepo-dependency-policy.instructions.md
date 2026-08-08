---
description: "Dependency graph, manifest consistency, and generated configuration guardrails for repositories containing multiple coordinated projects."
---

# Monorepo Dependency Policy

## Internal Dependencies

- Declare every cross-project dependency explicitly.
- Use the repository's local dependency mechanism for dependencies on projects in the same repository.
- Reject undeclared cross-project imports and accidental dependency cycles.
- Keep task dependencies, build references, and project dependency declarations aligned.
- Do not publish or resolve an internal project as an external dependency unless that boundary is intentional.

## Shared Dependency Policy

- Keep shared external dependency versions consistent across projects unless divergence is intentional and documented.
- Centralize deterministic defaults for each project role.
- Encode stable manifest and metadata invariants in structured repository policy.
- Keep exceptions narrow, named, and reviewable.
- Do not copy organization-specific dependencies or metadata into generic project defaults.

## Package and Root Dependency Placement

- When a reusable package expects its consumer to provide a runtime dependency, declare that dependency as a peer dependency of the package.
- Add each package peer dependency to the root development dependencies so repository builds, tests, examples, and editor workflows can resolve it without making it a distributed package dependency.
- Do not apply this peer dependency rule to applications. Applications own their runtime environment and should declare the dependencies they run with as application dependencies.
- Keep repository dependencies for tooling required to operate, validate, build, or maintain the repository, including shared type declarations used by that tooling.
- Keep root development dependencies for the peer dependencies of repository packages: dependencies needed while developing the repository but expected to be supplied by consumers of distributed packages.
- Do not move repository-operational tooling into root development dependencies when the root dependency contract classifies that tooling as required for repository operation.
- Do not promote package peer dependencies to package runtime dependencies merely to make local development resolve them.

## Generated Configuration

- Name one owner and one source definition for every generated file or field.
- Change source definitions or presets instead of editing generated outputs directly.
- Regenerate configuration after project topology, role, or dependency changes.
- Validate that generated project references match declared dependencies.
- Do not let multiple generators independently own the same file or field.
- Keep generated output deterministic for identical inputs.

## Project Lifecycle

- Make release eligibility explicit for every project role.
- Do not infer release eligibility only from a directory name, version field, or nearby project behavior.
- Require build and validation success before releasing a project.
- Keep application deployment policy separate from reusable project publication policy.
- Keep release destinations, credentials, and organization-specific metadata in local configuration.