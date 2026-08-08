# arch/node-package

Common architecture guardrails for every node project.

## Included AI Files

- `files/instructions/node-package-architecture.instructions.md`
- `files/instructions/node-package-package-managers.instructions.md`
- `files/instructions/node-package-proto.instructions.md`
- `files/instructions/node-package-eslint-prettier-policy.instructions.md`
- `files/instructions/node-package-editor-prettier-disable.instructions.md`

## Intent

- Keep source code under `/src` unless repository-local guidance overrides the layout.
- Standardize base architecture rules for all node projects.
- Let `arch/node-root-package` add repository-root tooling without imposing it on workspace packages.
- Prohibit npm and Corepack while preferring Proto and Yarn Modern.
- Document project-local Proto usage and MCP setup for Copilot CLI and VS Code.
- Enforce ESLint baseline and explicit Prettier prohibition.
