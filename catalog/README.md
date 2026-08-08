# Catalog

The catalog contains composable module and preset manifests.

Universal guidance is independent of runtime and enforcement tooling:

- `guidance/conventional-commits`: commit-authoring policy loaded through `global/core` for every repository.

## Modules

Each module lives under `catalog/modules/<module-folder>/module.json`.

Web guidance is split by concern:

- `guardrails/web-platform`: supported browsers, native APIs, and no-polyfill policy.
- `guardrails/web-style`: Vanilla Extract, `@sabinmarcu/theme`, responsive styling, and accessibility.
- `arch/web-react`: Web React component ownership, state selection, models, data, and effects for applications and libraries.
- `lang/typescript`: shared TypeScript architecture, including function-owned type declaration merging.

Node project architecture is split by concern and project classification:

- `arch/node-package`: common policy for every project containing `package.json`, including the default `/src` source layout.
- `arch/node-root-package`: repository-root policy for monorepos and standalone Node packages, including the baseline ESLint, lint-staged, Husky, and commitlint toolset.
- `arch/node-package-application`: shared runtime and lifecycle guidance for deployable or executable Node package projects.
- `arch/node-application`: production Node.js servers and services.
- `arch/web-application`: deployable applications serving browsers.
- `arch/node-tool`: one-off executables used by developers, automation, or CI.
- `arch/node-package-library`: shared publication guidance for Node package libraries, including `/dist` output.
- `arch/node-library`: publishable libraries that include `@types/node`.
- `arch/web-library`: publishable browser libraries that do not include `@types/node`.

Unix guidance is provided by:

- `arch/unix`: portable and idempotent Unix configuration, validation, release policy, and release-flow skill.

Monorepo guidance is provided by:

- `arch/monorepo`: project boundaries, discovery, task graphs, dependency consistency, generated configuration, and validation scope.

Node project tooling is split by concrete owner:

- `tooling/yarn`: Yarn Modern configuration, linker state, SDKs, and generated files.
- `tooling/husky`: Husky lifecycle and Git hook configuration.
- `tooling/commitlint`: commitlint dependencies, configuration, and package scripts.
- `tooling/lint-staged`: the lint-staged dependency and package script.
- `tooling/eslint`: ESLint dependencies, configuration, scripts, and editor integration.

## Presets

Each preset lives under `catalog/presets/<preset-id>.json` and references module IDs.

The `node-web` preset composes Yarn, web platform, styling, React, TypeScript,
and web-application modules. Root-package policy remains contextually detected
and is not part of the application preset.

## Mixins

Each mixin lives under `catalog/mixins/<mixin-folder>/mixin.json` and declares
the ordinary modules required for activation. Mixins provide managed guidance
for module combinations, activate automatically after ordinary module
resolution, and never appear in presets or selected stack state.

Available mixins:

- `mixin/typescript-eslint`: optional TypeScript peer loading and effective-config validation for the shared ESLint baseline.
- `mixin/react-eslint`: React lint peers, TSX coverage, hooks rules, accessibility rules, and effective-config validation.
- `mixin/typescript-library`: TypeScript build and declaration output aligned with the library `/src` to `/dist` publication contract.
- `mixin/eslint-lint-staged`: staged-file ESLint fixing through lint-staged.
- `mixin/husky-lint-staged`: lint-staged invocation from the Husky pre-commit hook.
- `mixin/husky-typescript`: TypeScript type checking in the Husky pre-commit hook.
- `mixin/husky-commitlint`: commitlint validation in the Husky commit-msg hook.
- `mixin/husky-yarn-monorepo`: Yarn constraints and version checks in the root Husky pre-commit hook.
- `mixin/conventional-commits-monorepo`: required workspace-aware scopes and repository scope vocabulary for monorepo commits.
- `mixin/commitlint-conventional-commits`: `@commitlint/config-conventional` enforcement for universal commit guidance.
- `mixin/commitlint-monorepo-scopes`: `@sabinmarcu/commitlint-config-workspaces` enforcement for Node workspace monorepos.

## Notes

- Managed paths are owned by shared layer sync/materialization.
- Override paths are intended for repository-specific or machine-local tuning.
- Module IDs are stable references used in `.ai/stack.yml`.
- Catalog loading validates module and preset references, dependency cycles, source assets, and exact managed-path ownership.
- Stack initialization evaluates applicability, expands dependencies in stable order, and rejects selected conflicts.
