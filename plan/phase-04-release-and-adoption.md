# Phase 04 - NPM Release, Policy, and Adoption

## Objective

Publish and operationalize the CLI for broader internal and external project usage.

## Deliverables

- NPM publish pipeline and release versioning.
- Consumer onboarding documentation and migration guide.
- CI policy checks for catalog and command contracts.
- Version compatibility strategy for stack files.

## Tasks

1. Add release scripts and package metadata for publishing.
2. Add changelog and semantic versioning process.
3. Add integration tests for real consumer fixture repositories.
4. Document migration from legacy bootstrap repos.
5. Add upgrade guidance across major versions.

## Exit Criteria

- CLI can be installed globally or via `npx`.
- A new consumer can bootstrap from presets in one command.
- CI protects against breaking catalog/stack compatibility.
