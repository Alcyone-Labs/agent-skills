# Runtime Configuration

## Bootstrap Order

1. Runtime-specific WASM import guard.
2. Jazz runtime imports.
3. Worker/context initialization.

## Credential Configuration

- Provide worker credentials via secure env vars.
- Keep worker secret off client-exposed variables.

## Crypto Backend Policy

- Default: WASM for portability.
- Node runtime: enable Node-API selectively with platform checks.

## Deployment Policy

- Validate on real target runtime (edge/service worker/node), not only local browser dev.
