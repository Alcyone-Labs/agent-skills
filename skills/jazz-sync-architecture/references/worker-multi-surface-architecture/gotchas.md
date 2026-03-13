# Gotchas

- **Shipping worker credentials to the client**
  - `accountSecret` is secret material and must remain server/worker-side.

- **Querying before subscription in race-sensitive flows**
  - First render can miss updates that happen during bootstrap.

- **Assuming branch merge covers separately loaded values**
  - Values loaded via separate `ensureLoaded()` or `subscribe()` scopes may fall outside merge scope.

- **Branching Account or Group as if they were fully isolated**
  - Group membership writes and account root/profile replacement can affect main state.

- **Running multiple worker instances without clear ordering assumptions**
  - Concurrent authorities make request sequencing and invariant debugging harder.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - worker credential guidance
  - branch scope and account/group caveats
  - single-worker recommendation
