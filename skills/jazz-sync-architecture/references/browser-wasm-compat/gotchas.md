# Gotchas

- **Import order violations**
  - If `jazz-tools/load-edge-wasm` is imported after other Jazz modules, crypto init can fail in worker/edge environments.

- **Wrong crypto backend assumptions**
  - Node-API crypto is not available in edge runtimes.
  - Do runtime-specific selection; do not hardcode one backend globally.

- **Heavy bootstrap work on UI-critical path**
  - Can block the main thread and degrade startup UX.
  - Keep bootstrap work off UI-critical path where possible.

- **Worker capability mismatch in WebView environments**
  - Some environments support WASM on main thread but not inside workers.
  - Provide transport fallback path rather than hard-failing startup.

- **Test flakiness from unmanaged WASM side effects**
  - Without aliasing/mocking loader imports and IndexedDB support, unit tests can fail before app logic executes.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - edge WASM restrictions
  - import-order requirement for `load-edge-wasm`
  - Node-API limits
