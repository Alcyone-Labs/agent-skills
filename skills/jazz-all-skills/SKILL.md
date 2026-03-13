---
name: jazz-all-skills
description: Route Jazz requests to the right focused skill using topology-first triage and failure-domain mapping across runtime, loading, schema, and multi-surface worker architecture
references:
  - all-skills
---

# Jazz All Skills Router

Use this as the **entry router** when a Jazz request arrives but the primary failure domain is unclear.

## Mission

1. Classify runtime and topology first.
2. Classify failure domain second.
3. Route to the narrowest focused skill that can solve the task.
4. Keep `jazz-sync-architecture` as the cross-domain escalation path.

## Topology-First Triage

Always identify execution topology before touching schema or loading strategy:

- Browser app only
- Extension MV3 (popup + service worker)
- Dedicated worker runtime
- Edge/server worker runtime
- Hybrid/native WebView with possible worker limits

Topology misclassification is the fastest way to ship the wrong fix.

## Failure-Domain Routing Matrix

- Runtime/WASM bootstrap, import-order, crypto backend, worker startup:
  - `jazz-runtime-wasm-compat`
- Resolve depth, `$isLoaded`, `loadingState`, `ensureLoaded`, subscription race/teardown:
  - `jazz-loading-subscriptions`
- Schema constructor choice, ownership boundaries, group/account policy, account/CoMap migration policy, mixed-version safety:
  - `jazz-schema-migrations`
- Multi-surface worker architecture, server worker authority boundaries, branch/merge caveats, or coupled incidents spanning runtime + schema + loading:
  - `jazz-sync-architecture`

## Stay in Router vs Escalate

Stay in `jazz-all-skills` only to triage and hand off.

Escalate to focused skill as soon as you can state:

- topology
- dominant failure domain
- first invariant that appears broken

Escalate to `jazz-sync-architecture` when:

- more than one domain is first-order critical
- ownership, migration, and runtime constraints are entangled
- worker/UI topology or branch scope is part of the incident
- you need end-to-end operating model decisions, not just a local fix

## Ambiguous Request Examples

- "My worker-backed UI is stale after reconnect": could be subscription race (`jazz-loading-subscriptions`) or a broader worker/query/branch topology problem (`jazz-sync-architecture`).
- "Edge deploy fails but local works": likely runtime bootstrap (`jazz-runtime-wasm-compat`) before schema investigation.
- "Old clients crash after new field rollout": schema evolution and migration compatibility (`jazz-schema-migrations`).
- "Everything broke after worker refactor": start in `jazz-sync-architecture` and split into domain streams.
