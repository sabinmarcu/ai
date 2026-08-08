---
description: "Commitlint enforcement for workspace-aware monorepo scopes."
applyTo: "**/{package.json,.commitlintrc,.commitlintrc.json,.commitlintrc.yml,.commitlintrc.yaml,.commitlintrc.js,.commitlintrc.cjs,.commitlintrc.mjs,commitlint.config.js,commitlint.config.cjs,commitlint.config.mjs}"
---

# Commitlint Monorepo Scope Integration

## Setup

- Install `@sabinmarcu/commitlint-config-workspaces` at the repository root.
- Extend it after `@commitlint/config-conventional` so workspace scope rules augment the conventional format.
- Keep commitlint and this shareable config resolvable from the same root dependency scope.
- Run commitlint from the repository root so workspace discovery uses the intended manifest and working directory.

## Enforced Scope Model

- Require a non-empty scope for every commit.
- Allow discovered workspace package names and aliases.
- For a scoped workspace such as `@sabinmarcu/utils-repo`, allow both the full name `@sabinmarcu/utils-repo` and the unscoped alias `utils-repo`.
- For an unscoped workspace such as `web`, allow `web` without inventing an additional alias.
- Prefer an alias when it uniquely identifies one workspace.
- When multiple scoped workspaces derive the same alias, always author commits with their full package names and never use the ambiguous alias, even if the shared config accepts it.
- Allow the repository scopes `root`, `repo`, `ci`, `docs`, and `deps`.
- Treat these aliases as commit scopes derived from workspace package names, not filesystem paths, import aliases, or arbitrary nicknames.
- Treat package-alias behavior as repository policy rather than assuming every arbitrary monorepo tool exposes equivalent names.

## Validation and Compatibility

- Validate one unique workspace alias, one full scoped package name, each repository scope, a missing scope, and an unknown scope.
- Detect duplicate derived aliases during setup and upgrades. Report each affected full package name and confirm that commit guidance requires full-name scopes for those workspaces.
- Use this integration for Node monorepos whose workspaces are discoverable from package manifests by `@sabinmarcu/utils-repo`.
- Do not claim compatibility for Go, Rust, or other monorepos without package-manifest workspaces.
- Revalidate discovery and alias behavior when upgrading `@sabinmarcu/commitlint-config-workspaces` or `@sabinmarcu/utils-repo`.