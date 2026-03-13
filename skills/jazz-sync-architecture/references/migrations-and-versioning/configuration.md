# Configuration

## Version Field Placement

Put version metadata in account root where all runtime layers can inspect it:

```ts
export const AppRoot = co.map({
  // ...other fields
  schemaVersion: z.number(),
});

export const CURRENT_SCHEMA_VERSION = 18;
```

## Migration Trigger Points

- Account bootstrap/evolution: account `.withMigration(...)`
- Structural historical cleanup: follow-up repair job or explicit runtime workflow
- Runtime verification: startup integrity checks

## Compatibility Settings

- New fields default optional unless guaranteed migration reach
- Keep compatibility branches for old versions until migration confidence is high
- Avoid hard deletes of legacy fields until repair path exists

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - account migration timing
  - deep migration with `ensureLoaded`
