# Jazz Sync Architecture

`jazz-sync-architecture` is the full-spectrum skill for Jazz systems.

Use it for cross-domain decisions involving runtime topology, loading behavior, schema design, migrations, server-worker boundaries, and branching behavior.

## Reference Map

1. `references/distributed-sync/`
   - Local-first model, eventual consistency, CoValue graph design
2. `references/browser-wasm-compat/`
   - Runtime matrix, `load-edge-wasm`, `startWorker`, Node-API/WASM tradeoffs
3. `references/subscriptions-and-loading/`
   - Resolve policy, loading states, `ensureLoaded`, subscription lifecycle
4. `references/schemas-and-permissions/`
   - Constructor choices, ownership boundaries, sharing model
5. `references/migrations-and-versioning/`
   - Account vs CoMap migration timing, additive rollout policy, mixed-version handling
6. `references/worker-multi-surface-architecture/`
   - Worker-authority design, projection boundaries, startup ordering, branch-safe multi-surface patterns

## When to use focused skills instead

- runtime-only incidents → `jazz-runtime-wasm-compat`
- loading/subscription incidents → `jazz-loading-subscriptions`
- schema/migration incidents → `jazz-schema-migrations`
- unknown domain triage → `jazz-all-skills`
