# Subscriptions and Deep Loading

## Loading Model

- `resolve` controls depth.
- `$isLoaded` gates safe access.
- `loadingState` must be handled explicitly (`loading`, `loaded`, `unavailable`, `unauthorized`, and deleted-state flows where applicable).
- `ensureLoaded` returns a resolved copy at requested depth.

## Strategy

- First paint: shallow/minimal resolve.
- Incremental hydration: targeted deep loads.
- `$each`: only when immediate loaded iteration is necessary.

## Lifecycle Rules

- Subscribe before snapshot where missed updates are unacceptable.
- Always cleanup manual subscriptions.
- Narrow discriminated unions before member-specific deep operations.
- Re-check loading state after reconnect and deletion flows.
