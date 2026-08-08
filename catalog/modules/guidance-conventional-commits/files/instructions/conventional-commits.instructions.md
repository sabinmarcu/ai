---
description: "Universal commit-authoring guidance based on Conventional Commits."
applyTo: "**/*"
---

# Conventional Commits Guidance

## Format

- Use Conventional Commits for every commit.
- Format the first line as `<type>(<optional-scope>): <description>`.
- Use common types such as `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, and `build`.
- Keep the description concise, imperative, and focused on one coherent change.
- Use `!` or a `BREAKING CHANGE:` footer when the commit introduces a breaking change.

## Scope

- Use a concise scope when the affected project, package, subsystem, or concern is clear.
- Omit the scope when no repository-specific guidance requires one and a useful scope would be artificial.
- Follow more specific repository guidance when it defines required or allowed scopes.

## Body and Footers

- Add a body when motivation, tradeoffs, or non-obvious context will help future readers.
- Use footers for breaking changes, issue references, and other structured metadata.
- Keep unrelated changes in separate commits.

## Enforcement Independence

- Follow this guidance whether or not the repository has commitlint or another enforcement tool.
- Treat repository-local exceptions as explicit policy that must be documented.