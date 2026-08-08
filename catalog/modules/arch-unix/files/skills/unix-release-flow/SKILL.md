---
name: unix-release-flow
description: "Commit or release changes in Unix configuration and shell repositories. Use when asked to commit, create a release, ship changes, prepare release notes, or update a changelog."
argument-hint: "[optional scope or push instruction]"
---

# Unix Release Flow

Use this workflow for commit and release requests in repositories that apply the Unix architecture policy.

## 1. Establish Intent

- Determine whether the request is commit-only, release preparation, or release plus push.
- Record the current branch, requested target branch, push intent, intended change summary, and preferred commit scope.
- Do not switch branches or push unless the request requires it.

## 2. Inspect Repository Policy and State

- Read the applicable repository AI instructions and release documentation.
- Inspect the working tree, staged changes, recent commit style, and remotes.
- Determine whether the changelog is version-based, hash-based, optional, or absent.
- Inspect existing changelog headings and recent entries before deciding that no pattern exists.
- Classify pending files as code/runtime, documentation, changelog, or unrelated work.
- Stop and ask for direction when unrelated changes make the intended commit scope ambiguous.

## 3. Validate Before Committing

- Run targeted parser, syntax, lint, configuration, and smoke checks for modified areas.
- Run broad checks when shared startup behavior or many scripts changed.
- Test normal and update/provisioning modes separately when applicable.
- Run no-artifact and repeated-setup checks when side effects or bootstrap behavior changed.
- Stop on required validation failure. Fix the changed slice and rerun the same check before proceeding.

## 4. Create the Code Commit

- Stage only intended code/runtime files and directly related documentation required by repository policy.
- Review the staged diff and staged file list.
- Commit with a focused Conventional Commit title and scope when clear.
- Record the resulting code commit hash and exact title.

## 5. Update Release Documentation

- Skip this step when repository policy declares no changelog update for this change.
- Preserve an established repository changelog pattern whenever one exists.
- For a hash-based changelog, use the exact code commit hash and title. Preserve required sections and explicit empty markers.
- For a version-based changelog, use the repository's existing version and heading conventions; do not invent a version.
- If a changelog is required but no repository pattern exists, use the bundled [fallback changelog template](./assets/CHANGELOG.md).
- When the changelog file does not exist, create it from the fallback template only if the request or repository policy requires a changelog.
- Replace every template placeholder, retain the required section headings, and use `None.` for empty sections.
- Stage only changelog or release-note files and commit them separately with a Conventional Commit title.
- Keep unrelated documentation in a separate commit.

## 6. Verify Completion

- Verify commit order: code first, then changelog or release notes when required.
- Verify that changelog hashes, versions, titles, and dates match repository policy.
- Verify the final working tree is clean or contains only intentionally excluded user changes.
- Re-run any lightweight final check required by repository policy.

## 7. Push Only When Requested

- Push the requested branch without force.
- Never amend, force-push, reset, or discard existing work unless explicitly requested.
- If push fails or only partially completes, stop and report the exact remote state. Do not attempt destructive recovery.

## Output

Report:

- Release or commit completed: `yes/no`
- Code commit: `<hash and title>`
- Changelog/release commit: `<hash and title>` or `not required`
- Validation: `<checks and outcome>`
- Highlights: `<user-visible changes>`
- Compatibility or migration notes: `<notes or none>`
- Pushed: `yes/no`
- Remaining working-tree changes: `<intentional paths or none>`