# Worker Multi-Surface Architecture

## Boundary

- The worker can be the canonical Jazz runtime for a multi-surface app.
- UI surfaces should act as projections over worker-owned state, not rival authorities.
- Keep worker credentials and mutation authority off client-visible surfaces.

## Startup Pattern

1. Classify topology and branch scope.
2. Start subscriptions before first snapshot where missed updates are unacceptable.
3. Load minimal account/root/profile state for first paint.
4. Deep-load only the visible branches required by the current surface.

## Mutation Pattern

- Run authoritative writes in the worker/runtime that owns the credentials.
- Pass narrow requests across the UI-to-worker boundary.
- Re-query canonical state after invalidation unless the worker response already contains authoritative data.

## Branching Pattern

- Branch only the CoValues you explicitly load in the branch scope.
- Values loaded later through separate `ensureLoaded()` or `subscribe()` calls need explicit branch handling.
- Merge close to the load site so merge coverage stays obvious.
