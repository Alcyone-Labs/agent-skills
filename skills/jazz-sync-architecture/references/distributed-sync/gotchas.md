# Gotchas

- **Eventual consistency means delayed global truth**
  - Concurrent clients can temporarily observe different intermediate states
  - Do not encode critical invariants as assumptions about immediate global order

- **Many-to-many consistency is your app's responsibility**
  - Jazz won’t automatically keep both ends of many-to-many lists in sync
  - Update both sides (or centralize via canonical record pattern)

- **`$isLoaded` is not optional**
  - Unresolved references may look object-like but are not safely readable
  - Guard before deep property reads or use `ensureLoaded()` output

- **`CoPlainText` / `CoRichText` are not native `string` values**
  - Convert with `.toString()` when calling non-Jazz APIs expecting plain strings

- **Credential storage and XSS posture are linked**
  - Passkey/passphrase serverless auth stores credentials in browser local storage
  - Harden CSP + sanitize user input rigorously

- **Node baseline matters**
  - Jazz docs state Node.js v20+ as baseline for supported setups

## Evidence Anchors

- `https://jazz.tools/llms-full.txt`
  - CoValues eventual consistency/CRDT framing
  - many-to-many consistency warning
  - `$isLoaded` and loading model
  - local storage auth credential security note
  - Node.js v20 requirement
