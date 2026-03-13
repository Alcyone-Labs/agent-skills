# API Reference

## Core Schema Constructors (`co`)

- `co.map({...})`
  - Struct-like collaborative object with fixed keys
- `co.list(Schema)`
  - Ordered collaborative list
- `co.record(z.string(), SchemaOrPrimitive)`
  - Dictionary-like collaborative map keyed by arbitrary strings
- `co.feed(Schema)`
  - Append-only feed, typically session/account scoped
- `co.plainText()` / `co.richText()`
  - Collaborative text CoValues
- `co.fileStream()` / `co.image()` / `co.vector(n)`
  - Binary/image/vector collaborative types
- `co.discriminatedUnion('tag', [SchemaA, SchemaB])`
  - Typed polymorphism for evolving schema families
- `co.account({ root, profile })` / `co.profile({...})` / `co.group()`
  - Identity + permission primitives

## Universal CoValue Runtime Surface

- `value.$isLoaded`
  - Fast guard for safe field access
- `value.$jazz.id`
  - Stable globally unique CoValue ID
- `value.$jazz.owner`
  - Ownership group boundary
- `value.$jazz.has(key)`
  - Key existence check for map/record variants
- `value.$jazz.refs`
  - Reference metadata for id-level navigation without full load

## Loading and Sync Runtime Surface

- `value.$jazz.loadingState`
  - Includes at least `loading | loaded | unavailable | unauthorized`
- `value.$jazz.ensureLoaded({ resolve })`
  - Returns a new typed instance resolved to requested depth
- `value.$jazz.subscribe(listener)`
  - Observe live updates on the value
- `value.$jazz.waitForSync()`
  - Await network persistence for critical flows/tests

## Framework and Vanilla Entry Points

- `useAccount(AccountSchema, { resolve })`
- `useCoState(Schema, id, { resolve })`
- `Schema.load(id, { resolve })`
- `Schema.subscribe(id, { resolve }, callback)`

## Evidence Anchors

- `https://jazz.tools/llms-full.txt`
  - CoValues API table and shared `$jazz` runtime methods
  - Loading/subscription API notes (`ensureLoaded`, `waitForSync`, `loadingState`)
