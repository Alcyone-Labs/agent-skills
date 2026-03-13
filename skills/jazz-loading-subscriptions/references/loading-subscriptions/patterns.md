# Loading Patterns

## Pattern: Subscribe then Snapshot

1. Register subscription channel.
2. Query minimal snapshot.
3. Render shell.
4. Incrementally hydrate deep branches.

Use when startup race windows are unacceptable.

## Pattern: Shallow Collection + On-Demand Entry Hydration

1. Load collection keys/index shallowly.
2. Hydrate selected entry via `ensureLoaded`.
3. Cache or memoize resolved copy for current view.

## Pattern: Progressive `$each`

Use `$each` only for currently visible slice or strict immediate needs; avoid full-tree expansion by default.
