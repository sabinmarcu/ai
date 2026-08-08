---
description: "Project boundaries, roles, discovery, and ownership guardrails for repositories containing multiple coordinated projects."
---

# Monorepo Architecture

## Project Boundaries

- Keep every runnable, buildable, testable, or releasable project within the declared repository boundary.
- Give each project one explicit role, such as application, library, tool, documentation, or shared configuration.
- Derive default lifecycle behavior from project role rather than from incidental folder names.
- Keep project-specific exceptions local to the project and make them explicit.
- Keep repository-wide policy and orchestration at the repository root.
- Do not place project-owned implementation details in root configuration when the project can own them directly.

## Project Discovery

- Maintain one canonical project inventory or one canonical set of discovery patterns.
- Keep every system that discovers projects aligned with the canonical inventory.
- Validate duplicate discovery declarations for drift when duplication cannot be avoided.
- Add, move, or remove a project across every required discovery surface in the same change.
- Reject projects that are only partially registered or that fall outside the declared repository boundary.

## Shared and Local Ownership

- Put cross-project defaults in shared root policy.
- Put project-specific commands, exceptions, and lifecycle differences in project-local configuration.
- Promote a local rule to shared policy only when it represents a stable contract for a project role.
- Keep naming, directory layout, project role mappings, release destinations, and organization-specific metadata in local guidance.
- Preserve clear override points so local requirements do not require patching shared defaults.

## Change Scope

- Identify the owning project or root policy before changing behavior.
- Treat root configuration and shared policy changes as repository-wide changes unless their scope is demonstrably narrower.
- Keep unrelated project changes separate even when they share the same repository.
- Update architecture documentation when project roles, discovery rules, or ownership boundaries change.