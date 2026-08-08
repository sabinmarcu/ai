---
name: repository-bootstrap
description: "Initialize and evolve this repository's AI bootstrap system using catalog modules, presets, and CLI commands."
argument-hint: "target command or catalog area"
user-invocable: true
---

# Repository Bootstrap Skill

## Repository Terminology

- Node project: any folder containing a `package.json`.
- Applications are deployable or executable projects; libraries are intended for publication or consumption.
- Node apps are deployable servers or services, web apps are deployed to serve browsers, and node tools are one-off executables used by developers or CI. A node tool is also a node library.
- Node libraries include `@types/node`; web libraries do not and preferably declare browser-focused dependencies.
- Node and web libraries are mutually exclusive. Node and web apps cannot also be libraries.

## Scope Clarification

- "AI files" refers to local AI files in consumer repositories, not catalog modules in this repository.

## Active Local AI Links

- This repository is a TypeScript node tool and therefore also a node library.
- Detector-confirmed effective modules: `global/core`, `arch/node-package`, `arch/library`, `arch/node-library`, `arch/application`, `arch/node-tool`, `lang/typescript`, and `tooling/eslint`.
- Detector-confirmed active mixins: `mixin/typescript-eslint` and `mixin/typescript-library`.
- Apply all source assets declared by those module and mixin manifests. The following files are their entry points or complete single-file guidance:
- Active module AI file: `catalog/modules/global-core/files/instructions/global-commit-policy.instructions.md`.
- Active module AI file: `catalog/modules/global-core/files/instructions/global-repo-local-agent-notes.instructions.md`.
- Active module AI file: `catalog/modules/global-core/files/instructions/global-repo-tmp.instructions.md`.
- Active module AI file: `catalog/modules/arch-node-package/files/instructions/node-package-architecture.instructions.md`.
- Active module AI file: `catalog/modules/arch-library/files/instructions/library-architecture.instructions.md`.
- Active module AI file: `catalog/modules/arch-node-library/files/instructions/node-library-architecture.instructions.md`.
- Active module AI file: `catalog/modules/arch-application/files/instructions/application-architecture.instructions.md`.
- Active module AI file: `catalog/modules/arch-node-tool/files/instructions/node-tool-architecture.instructions.md`.
- Active module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-architecture.instructions.md`.
- Active module AI file: `catalog/modules/tooling-eslint/files/instructions/eslint-configuration.instructions.md`.
- Active mixin AI file: `catalog/mixins/typescript-eslint/files/instructions/typescript-eslint.instructions.md`.
- Active mixin AI file: `catalog/mixins/typescript-library/files/instructions/typescript-library.instructions.md`.

## When to Use

- Adding or refining CLI commands for stack initialization and validation.
- Creating or updating catalog modules and presets.
- Extending bootstrap behavior for new project types.

## Procedure

1. Read the active phase docs in `plan/` to align work with roadmap scope.
2. Prefer typed changes under `src/` and manifest updates under `catalog/`.
3. Keep outputs compatible with isolated consumer repositories.
4. Challenge ambiguous or potentially incorrect terminology before implementing changes.
5. Ask whether the requested change should live in modules or local AI files whenever scope is unclear.
6. Run `yarn check` and command-level validation before finalizing.

## AI Asset Usage Note

Always integrate relevant AI files produced by this repository when testing flows.
Examples include TypeScript setup and linting setup AI assets as they become available.

## Completion Checklist

- Catalog references resolve and remain consistent.
- CLI behavior is documented and verifiable.
- New guardrails are reflected in module/preset metadata.
