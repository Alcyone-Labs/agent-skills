# Implementation Patterns

## Pattern 1: Worker as canonical authority

- Centralize write authority in the worker runtime.
- Let browser/UI surfaces request reads and mutations through a narrow protocol.

## Pattern 2: Minimal snapshot, then progressive hydration

1. Subscribe or establish refresh path.
2. Load a small first-paint snapshot.
3. Hydrate deeper records/lists only when the surface needs them.

## Pattern 3: Branch-safe collaboration

- Load branches with explicit resolve depth.
- Keep branch merge close to the branch load site.
- Treat separately loaded nested values as outside merge scope unless explicitly branched.

## Pattern 4: Single-worker predictability

- Prefer one worker instance per server process where request ordering and migration timing matter.
- Add explicit health checks and timeouts around worker startup.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - single-worker recommendation
  - branch scope and merge behavior
  - `ensureLoaded()` and subscription guidance
