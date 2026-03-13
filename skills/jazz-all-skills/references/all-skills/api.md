# Router Contract

## Entry Skill

- `jazz-all-skills`

## Focused Skills

- `jazz-runtime-wasm-compat`
- `jazz-loading-subscriptions`
- `jazz-schema-migrations`
- `jazz-sync-architecture`

## Contract Rules

- Route to the narrowest skill that covers the dominant failure domain.
- If two or more domains are equally plausible, route to `jazz-sync-architecture`.
- Never keep implementation in router-only mode once domain is identified.
