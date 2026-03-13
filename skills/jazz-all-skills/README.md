# Jazz All Skills Router

`jazz-all-skills` is the **routing layer** for Jazz work.

Use it when request scope is unclear, then route to a focused skill fast.

## Routing Table

- `jazz-runtime-wasm-compat`
  - Runtime matrix, `load-edge-wasm` order, `startWorker`, WASM/Node-API decisions
- `jazz-loading-subscriptions`
  - Resolve strategy, `$isLoaded`, `loadingState`, `ensureLoaded`, `deleted` state, subscribe/unsubscribe discipline
- `jazz-schema-migrations`
  - Schema design, ownership boundaries, group-first ownership policy, account vs CoMap migrations, mixed-version compatibility
- `jazz-sync-architecture`
  - Cross-domain architecture decisions, multi-surface worker topology, branching, and all-in-one operating model

## Triage Workflow

1. Identify topology (browser/worker/edge/extension/native).
2. Identify dominant failure domain.
3. Route to narrowest focused skill.
4. Escalate to `jazz-sync-architecture` for multi-domain coupling.

## Anti-Pattern

Do not keep execution in router mode for implementation.

Router mode is for classification and handoff.
