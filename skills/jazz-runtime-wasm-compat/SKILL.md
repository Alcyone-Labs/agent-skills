---
name: jazz-runtime-wasm-compat
description: Build Jazz runtime bootstrap that is correct across browser, worker, edge, and Node crypto environments
references:
  - runtime-wasm-compat
---

# Jazz Runtime WASM Compatibility

Use this skill for runtime bootstrap correctness: import order, crypto backend, worker startup, and credentials boundaries.

## Runtime Matrix

- Browser main thread
- Service worker (MV3)
- Dedicated worker
- Edge runtime (Cloudflare/Vercel edge)
- Node/Deno server runtime
- Constrained native/WebView runtime

## Critical Invariants

- In edge/worker-sensitive contexts, import `jazz-tools/load-edge-wasm` before any Jazz import.
- `startWorker()` credentials must remain server/worker-only (`accountSecret` never exposed to client).
- `startWorker()` can run account migrations at worker start when `AccountSchema` is provided.
- Node-API (`NapiCrypto`) is optional optimization on supported Node runtimes, not a universal baseline.
- Prefer single-worker instance per server process for predictable behavior where required by workload invariants.
- Use `asActiveAccount: false` explicitly if you must avoid active-account side effects.

## When to Use WASM vs Node-API

- WASM: broad compatibility, required in edge runtimes.
- Node-API: higher performance on supported Node 20+ platforms, unavailable on edge.

## Fallback Strategy

If worker/WASM runtime is unstable in constrained environments, move Jazz transport to main thread and preserve protocol semantics.

## Verification Checklist

1. Confirm import graph order (`load-edge-wasm` first where needed).
2. Confirm runtime supports selected crypto backend.
3. Confirm worker credentials are environment-scoped and never shipped to client.
4. Confirm worker migration behavior if `AccountSchema` is supplied.
5. Confirm behavior in target deployment runtime, not only local dev.
