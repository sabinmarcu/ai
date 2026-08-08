---
description: "Workspace-aware Conventional Commit scope guidance for monorepos."
applyTo: "**/*"
---

# Conventional Commits for Monorepos

## Required Scope

- Include a scope in every commit subject.
- For a change owned by one workspace, use that workspace's package name or an alias derived by the shared workspace commitlint config.
- Use the same scope vocabulary enforced by the repository's workspace commit configuration.
- Do not invent a scope when an allowed workspace or repository scope already describes the change.

## Workspace Names and Aliases

- A workspace package name comes from that workspace's `package.json` `name` field.
- For a scoped package, the shared config exposes both the full package name and its unscoped shorthand as allowed commit scopes. For example, `@sabinmarcu/utils-repo` allows both `@sabinmarcu/utils-repo` and `utils-repo`.
- An unscoped workspace name remains unchanged. For example, a package named `web` uses `web`; it does not gain another shorthand.
- Prefer the short alias over the full package name whenever the alias uniquely identifies one workspace, such as `fix(utils-repo): preserve workspace ordering`.
- Use the full scoped package name when repository policy or ambiguity makes it clearer, such as `feat(@sabinmarcu/utils-repo): expose alias metadata`.
- These aliases are commit-scope vocabulary generated from package names; they are not filesystem paths, import aliases, or arbitrary nicknames.

## Alias Collisions

- An alias collision occurs when scoped workspace names share the same unscoped name. For example, `@a/x` and `@b/x` both derive the alias `x`.
- Before creating or renaming a workspace whose alias would collide with an existing workspace, stop and ask the developer for explicit approval.
- Explain that the collision makes short commit scopes ambiguous, weakens ownership signals in history, and may confuse automation that maps scopes back to workspaces.
- Do not create or rename the colliding workspace until the developer approves after being told those risks.
- When a collision exists, always use the full package name for every affected workspace, such as `fix(@a/x): ...` or `feat(@b/x): ...`; never use the shared alias `x`.
- Continue preferring aliases for workspaces whose aliases remain unique.

## Repository Scopes

- Use `root` for changes to the root package itself.
- Use `repo` for repository-wide architecture, orchestration, or configuration.
- Use `ci` for continuous-integration workflows and automation.
- Use `docs` for repository-level documentation.
- Use `deps` for dependency maintenance spanning workspace ownership boundaries.

## Commit Boundaries

- Split changes across commits when they belong to independently owned workspaces or unrelated repository concerns.
- Use a workspace scope for a focused workspace change even when root metadata is updated incidentally.
- Use a repository scope only when the change genuinely spans or governs the repository.