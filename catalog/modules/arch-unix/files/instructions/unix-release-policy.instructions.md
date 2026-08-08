---
description: "Use when committing, shipping, preparing release notes, or updating changelogs in Unix configuration and shell repositories. Defines release routing and Git safety invariants."
---

# Unix Release Policy

## Release Routing

- Treat requests such as "commit", "create a release", "ship it", and "prepare release notes" as release workflow requests when repository changes are involved.
- Use the repository's declared release skill or documented release process. Do not invent an ad hoc process.
- Discover repository-local commit and changelog requirements before staging.

## Working-Tree Safety

- Inspect and classify pending changes before staging.
- Separate code/runtime, documentation, changelog, and unrelated changes.
- Stage only files that belong to the intended commit and review the staged diff before committing.
- Preserve unrelated user changes. Stop for direction when they make commit scope ambiguous.
- Never force-push, amend, reset, discard, or rewrite existing work unless explicitly requested.

## Commits and Changelogs

- Use focused Conventional Commits and include a scope when the affected area is clear.
- Commit code or runtime changes before changelog or release-note changes.
- Keep changelog changes in a separate commit when a changelog is required.
- Follow the repository's declared changelog identity: version-based, hash-based, optional, or absent.
- For a hash-based changelog, capture the code commit hash after committing and reproduce it exactly in the changelog entry.
- Keep unrelated documentation out of code and changelog commits.

## Completion

- Verify required commit order and changelog identity after committing.
- Confirm that the working tree is clean or contains only intentionally excluded changes.
- Push only when requested.
- Report commit hashes, release highlights, compatibility or migration notes, validation status, and push status.