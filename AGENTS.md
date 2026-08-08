# AGENTS

## Purpose

This repository builds and ships a composable AI bootstrap CLI and module catalog.

## Repository Terminology

- Node project: any folder containing a `package.json`.
- A node project may combine classifications where their modules are compatible.
- An app is classified as exactly one of the following:
	- Node app: runs as a standalone production server or service rather than as a local developer command.
	- Node tool: runs as a one-off executable for a developer or CI, such as a CLI, build tool, or development utility. A node tool is also a node library.
	- Web app: runs for the browser or uses web application tooling or frameworks such as Vite, Next.js, React, Vue, Svelte, or Angular.
- A library is classified as exactly one of the following:
	- Node library: targets the Node.js runtime and includes `@types/node` in its dependencies or development dependencies.
	- Web library: targets browsers. At minimum it does not include `@types/node`; stronger signals include browser types or dependencies on React, Vue, Svelte, Angular, or similar web frameworks.
- Node and web libraries are mutually exclusive. Node and web apps cannot also be libraries.
- Do not use "node package" as a project classification. Use "package" only for a package-manager or publication artifact when that meaning is intended.

## Scope Clarification

- Catalog AI files are all files contained under `catalog/`.
- Repository AI files are `AGENTS.md` and all files contained under `.github/`.
- Local AI files consist of `AGENTS.local.md`.
- Treat catalog, repository, and local AI files as separate scopes with different lifecycle rules.

## Active Repository AI Links

- This repository is a TypeScript node project classified as a node tool and therefore also as a node library. It is not a node app, web app, or web library.
- Detector-confirmed effective modules: `guidance/commits`, `guidance/conventional-commits`, `global/core`, `arch/node-package`, `arch/node-package-library`, `arch/node-library`, `tooling/commitlint`, `tooling/eslint`, `tooling/husky`, `tooling/lint-staged`, `arch/node-root-package`, `arch/node-package-application`, `arch/node-tool`, `lang/typescript`, and `tooling/yarn`.
- Detector-confirmed active mixins: `mixin/commitlint-conventional-commits`, `mixin/eslint-lint-staged`, `mixin/husky-commitlint`, `mixin/husky-lint-staged`, `mixin/husky-typescript`, `mixin/typescript-eslint`, and `mixin/typescript-library`.
- Apply all source assets declared by those module and mixin manifests. The following files are their source AI assets in deterministic resolution order:
- Source module AI file: `catalog/modules/guidance-commits/files/instructions/commits.instructions.md`.
- Source module AI file: `catalog/modules/guidance-conventional-commits/files/instructions/conventional-commits.instructions.md`.
- Source module AI file: `catalog/modules/global-core/files/instructions/global-repo-local-agent-notes.instructions.md`.
- Source module AI file: `catalog/modules/global-core/files/instructions/global-repo-tmp.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-package/files/instructions/node-package-architecture.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-package/files/instructions/node-package-package-managers.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-package/files/instructions/node-package-proto.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-package/files/instructions/node-package-eslint-prettier-policy.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-package/files/instructions/node-package-editor-prettier-disable.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-package-library/files/instructions/node-package-library-architecture.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-library/files/instructions/node-library-architecture.instructions.md`.
- Source module AI file: `catalog/modules/tooling-commitlint/files/instructions/commitlint-configuration.instructions.md`.
- Source module AI file: `catalog/modules/tooling-eslint/files/instructions/eslint-configuration.instructions.md`.
- Source module AI file: `catalog/modules/tooling-husky/files/instructions/husky-configuration.instructions.md`.
- Source module AI file: `catalog/modules/tooling-lint-staged/files/instructions/lint-staged-configuration.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-root-package/files/instructions/node-root-package-architecture.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-package-application/files/instructions/node-package-application-architecture.instructions.md`.
- Source module AI file: `catalog/modules/arch-node-tool/files/instructions/node-tool-architecture.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-architecture.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-function-namespace-types.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-build-and-scripts.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-tsconfig-layout.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-runtime-validation.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-node-api-typings.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-native-execution.instructions.md`.
- Source module AI file: `catalog/modules/lang-typescript/files/instructions/typescript-testing.instructions.md`.
- Source module AI file: `catalog/modules/tooling-yarn/files/instructions/yarn-configuration.instructions.md`.
- Source mixin AI file: `catalog/mixins/commitlint-conventional-commits/files/instructions/commitlint-conventional-commits.instructions.md`.
- Source mixin AI file: `catalog/mixins/eslint-lint-staged/files/instructions/eslint-lint-staged.instructions.md`.
- Source mixin AI file: `catalog/mixins/husky-commitlint/files/instructions/husky-commitlint.instructions.md`.
- Source mixin AI file: `catalog/mixins/husky-lint-staged/files/instructions/husky-lint-staged.instructions.md`.
- Source mixin AI file: `catalog/mixins/husky-typescript/files/instructions/husky-typescript.instructions.md`.
- Source mixin AI file: `catalog/mixins/typescript-eslint/files/instructions/typescript-eslint.instructions.md`.
- Source mixin AI file: `catalog/mixins/typescript-library/files/instructions/typescript-library.instructions.md`.

## Agent Working Rules

- Prefer evolving the CLI and catalog model over adding ad hoc scripts.
- After adding, editing, renaming, or removing catalog modules, follow `.github/instructions/module-reflection.instructions.md` to discover and run the repository reflection flow.
- Keep consumer repositories isolated and functional without depending on this repository at runtime.
- Treat managed/shared outputs as immutable unless a user explicitly requests direct edits.
- Route project-specific tuning through override layers, not by patching shared defaults in place.
- Challenge prompts when terminology is inconclusive or likely incorrect (for example, "node app" requested while context looks like a web app).
- Ask whether requested changes belong in modules or local AI files when intent appears ambiguous.
- Always use `yarn lint:fix` instead of `yarn lint`, including within aggregate validation commands.

## Mixin Evaluation

- For every module addition, edit, review, or analysis, check whether any concrete configuration or guardrail is valid only when multiple ordinary modules are present.
- Inspect the affected module's dependency closure before deciding ownership. Consult the mixin decisions and upstream risks in `plan/phase-05-cli-mcp-bootstrap.md`.
- Recommendations and baseline prohibitions may remain in an architecture module; they do not create mixins by themselves.
- Keep concrete tool implementation in the selected tooling module unless another module changes that implementation.
- Use an ordinary dependency when one module always specializes another; do not model that relationship as a mixin.
- When a mixin is plausible, prompt the user before implementing it and include the required modules, the intersection-specific rule, why no ordinary module owns it alone, migration or duplication risk, and a recommendation.
- Record accepted, deferred, and rejected mixin candidates in `plan/phase-05-cli-mcp-bootstrap.md` with reasoning.
- Never add mixins to presets or selected stack state.

## AI Asset Usage Note

As new AI files are introduced, agents should actively consume and validate them during bootstrap flows.
This includes upcoming AI files for TypeScript setup and linting setup, plus related architecture/guardrail assets.

## Expected Outputs

- Deterministic module and preset behavior.
- Clear provenance for shared content and backport-safe workflows.
- Validation-first changes (`yarn check`, targeted command checks).
