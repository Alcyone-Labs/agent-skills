# Schemas and Permissions

## Constructor Selection

- `co.map` for fixed entity shape
- `co.record` for keyed lookup index
- `co.list` for ordered projections
- `co.feed` for append-only event/session streams

## Ownership Boundaries

- Group-owned values are the preferred default, even for single-user values.
- Account-owned values are rigid private state and are being phased out for new creation flows.
- Use `root` for private per-account graph entry and `profile` for public-ish identity graph.

## Text-Type Decision

- Collaborative text types when concurrent editing semantics matter
- Scalar text when replace-whole-value behavior is intended

## Permission Design Rule

Model sharing boundaries at schema/creation time; avoid patchwork permission retrofits.
