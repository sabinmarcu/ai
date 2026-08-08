# arch/node-root-package

Repository-root policy for monorepos and standalone Node packages.

## Included AI Files

- `files/instructions/node-root-package-architecture.instructions.md`

## Intent

- Distinguish repository-root packages from workspace-local packages.
- Require the repository baseline of ESLint, lint-staged, Husky, and commitlint.
- Keep integration behavior owned by automatically activated mixins.