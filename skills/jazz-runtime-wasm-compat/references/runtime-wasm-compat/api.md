# Runtime API Reference

## Import Guard

```ts
import "jazz-tools/load-edge-wasm";
```

Use in edge-sensitive entry points before other Jazz imports.

## Worker Bootstrap

```ts
import { startWorker } from "jazz-tools/worker";
```

Key options: `syncServer`, `accountID`, `accountSecret`, `AccountSchema`, `asActiveAccount`.

## Async WASM Initialization

```ts
import { initWasm } from "jazz-tools/wasm";
await initWasm();
```

Useful when avoiding sync startup stalls.

## Node-API Crypto

```ts
import { NapiCrypto } from "jazz-tools/napi";
```

Use only on supported Node runtimes; do not assume edge support.
