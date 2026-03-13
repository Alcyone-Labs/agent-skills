---
name: sauve-jazz-extension
description: Implement Sauve-specific Jazz extension behavior on top of worker-authority architecture and typed popup-worker protocol
references:
  - architecture
  - data-flow
  - sync-patterns
  - testing
  - troubleshooting
  - schemas
  - message-protocol
  - labels-management
  - collections-system
---

# Sauve Jazz Extension

This skill is the **Sauve integration layer**.

It is not the canonical source for generic Jazz runtime/loading/schema theory.

## Route generic Jazz concerns to focused skills

- runtime/WASM/worker bootstrap → `jazz-runtime-wasm-compat`
- loading/deep resolve/subscriptions → `jazz-loading-subscriptions`
- schema evolution and migrations → `jazz-schema-migrations`
- multi-domain architecture → `jazz-sync-architecture`
- Sauve worker/proxy boundaries → `jazz-sauve-worker-proxy`

## This skill should focus on Sauve-specific concerns

- MV3 service-worker-first architecture in Sauve codebase
- popup proxy context and message protocol contracts
- labels and collections systems (`labels:/...`, RSS/source group patterns)
- Sauve mutation tracking + broadcast behavior
- Sauve test and troubleshooting workflows

## Core rules

- Service worker remains canonical Jazz runtime in extension mode.
- Popup/UI should operate as protocol-driven projection layer.
- Track mutation metadata before writes for deterministic refresh handling.
- Keep protocol payloads typed, versioned, and narrow.

## Practical boundary

If a question is true for all Jazz apps, answer from focused `jazz-*` skills.

If a question depends on Sauve architecture/files/protocol specifics, answer here.
