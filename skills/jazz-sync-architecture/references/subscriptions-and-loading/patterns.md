# Implementation Patterns

## Pattern 1: Subscribe first, query second

Prevent missing updates during startup races.

```ts
const unsubscribe = value.$jazz.subscribe((updated) => {
  render(updated);
});

const resolved = await value.$jazz.ensureLoaded({ resolve: { profile: true } });
render(resolved);
```

## Pattern 2: Progressive hydration pipeline

1. Load root metadata.
2. Render usable shell.
3. Load collections.
4. Load nested entries in bounded batches.

This keeps first paint cheap while preserving eventual deep correctness.

## Pattern 3: Shallow record load + entry-level deep resolve

Avoid global `$each` fan-out for large records.

```ts
await root.$jazz.ensureLoaded({ resolve: { contentStore: true } });

const entry = root.contentStore[urlHash];
const loadedEntry = await entry.$jazz.ensureLoaded({
  resolve: { markdown: true, summary: true },
});
```

## Pattern 4: Debounced UI fan-out

If multiple visible branches re-render from one mutation, debounce UI refresh work outside the core Jazz subscription callback.

## Pattern 5: Branch-safe deep loading

- Branch nested CoValues with explicit resolve depth.
- If you separately `ensureLoaded()` or `subscribe()` within branch flows, specify the intended branch.
- Merge close to the load site so merge scope stays obvious.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - `$each`, resolve, `ensureLoaded` model
  - branch load and merge scope caveats
