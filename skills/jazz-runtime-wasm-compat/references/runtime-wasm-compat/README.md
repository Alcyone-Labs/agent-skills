# Runtime Compatibility Overview

Runtime errors are often topology errors, not business-logic errors.

## Environment Matrix

- Browser main thread: standard provider/context path.
- Service worker/dedicated worker: worker bootstrap + storage + message boundary.
- Edge runtimes: strict import-order and WASM constraints.
- Node runtime: optional Node-API acceleration where supported.
- Constrained WebViews: may require main-thread transport fallback.

## Import-Order Invariant

In edge-sensitive paths, `jazz-tools/load-edge-wasm` must load before any Jazz module import.

## Security Baseline

- `accountSecret` is secret material.
- Keep worker credentials in secure server/worker environment variables.
- Never expose worker secret to client bundles.
