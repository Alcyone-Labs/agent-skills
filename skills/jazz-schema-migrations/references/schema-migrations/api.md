# Schema and Migration API Reference

## Schema Constructors

- `co.map`, `co.list`, `co.record`, `co.feed`
- `co.account`, `co.profile`
- `co.discriminatedUnion`

## Migration Hooks

- `.withMigration(...)` on account schema
- `.withMigration(...)` on CoMap schema

## Migration Helpers

- `$jazz.has`
- `$jazz.set`
- `$jazz.ensureLoaded` (for nested checks in async account migrations)

## Versioning Aids

- schema version fields (`schemaVersion`, literal `version` fields)
- discriminated unions for side-by-side schema-version support
