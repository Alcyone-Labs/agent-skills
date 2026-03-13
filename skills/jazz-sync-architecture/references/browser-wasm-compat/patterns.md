# Implementation Patterns

## Pattern 1: Service-worker-first Jazz runtime

Use this for extension architectures where the worker is the canonical sync/storage authority.

```ts
import "jazz-tools/load-edge-wasm";
import { startWorker } from "jazz-tools/worker";

const { worker } = await startWorker({
  AccountSchema,
  syncServer,
  accountID,
  accountSecret,
});
```

## Pattern 2: Main-thread fallback for WebView worker incompatibility

Use this when dedicated worker WASM support is unstable (for example on specific WebView targets).

```ts
export class MainThreadTransport {
  async initialize() {
    // move transport to the main thread when worker runtime is not viable
  }
}
```

## Pattern 3: Two-step startup with timeout + diagnostics

1. Initialize transport/worker with timeout.
2. Poll status for data readiness.
3. Surface explicit runtime failure messages.

## Pattern 4: Edge runtime bootstrap

- Import loader first.
- Avoid Node-API assumptions.
- Validate environment supports WebAssembly before rollout.

## Pattern 5: CI-safe WASM strategy

- Mock loader module in tests.
- Use `fake-indexeddb` where Node lacks IndexedDB.
- Keep runtime tests for true worker bootstrap in dedicated integration suites.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - server worker startup and single-worker recommendation
  - edge runtime loader requirement
