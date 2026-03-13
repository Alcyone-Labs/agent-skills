---
name: jazz-sync-architecture
description: Comprehensive Jazz architecture guide for distributed local-first systems across runtime topology, loading strategy, schema evolution, and worker boundaries
references:
  - distributed-sync
  - browser-wasm-compat
  - subscriptions-and-loading
  - schemas-and-permissions
  - migrations-and-versioning
  - worker-multi-surface-architecture
---

# Jazz Sync Architecture

This is the **all-in-one** operating manual for end-to-end Jazz design decisions.

Use it when problems span multiple domains or when you need architectural decisions that remain correct across runtime, schema, sync, branch, and worker boundaries.

## System Model

- Jazz state is distributed local-first state, not centralized server-row truth.
- CoValues are collaborative CRDT-backed values with eventual consistency.
- Account/root/profile define graph entry points and permission boundaries.
- Server workers are peers with their own accounts, not privileged bypass channels.

## Architecture Domains

1. Runtime and crypto bootstrap (`load-edge-wasm`, `startWorker`, Node-API/WASM)
2. Loading and subscription lifecycle (`resolve`, `$isLoaded`, `loadingState`, `ensureLoaded`, subscribe/unsubscribe)
3. Schema, ownership, and sharing boundaries (`co.map/list/record/feed`, account/group ownership)
4. Migration and version policy (account vs CoMap timing, additive evolution, mixed versions)
5. Worker communication topology (typed UI-to-worker request/response, HTTP, Inbox)
6. Multi-surface worker architecture (server worker, extension worker, UI projection boundaries, branch scope)

## Hard Truths You Must Design Around

- Mixed client versions are normal, not exceptional.
- Some readers may lack permission to execute migration writes.
- Many-to-many consistency is application-level; Jazz does not infer inverse links.
- Branching is scope-sensitive: merge only covers values loaded in the active branch subscription scope.
- Branching has caveats:
  - branch coverage depends on explicit resolve depth
  - values loaded separately (or via separate ensure/subscribe scopes) may fall outside merge scope
  - Account/Group branching is not fully isolated
- Text type choice is architectural:
  - `co.richText`/collaborative text for concurrent editing semantics
  - scalar text for replace-whole-field semantics

## Worker and Server Topology Rules

- Worker credentials are sensitive: account secret must never ship to client.
- Prefer single worker instance where strict request ordering/invariant checks matter.
- Worker account migrations run at worker start when a worker account schema is supplied.
- Choose communication mode deliberately:
  - typed request/response protocol for UI-to-worker operations
  - HTTP for simple auth/request flows
  - Inbox for offline-first message workflows with always-online worker assumptions

## Decision Process

1. Classify runtime topology.
2. Classify ownership and permission boundaries.
3. Define first-paint and incremental loading model.
4. Define migration/versioning contract before schema rollout.
5. Define worker communication mode, branch scope, and authority boundaries.
6. Add verification for reconnect, offline replay, mixed-version behavior, branch merge coverage, and runtime-specific bootstrap.
