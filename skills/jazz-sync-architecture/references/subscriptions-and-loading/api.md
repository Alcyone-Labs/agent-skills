# API Reference

## Core Loading APIs

- `value.$isLoaded: boolean`
- `value.$jazz.loadingState`
  - includes at least `loading | loaded | unavailable | unauthorized`
- `value.$jazz.ensureLoaded({ resolve })`
  - returns a new resolved typed value

## Core Subscription APIs

- `value.$jazz.subscribe(listener)`
  - returns `unsubscribe()`
- `Schema.subscribe(id, { resolve }, callback)`
- `useAccount(AccountSchema, { resolve })`
- `useCoState(Schema, id, { resolve })`

## Resolve Query Primitives

- `true` for shallow reference/value loading
- nested object for deep path loading
- `$each` for collection fan-out
- optional error controls such as `$onError: 'catch'` in supported contexts

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - shared runtime API and loading model
