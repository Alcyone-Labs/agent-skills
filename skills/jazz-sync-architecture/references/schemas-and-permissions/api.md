# API Reference

## Schema Constructors

- `co.map({...})`
- `co.list(Schema)`
- `co.record(z.string(), ValueSchema)`
- `co.feed(Schema)`
- `co.plainText()` / `co.richText()`
- `co.fileStream()` / `co.image()` / `co.vector(n)`
- `co.discriminatedUnion('kind', [A, B])`

## Identity and Permission Constructors

- `co.account({ root, profile })`
- `co.profile({...})`
- `Group.create()`

## Ownership and Permissions at Creation

```ts
const group = Group.create();
const task = Task.create({ title: "Plan release" }, { owner: group });
```

## Reference and Key Introspection

- `value.$jazz.refs`
- `value.$jazz.has(key)`

These are key tools for id-level navigation and migration checks without full tree hydration.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - schema type matrix and ownership examples
  - account/profile/group primitives
