# Phase 07 - Subtree Sync and Backport Workflow

## Objective

Enable two-way contribution flow between isolated consumer repos and this upstream library.

## Deliverables

- Subtree-backed pull/update flow per module or module group.
- Backport command to extract shared-path changes.
- Provenance metadata for source refs and imported snapshots.
- Branch/patch output mode for upstream contribution.

## Tasks

1. Define transport abstraction for subtree operations.
2. Record source repository/ref in stack lock metadata.
3. Implement `update` command that pulls upstream module snapshots.
4. Implement `backport` command that maps consumer diffs to source paths.
5. Add safety checks preventing accidental non-shared backport content.

## Exit Criteria

- Consumer can pull updated modules without losing local overrides.
- Backport output contains only module-managed paths.
- Provenance metadata is complete and auditable.
