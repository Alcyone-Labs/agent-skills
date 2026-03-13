# Gotchas

- **Assuming references are fully loaded by default**
  - CoValues can be present but unresolved at nested levels.
  - Guard with `$isLoaded` or use resolved copies from `ensureLoaded()`.

- **Overusing `$each`**
  - Deep fan-out on large records/lists can blow startup budget.
  - Prefer staged loading for large datasets.

- **Ignoring loading states beyond `loaded`**
  - Handle `unavailable` and `unauthorized` explicitly in UX.
  - Include deleted-state handling in error boundaries where relevant.

- **Subscribing too late**
  - Query-first startup can miss updates that occur during bootstrap window.

- **Forgetting cleanup**
  - Missing unsubscribe calls lead to stale listeners and noisy updates.

- **Treating refresh payloads as authoritative data**
  - If you build your own worker projection layer, treat worker refresh signals as invalidation hints unless they carry full canonical data.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - loading states + `ensureLoaded` semantics
  - resolve query + `$each` guidance
  - deleted-state behavior after hard delete
