# Runtime Patterns

## Pattern: Edge Worker Bootstrap

- Import `load-edge-wasm` first.
- Start worker with explicit credentials.
- Verify runtime capability before enabling optional acceleration.

## Pattern: Single Worker Authority

Run one worker instance per server process when request ordering/invariant checks depend on centralized sequencing.

## Pattern: Main-Thread Transport Fallback

When worker runtime is unreliable (some WebViews), run Jazz operations in main-thread transport while keeping the same query/mutate protocol boundary.
