# Runtime Compatibility Overview

Runtime errors are often topology errors, not business-logic errors.

## Environment Matrix

- Browser main thread: standard provider/context path.
- Service worker/dedicated worker: worker bootstrap + storage + message boundary.
- Edge runtimes: strict import-order and WASM constraints.
- Node runtime: optional Node-API acceleration where supported.
- Constrained WebViews: may require main-thread transport fallback.

## Verified Upstream Facts

- `startWorker()` can take a custom `AccountSchema`, sync server URL, `accountID`, and `accountSecret`.
- Worker account migrations run on every worker start when an account schema is configured.
- `asActiveAccount: false` is available when the worker must not become the current account.
- `NapiCrypto` is only available on supported Node 20+ platforms; edge runtimes must stay on WASM.

## Import-Order Invariant

In edge-sensitive paths, `jazz-tools/load-edge-wasm` must load before any Jazz module import.

## Security Baseline

- `accountSecret` is secret material.
- Keep worker credentials in secure server/worker environment variables.
- Never expose worker secret to client bundles.
