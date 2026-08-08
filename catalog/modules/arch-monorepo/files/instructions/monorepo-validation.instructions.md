---
description: "Targeted, affected, and repository-wide validation guardrails for repositories containing multiple coordinated projects."
---

# Monorepo Validation

## Validation Scope

- Start with the narrowest check that can falsify the current change.
- Run the owning project's build, lint, test, or behavior check after a project-local change.
- Run affected-project checks when a change can influence downstream consumers.
- Run full repository validation in continuous integration.
- Treat affected checks as an optimization, not as a replacement for full validation.

## Expanded Validation

- Expand validation for root configuration, shared policy, project discovery, dependency rules, and repository tooling changes.
- Validate all consumers when a shared project contract or public interface changes.
- Validate both default behavior and local overrides when shared task definitions change.
- Regenerate and verify derived configuration after topology, role, or dependency changes.
- Check that removed or moved projects leave no stale discovery entries, references, tasks, or release configuration.

## Validation Order

- Validate repository structure and dependency policy before running graph tasks.
- Build required upstream projects before checking consumers.
- Run targeted checks before broader checks so failures remain attributable.
- Keep release validation complete before versioning, publication, or deployment mutations begin.
- Report which projects and validation scopes were checked.

## Failure Handling

- Fix failures at the owning project or shared policy boundary.
- Do not bypass a graph failure by removing a required dependency or validation step.
- Distinguish a project-local defect from a shared-policy or downstream compatibility failure.
- Preserve unrelated project changes while repairing validation failures.
- Record intentional validation exceptions with their scope and rationale.