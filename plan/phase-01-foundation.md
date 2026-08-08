# Phase 01 - CLI Foundation and Repository Reset

Status: Complete (2026-08-08)

## Objective

Establish a clean CLI-first architecture and retire the legacy instructions/skills bootstrap flow.

## Deliverables

- Node + TypeScript + Clipanion scaffold.
- New command surface with `init`, `detect`, `apply`, `status`, `verify`.
- Baseline catalog directory for modules and presets.
- Initial scaffold validation, superseded by catalog tests and type checking.

## Tasks

1. Replace package scripts and dependencies with CLI-oriented setup.
2. Remove old instruction/skill/template bootstrap assets.
3. Add CLI entrypoint and command registration.
4. Add command placeholders with stable UX contracts.
5. Add `yarn check` validation for the initial scaffold and typing.

## Exit Criteria

- `yarn check` passes.
- `yarn cli -- --help` lists all baseline commands.
- No legacy bootstrap assets remain in active use.
