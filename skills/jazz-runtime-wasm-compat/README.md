# Jazz Runtime WASM Compatibility

This skill prevents runtime-only failures caused by incorrect bootstrap assumptions.

## Focus areas

- Runtime classification (browser/service worker/dedicated worker/edge/node/native)
- `load-edge-wasm` import-order invariants
- `startWorker` bootstrap and account-credential boundaries
- WASM vs Node-API crypto selection
- Environment fallback patterns and targeted verification

## Typical incidents

- Works locally, fails on edge deployment
- Worker starts in one runtime, crashes in another
- Crypto backend mismatch after platform move
- Secret leakage risk in worker credential wiring
