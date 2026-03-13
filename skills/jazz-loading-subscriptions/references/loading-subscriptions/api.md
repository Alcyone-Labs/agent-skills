# Loading API Reference

## Core Signals

- `$isLoaded`
- `$jazz.loadingState`

## Deep Loading

- `$jazz.ensureLoaded({ resolve })`
  - waits for requested nested references
  - returns a new typed value copy at requested depth
  - on discriminated unions, narrow first before member-specific deep operations

## Subscriptions

- `$jazz.subscribe(listener)` for instance-level manual subscriptions
- `Schema.subscribe(id, query, callback)` for schema-level subscriptions
- `useAccount(AccountSchema, { resolve })`
- `useCoState(Schema, id, { resolve })`

## Resolve Controls

- `resolve` nested object
- `$each` for list/record expansion
- `$onError` where partial-load resilience is required
