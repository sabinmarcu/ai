# lang/typescript

TypeScript architecture module for node projects and monorepos.

## Included AI Files

- `files/instructions/typescript-architecture.instructions.md`
- `files/instructions/typescript-function-namespace-types.instructions.md`
- `files/instructions/typescript-build-and-scripts.instructions.md`
- `files/instructions/typescript-tsconfig-layout.instructions.md`
- `files/instructions/typescript-runtime-validation.instructions.md`
- `files/instructions/typescript-node-api-typings.instructions.md`
- `files/instructions/typescript-native-execution.instructions.md`
- `files/instructions/typescript-testing.instructions.md`

## Intent

- Keep function-owned public types attached to their runtime API through declaration merging.
- Enforce a fast and reliable `typecheck` script baseline.
- Standardize three-file tsconfig split for regular projects.
- Standardize root + package tsconfig reference model for monorepos.
- Keep editor/typecheck config separate from build config.
- Choose between native Node.js TypeScript execution and `tsx` with an explicit compatibility checklist.
