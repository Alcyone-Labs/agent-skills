# Loading and Subscription Operating Model

Jazz references can exist before nested values are loaded. Correctness comes from explicit depth control.

## Resolve Design Rules

- First paint: load metadata and IDs only.
- Heavy branches: hydrate incrementally after shell render.
- `$each`: use only when immediate iteration over loaded entries is required.
- Prefer targeted entry hydration (`entry.$jazz.ensureLoaded`) over collection-wide deep load.

## Loading-State Rules

- `$isLoaded` gates safe reads.
- `loadingState` must drive fallback behavior (`loading`, `loaded`, `unavailable`, `unauthorized`).
- After hard delete flows, expect `loadingState: "deleted"` from load attempts where applicable.

## Subscription Rules

- Startup race-sensitive flows: subscribe before snapshot.
- Always keep and call unsubscribe handlers.
- Keep subscription scope narrow to reduce churn.
