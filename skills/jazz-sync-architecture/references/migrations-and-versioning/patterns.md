# Implementation Patterns

## Pattern 1: Bootstrap + evolve in account migration

```ts
const Account = co
  .account({ root: AppRoot, profile: AppProfile })
  .withMigration(async (account) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", { schemaVersion: 1 });
    }

    const { root } = await account.$jazz.ensureLoaded({
      resolve: { root: true },
    });

    if (!root.$jazz.has("newField")) {
      root.$jazz.set("newField", defaultValue);
    }
  });
```

## Pattern 2: Dedicated repair path for heavy transformations

- Run deterministic repair/evolution functions after startup.
- Include cleanup of removed legacy structures.
- Rebuild derived indexes after transformation.

## Pattern 3: Version gate at runtime boundaries

- Read account/root version.
- Compare with current schema constant.
- Emit local diagnostics when drift is detected.
- Surface to UI and operational logs.

## Pattern 4: Forward-compatible unions for non-compatible changes

- Use discriminated unions when some clients cannot run write migrations.
- Keep app logic capable of handling both versions during transition window.

## Pattern 5: Safe migration completion markers

- Update version field only after required field writes succeed.
- Avoid partial-update false positives.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - account migration timing and deep migration with `ensureLoaded`
  - CoMap migration sync behavior
  - forward-compatible union guidance
