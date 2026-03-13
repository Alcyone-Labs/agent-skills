---
name: jazz-loading-subscriptions
description: Design and debug Jazz loading depth, loading states, and subscription lifecycles under eventual consistency
references:
  - loading-subscriptions
---

# Jazz Loading and Subscriptions

This skill is for correctness of **what is loaded, when it is loaded, and how updates stay observable**.

## Scope

- Resolve query design (`resolve`, `$each`, `$onError`)
- `$isLoaded` and `loadingState` handling
- `ensureLoaded()` semantics (returns a copy at requested depth)
- Manual and framework subscriptions
- Startup/reconnect race prevention
- Union narrowing constraints for `ensureLoaded` and `subscribe`

## Non-Negotiable Rules

- Treat shallow and deep loading as explicit architecture decisions.
- Use `$each` only when immediate full collection hydration is required.
- Handle loading states intentionally: `loading`, `loaded`, `unavailable`, `unauthorized`, and post-delete `deleted` flows.
- Always teardown manual subscriptions.
- If lossless startup matters, subscribe before snapshot query.
- For discriminated unions, narrow by discriminator before `ensureLoaded()` on union members.
- `ensureLoaded()` returns a new resolved copy; do not assume it mutates the original instance in place.

## Operating Procedure

1. Define first paint requirements.
2. Build minimal resolve for first paint.
3. Add incremental hydration for heavy branches.
4. Add subscription lifecycle (startup, reconnect, teardown).
5. Validate loading/error states and race windows.

## Common Failure Signatures

- "Sometimes data is null even though IDs exist" -> shallow/deep mismatch.
- "Initial update was missed after reconnect" -> query-before-subscribe race.
- "Startup is slow on large datasets" -> eager `$each` overreach.
- "Union access is blocked by types" -> missing discriminator narrowing before deep operations.
- "Deleted value still has an ID but will not load" -> expected tombstone/deleted loading-state behavior.
