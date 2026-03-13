---
name: jazz-schema-migrations
description: Design Jazz schemas and migrations for additive forward-compatible evolution across mixed client versions
references:
  - schema-migrations
---

# Jazz Schema and Migrations

Use this skill when changing Jazz data model, ownership boundaries, or migration policy.

## Scope

- Constructor selection: `co.map`, `co.list`, `co.record`, `co.feed`, account/profile/root
- Ownership boundaries (account vs group)
- Account migration timing vs CoMap migration timing
- Additive schema evolution and optional-field strategy
- Version fields and discriminated unions for mixed client readers
- Permission-aware migration design and drift handling

## Migration Timing Truths

- Account migrations run after account creation and at login (and at worker start when worker account schema is used).
- CoMap migrations run when that CoMap is loaded.
- CoMap migrations are synchronous; design them to exit fast.

## Evolution Rules

- Add fields; do not remove or rename published fields.
- Keep new fields optional unless you can guarantee universal migration write capability.
- Use explicit version fields.
- For non-compatible transitions, keep a discriminated union to support multiple versions concurrently.

## Permission and Drift Rules

- Migration writes require write permissions.
- Reader-only clients may not execute migrations.
- Prefer group ownership for new CoValues; account ownership is rigid and legacy-only for most new designs.
- Build forward-compatible read paths and version-aware behavior.
- Surface schema/version drift in diagnostics to avoid silent state skew.

## Deep Migration Guidance

When migration logic depends on nested references, use `ensureLoaded({ resolve: ... })` before checking nested keys to avoid false missing assumptions from shallow state.
