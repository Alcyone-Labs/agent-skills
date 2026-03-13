# Schema Configuration

## Baseline Version Policy

- Define `CURRENT_SCHEMA_VERSION` in schema module.
- Persist schema version field in account root or core entities.
- Validate runtime schema version at startup.

## Compatibility Policy

- New fields default to optional.
- No field removals in published schemas.
- Keep compatibility read paths for older versions.

## Permission Policy

- Assume some readers cannot run migrations.
- Keep app functional when migration writes are deferred.
