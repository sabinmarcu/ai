# arch/unix

Operational architecture guardrails for Unix configuration and shell repositories.

## Included AI Files

- `files/instructions/unix-architecture.instructions.md`
- `files/instructions/unix-validation.instructions.md`
- `files/instructions/unix-release-policy.instructions.md`
- `files/skills/unix-release-flow/SKILL.md`
- `files/skills/unix-release-flow/assets/CHANGELOG.md`

## Intent

- Keep paths, runtime state, secrets, and startup behavior portable and explicit.
- Require idempotent bootstrap and non-destructive recovery behavior.
- Validate syntax, runtime modes, side effects, and repeated setup before release.
- Standardize release routing, staging boundaries, Conventional Commits, changelog handling, and Git safety.
- Adapt release details to repository-defined changelog and commit policy.

This module has no automatic applicability rule. Select it explicitly for repositories that need Unix configuration, shell, bootstrap, or release guardrails.