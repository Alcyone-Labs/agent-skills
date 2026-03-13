# API Reference

## Account Migration API

```ts
const Account = co
  .account({ root: AppRoot, profile: AppProfile })
  .withMigration(async (account, creationProps) => {
    // initialize/evolve root/profile
  });
```

## CoMap Migration API

```ts
const Task = co
  .map({ version: z.literal([1, 2]), done: z.boolean() })
  .withMigration((task) => {
    // synchronous migration logic
  });
```

## Loading Helpers Used by Migrations

- `account.$jazz.has('root')`
- `account.$jazz.ensureLoaded({ resolve: { root: true } })`
- `root.$jazz.has('field')`
- `root.$jazz.set('field', value)`

## Version Control Fields

- `schemaVersion: z.number()`
- comparison against `CURRENT_SCHEMA_VERSION`
- local diagnostics when runtime and stored versions drift

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - migration APIs and behavior notes
