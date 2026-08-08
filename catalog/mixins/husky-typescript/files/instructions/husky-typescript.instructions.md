---
description: "TypeScript validation in Husky-managed pre-commit hooks."
applyTo: "**/{package.json,.husky/pre-commit}"
---

# Husky TypeScript Integration

- Keep the `typecheck` package script owned by the TypeScript module.
- Invoke `typecheck` from the Husky `pre-commit` hook through the selected package manager.
- Preserve other active pre-commit checks when updating the hook.
- Run type checking after staged fixing so validation sees the content that will be committed.
- Fail the commit when type checking fails.