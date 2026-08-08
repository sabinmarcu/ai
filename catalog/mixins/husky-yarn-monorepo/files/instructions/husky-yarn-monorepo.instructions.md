---
description: "Yarn constraints and release-version validation in monorepo pre-commit hooks."
applyTo: "**/{package.json,.yarnrc.yml,.husky/pre-commit}"
---

# Husky Yarn Monorepo Integration

- Define repository scripts for `yarn constraints` and `yarn version check` using clear names.
- Invoke both scripts from the root Husky `pre-commit` hook.
- Run constraints before version checks so dependency-policy failures are reported first.
- Preserve linting and type-checking commands contributed by other active Husky mixins.
- Keep these checks at repository scope; do not duplicate them in workspace-local hooks.
- Revalidate command names and release-workflow assumptions against the active Yarn version when Yarn is upgraded.