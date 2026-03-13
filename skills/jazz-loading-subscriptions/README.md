# Jazz Loading and Subscriptions

Use this skill when Jazz correctness depends on load depth and update lifecycle.

## What it solves

- First-paint vs incremental hydration strategy
- Correct `$isLoaded`/`loadingState` branching
- `ensureLoaded()` depth and copy semantics
- Subscription ordering and unsubscribe discipline
- Resolve cost control (`$each` where justified, not by default)

## Key guidance

- Start shallow; deepen only what the current view requires.
- Use explicit loading-state UI for `unauthorized`, `unavailable`, and `deleted` outcomes.
- Treat manual subscriptions as resources that must be cleaned up.
- In critical startup paths, subscribe first, then query.
