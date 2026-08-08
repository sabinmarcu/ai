# AI Stack Entrypoint

<!-- Managed by @sabinmarcu/ai. Do not edit directly. -->

## Reconciliation

- Use the [stack reconciliation skill](../catalog/bootstrap/skills/stack-reconciliation/SKILL.md) after repository changes may alter module applicability.
- Use the CLI workflow from that skill; do not edit managed files or stack state directly.

## Catalog Source Assets

- [baseline/stack-reconciliation](../catalog/bootstrap/skills/stack-reconciliation/SKILL.md)
- [guidance/commits](../catalog/modules/guidance-commits/files/instructions/commits.instructions.md)
- [guidance/conventional-commits](../catalog/modules/guidance-conventional-commits/files/instructions/conventional-commits.instructions.md)
- [global/core](../catalog/modules/global-core/files/instructions/global-repo-local-agent-notes.instructions.md)
- [global/core](../catalog/modules/global-core/files/instructions/global-repo-tmp.instructions.md)
- [arch/node-package](../catalog/modules/arch-node-package/files/instructions/node-package-architecture.instructions.md)
- [arch/node-package](../catalog/modules/arch-node-package/files/instructions/node-package-package-managers.instructions.md)
- [arch/node-package](../catalog/modules/arch-node-package/files/instructions/node-package-proto.instructions.md)
- [arch/node-package](../catalog/modules/arch-node-package/files/instructions/node-package-eslint-prettier-policy.instructions.md)
- [arch/node-package](../catalog/modules/arch-node-package/files/instructions/node-package-editor-prettier-disable.instructions.md)
- [arch/node-package-library](../catalog/modules/arch-node-package-library/files/instructions/node-package-library-architecture.instructions.md)
- [arch/node-library](../catalog/modules/arch-node-library/files/instructions/node-library-architecture.instructions.md)
- [tooling/commitlint](../catalog/modules/tooling-commitlint/files/instructions/commitlint-configuration.instructions.md)
- [tooling/eslint](../catalog/modules/tooling-eslint/files/instructions/eslint-configuration.instructions.md)
- [tooling/husky](../catalog/modules/tooling-husky/files/instructions/husky-configuration.instructions.md)
- [tooling/lint-staged](../catalog/modules/tooling-lint-staged/files/instructions/lint-staged-configuration.instructions.md)
- [arch/node-root-package](../catalog/modules/arch-node-root-package/files/instructions/node-root-package-architecture.instructions.md)
- [arch/node-package-application](../catalog/modules/arch-node-package-application/files/instructions/node-package-application-architecture.instructions.md)
- [arch/node-tool](../catalog/modules/arch-node-tool/files/instructions/node-tool-architecture.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-architecture.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-function-namespace-types.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-build-and-scripts.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-tsconfig-layout.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-runtime-validation.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-node-api-typings.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-native-execution.instructions.md)
- [lang/typescript](../catalog/modules/lang-typescript/files/instructions/typescript-testing.instructions.md)
- [tooling/yarn](../catalog/modules/tooling-yarn/files/instructions/yarn-configuration.instructions.md)
- [mixin/commitlint-conventional-commits](../catalog/mixins/commitlint-conventional-commits/files/instructions/commitlint-conventional-commits.instructions.md)
- [mixin/eslint-lint-staged](../catalog/mixins/eslint-lint-staged/files/instructions/eslint-lint-staged.instructions.md)
- [mixin/husky-commitlint](../catalog/mixins/husky-commitlint/files/instructions/husky-commitlint.instructions.md)
- [mixin/husky-lint-staged](../catalog/mixins/husky-lint-staged/files/instructions/husky-lint-staged.instructions.md)
- [mixin/husky-typescript](../catalog/mixins/husky-typescript/files/instructions/husky-typescript.instructions.md)
- [mixin/typescript-eslint](../catalog/mixins/typescript-eslint/files/instructions/typescript-eslint.instructions.md)
- [mixin/typescript-library](../catalog/mixins/typescript-library/files/instructions/typescript-library.instructions.md)

## Repository-Local Override Locations

- `.github/instructions/local/commits/`
- `.github/instructions/local/conventional-commits/`
- `.github/instructions/local/`
- `.github/prompts/local/`
- `.github/skills/local/`
- `.github/agents/local/`
- `.ai-local/`
- `.github/instructions/local/node-package/`
- `.github/instructions/local/node-package-library/`
- `.github/instructions/local/node-library/`
- `.github/instructions/local/commitlint/`
- `.github/instructions/local/linting/`
- `.github/instructions/local/husky/`
- `.github/instructions/local/lint-staged/`
- `.github/instructions/local/node-root-package/`
- `.github/instructions/local/node-package-application/`
- `.github/instructions/local/node-tool/`
- `.github/instructions/local/typescript/`
- `.github/instructions/local/yarn/`
- `.github/instructions/local/mixins/commitlint-conventional-commits/`
- `.github/instructions/local/mixins/eslint-lint-staged/`
- `.github/instructions/local/mixins/husky-commitlint/`
- `.github/instructions/local/mixins/husky-lint-staged/`
- `.github/instructions/local/mixins/husky-typescript/`
- `.github/instructions/local/mixins/typescript-eslint/`
- `.github/instructions/local/mixins/typescript-library/`

Catalog source assets are linked in place and are not managed copies. Keep repository-specific tuning in the override locations above.
