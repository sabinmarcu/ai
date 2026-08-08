---
description: "Use when validating Unix configuration, shell scripts, bootstrap changes, installers, startup behavior, or side effects before commit or release."
---

# Unix Validation Policy

## Validation Selection

- Use the narrow parser, syntax checker, linter, or inspection command owned by the changed tool.
- Validate every changed script. Use a repository-wide syntax scan when edits cross many scripts or shared startup behavior.
- Run behavior checks in an isolated environment when they may alter user state.
- Validation must precede the code commit in a release flow.

## Runtime Modes

- Test normal startup after startup, shell, or configuration changes.
- Test update, install, or provisioning mode separately when behavior differs from normal startup.
- Exercise debug mode when cleanup, ordering, resolution, or diagnostics changed.
- Verify that normal startup does not perform update-mode mutations.

## Side-Effect Checks

- Use the tool's own configuration inspection command to verify effective values.
- Run commands from an empty temporary directory when checking for accidental project-local artifacts.
- Compare directory contents before and after the command and fail the check on unexpected output.
- For bootstrap or installation changes, run setup twice and verify that the second run is a no-op or an equivalent convergence pass.
- Verify recovery behavior when a change can replace user files, links, or persistent state.

## Release Gate

- Do not commit or release when required validation fails.
- Record checks that could not run and the reason; do not imply they passed.
- After release commits, verify commit order, changelog identity when applicable, and final working-tree state.