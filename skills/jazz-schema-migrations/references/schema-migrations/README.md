# Schema and Migration Operating Model

Schema changes in Jazz are distributed rollouts, not one-shot DB migrations.

## Constructor Decision Guide

- `co.map`: canonical entity with fixed keys.
- `co.record`: dynamic key-indexed lookup (O(1) by key).
- `co.list`: ordered projection for UI and deterministic traversal.
- `co.feed`: append-only session/account event streams.
- `co.account` + `co.profile` + root map: per-user graph boundary.

## Ownership Decision Guide

- Account-owned values for private user state.
- Group-owned values for collaborative edits and delegated access.

## Migration Strategy

- Account migration: bootstrap/evolve root/profile.
- CoMap migration: loaded-instance upgrades.
- Mixed-version clients: preserve compatibility with optional fields and versioned unions.
