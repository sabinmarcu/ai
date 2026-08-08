---
description: "Commitlint enforcement for Conventional Commits guidance."
applyTo: "**/{package.json,.commitlintrc,.commitlintrc.json,.commitlintrc.yml,.commitlintrc.yaml,.commitlintrc.js,.commitlintrc.cjs,.commitlintrc.mjs,commitlint.config.js,commitlint.config.cjs,commitlint.config.mjs}"
---

# Commitlint Conventional Commits Integration

- Install `@commitlint/config-conventional` alongside `@commitlint/cli`.
- Extend `@commitlint/config-conventional` from the root commitlint configuration.
- Preserve additional shareable configs contributed by more specific guidance integrations.
- Keep commit-authoring policy in `guidance/conventional-commits`; this mixin only maps that policy to commitlint configuration.
- Validate representative valid, invalid, scoped, unscoped, and breaking commit messages after configuration changes.