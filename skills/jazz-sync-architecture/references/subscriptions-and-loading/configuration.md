# Configuration

## Resolve Policy by Phase

### Phase 1: Fast metadata load

```ts
const ROOT_META_RESOLVE = {
  root: true,
  profile: true,
};
```

### Phase 2: Incremental collection hydration

```ts
const LIST_RESOLVE = {
  root: {
    myFestival: { $each: true },
  },
};
```

### Phase 3: On-demand entry deep load

```ts
const DEEP_ENTRY_RESOLVE = {
  participants: {
    $each: {
      profile: true,
    },
  },
};
```

## Subscription Path Strategy

- Keep first-paint resolve shallow.
- Add deeper `ensureLoaded({ resolve })` only for the branch currently being read.
- Use `$each` only where immediate fully loaded iteration is required.

## Reconnect Strategy

- Re-establish manual subscriptions before refresh queries when lossless startup matters.
- Re-check loading state after reconnect.
- Re-run targeted deep loads only for visible branches.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - `useAccount` resolve examples
  - `$each` loading examples
  - `ensureLoaded()` semantics
