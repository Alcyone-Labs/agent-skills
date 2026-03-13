# Migrations and Versioning

## Timing Model

- Account migrations: account creation + login (and worker starts when applicable)
- CoMap migrations: when CoMap is loaded

## Evolution Policy

- Add fields, do not remove/rename published fields
- Make new fields optional by default
- Use explicit version fields
- For incompatible transitions, support multiple versions with discriminated unions

## Permission Reality

Some clients cannot perform migration writes due to permissions.

Design forward-compatible readers and version-aware behavior so partial migration rollout does not break app flows.

## Nested Migration Reality

- Deep account migration checks may require `account.$jazz.ensureLoaded({ resolve })` before calling `has()` on nested structures.
- CoMap migrations must stay synchronous.
