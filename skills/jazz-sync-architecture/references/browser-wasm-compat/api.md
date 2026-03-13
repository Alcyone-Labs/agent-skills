# API Reference

## Mandatory Runtime Imports

```ts
import "jazz-tools/load-edge-wasm";
```

- Use in worker/edge entrypoints before any Jazz import.
- Prevents crypto backend mismatch in restricted runtimes.

## Worker Bootstrap APIs

```ts
import { startWorker } from "jazz-tools/worker";
import { getIndexedDBStorage } from "cojson-storage-indexeddb";

const storage = await getIndexedDBStorage("jazz-storage");
const { worker } = await startWorker({
  accountID,
  accountSecret,
  AccountSchema,
  storage,
  syncServer,
  asActiveAccount: true,
});
```

## Native Crypto API (Node-only)

```ts
import { NapiCrypto } from "jazz-tools/napi";

const crypto = await NapiCrypto.create();
```

- Higher performance option on supported Node platforms.
- Not supported in edge runtimes.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - server worker setup, `load-edge-wasm`, `asActiveAccount`, `NapiCrypto`
