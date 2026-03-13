---
name: jazz-sync-architecture
description: Design distributed synced realtime eventually consistent Jazz systems with robust browser WASM compatibility deep loading subscriptions migration-safe schema evolution and multi-surface worker topology
---

Use the `jazz-sync-architecture` skill to solve architecture and implementation
tasks involving Jazz sync, loading, schemas, migrations, runtime
compatibility, and multi-surface worker topology.

## Task Routing

- Runtime bootstrap/WASM failures → `browser-wasm-compat`
- Loading/subscription race bugs → `subscriptions-and-loading`
- Data-model and ownership design → `schemas-and-permissions`
- Schema rollout and drift issues → `migrations-and-versioning`
- Multi-surface worker topology, branch scope, and UI projection patterns → `worker-multi-surface-architecture`

## Default Execution Checklist

1. Classify runtime topology
2. Verify current schema + migration state
3. Validate resolve/subscription strategy
4. Confirm WASM import order and storage path
5. Verify branch scope and worker authority boundaries
6. Produce smallest safe patch with verification steps

$ARGUMENTS
