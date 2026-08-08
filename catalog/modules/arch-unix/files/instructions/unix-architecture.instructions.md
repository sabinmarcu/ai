---
description: "Use when changing Unix configuration, shell startup, bootstrap, installation, paths, state, secrets, or provisioning behavior. Enforces portable and idempotent architecture."
---

# Unix Architecture Guardrails

## Paths, State, and Secrets

- Prefer tool-native paths and the relevant XDG base directory over custom locations.
- Use `$HOME`, XDG variables, or documented repository variables in reusable commands. Never embed a username or machine-specific absolute path.
- Keep generated runtime state out of committed configuration repositories.
- Store configuration, data, state, and cache under their corresponding XDG locations when the tool supports them.
- Keep secrets in untracked local files, environment variables, or an established secret provider. Never commit them as shared defaults.
- Do not create files relative to an arbitrary current working directory unless that output is the explicit purpose of the command.

## Startup and Mutation Boundaries

- Keep normal interactive startup lightweight and free of network, package-manager, compilation, migration, or regeneration side effects.
- Gate installation, update, compilation, and other expensive mutations behind an explicit install or update mode.
- Make mutation modes observable and independently testable.
- Keep scripts focused and composable. Avoid broad architecture rewrites unless explicitly requested.
- Remove bootstrap-only helpers after initialization while preserving documented user-facing commands and extension hooks.

## Idempotent Bootstrap and Installation

- Inspect existing files, links, installations, and generated state before changing them.
- Distinguish managed outputs from user-owned files and local overrides.
- Preserve user-owned state. Back up a conflicting file before replacing it with a managed file or link.
- Apply the smallest change needed to converge on the desired state.
- Re-running setup with the same inputs must produce the same result without duplicate entries, repeated downloads, or additional backups.
- Define interruption and recovery behavior before automating a destructive or multi-step replacement.
- Report partial completion clearly; never hide a failed migration behind a successful exit.