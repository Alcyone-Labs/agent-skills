# Runtime Gotchas

- Importing Jazz modules before `load-edge-wasm` in edge-sensitive paths.
- Assuming Node-API exists in edge runtimes.
- Sharing `JAZZ_WORKER_SECRET` with client bundles.
- Starting multiple competing worker instances when single-instance behavior is required.
- Validating only in local dev and missing deployment runtime constraints.
