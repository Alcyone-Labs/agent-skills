# Configuration

## Import Ordering Contract

Always place WASM loader import at the top of worker/edge entry files:

```ts
import "jazz-tools/load-edge-wasm";
import { startWorker } from "jazz-tools/worker";
// ...other Jazz imports
```

## Storage Selection

- Preferred persistent browser storage: IndexedDB
- Browser/worker pattern:

```ts
const storage = await getIndexedDBStorage("jazz-storage");
```

## Startup Guardrails

- Add explicit init timeout around worker startup for clearer diagnostics.
- Detect worker capability failures and surface actionable errors to UI.

## Test Configuration

In test runners, alias out loader side effects where necessary:

```ts
// vitest alias example
'jazz-tools/load-edge-wasm': resolve(
  import.meta.dirname,
  './tests/mocks/jazz-tools-load-edge-wasm.ts'
)
```

Also provide IndexedDB polyfill/mocks in Node test environments.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - edge WASM import order
  - server worker credential and startup configuration
