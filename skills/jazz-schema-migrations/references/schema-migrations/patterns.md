# Schema Patterns

## Pattern: Canonical Record + Ordered Index

- Use `co.record` for canonical keyed storage.
- Use `co.list` as ordered view/index.

## Pattern: Account Bootstrap Migration

- On missing root/profile, initialize deterministic defaults.
- Keep bootstrap lightweight and idempotent.

## Pattern: Versioned Union Compatibility

- Introduce `version` discriminator.
- Keep v1 and v2 schemas loadable concurrently.
- Use migration hook where write access exists; fallback read path where not.

## Pattern: Drift Visibility

- Expose runtime/schema version mismatch in logs/UI diagnostics.
