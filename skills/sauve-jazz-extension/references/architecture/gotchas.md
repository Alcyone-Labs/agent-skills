# Jazz Extension Gotchas

## Critical: Service Worker is Sole Jazz Client

❌ **WRONG: Creating Jazz context in popup**

```typescript
// popup/components/app.tsx
import { createJazzContext } from "jazz-react";

function App() {
  // ❌ BREAKS MV3 - popup doesn't persist
  const context = createJazzContext({
    accountID,
    accountSecret,
  });
}
```

✅ **CORRECT: Use proxy pattern**

```typescript
// popup/hooks/use-jazz-context.ts
export function useJazzContext() {
  // Returns cached proxy context
  return proxyContextManager.getCurrentValue();
}

// Service worker owns Jazz
// background/jazz-worker.ts
export async function initializeJazzWorker(accountID, accountSecret) {
  workerInstance = await startWorker({
    accountID,
    accountSecret,
    // ...
  });
}
```

## Critical: trackLocalMutation() Before Jazz Operations

❌ **WRONG: Missing trackLocalMutation()**

```typescript
// background/jazz-message-handler.ts
async function updateEntity(me, entityType, entityId, data, meta) {
  const entity = findEntity(root, entityId);

  // ❌ Jazz updates, but broadcast includes sender
  entity.$jazz.set("title", data.title);

  // Sender ignores its own broadcast (clientId match)
  // Result: Original popup never refreshes
}
```

✅ **CORRECT: Track BEFORE Jazz operation**

```typescript
async function updateEntity(me, entityType, entityId, data, meta) {
  // ✅ Track first - tells broadcast to exclude sender
  trackLocalMutation(entityType, "update", entityId, meta);

  const entity = findEntity(root, entityId);
  entity.$jazz.set("title", data.title);

  // Broadcast excludes sender, sender receives update
  // Result: All popups refresh including originator
}
```

## Critical: WASM Import for MV3

❌ **WRONG: Missing WASM import**

```typescript
// background/jazz-worker.ts
import { startWorker } from "jazz-tools/worker";
// ❌ Crypto fails in service worker without WASM
```

✅ **CORRECT: Load WASM first**

```typescript
// background/jazz-worker.ts
import "jazz-tools/load-edge-wasm"; // ✅ Required for MV3
import { startWorker } from "jazz-tools/worker";
```

## Critical: Import z from jazz-tools

❌ **WRONG: Using standalone zod**

```typescript
import { z } from "zod"; // ❌ Not all types available
```

✅ **CORRECT: Use jazz-tools export**

```typescript
import { co, z } from "jazz-tools"; // ✅ Correct types
```

## Gotcha: CoRecord vs CoList

❌ **WRONG: Using CoList for lookup**

```typescript
// ❌ O(n) scan to find by urlHash
export const ContentStore = co.list(PageContent);

// Finding item requires scan
const item = root.contentStore.find((c) => c.urlHash === hash);
```

✅ **CORRECT: Use CoRecord for O(1) lookup**

```typescript
// ✅ O(1) lookup by key
export const ContentStoreRecord = co.record(z.string(), PageContent);

// Direct access
const item = root.contentStore[urlHash];
```

## Gotcha: ensureLoaded() Required

❌ **WRONG: Accessing unloaded CoValues**

```typescript
const root = me.root;
// ❌ contentStore may not be loaded
for (const [hash, content] of Object.entries(root.contentStore)) {
  // content.$isLoaded may be false
}
```

✅ **CORRECT: Ensure loaded first**

```typescript
await root.$jazz.ensureLoaded({
  resolve: {
    contentStore: true, // Load all entries
    // Or specific entries:
    contentStore: { [urlHash]: true },
  },
});
```

## Gotcha: Schema Migrations

❌ **WRONG: Removing fields**

```typescript
// v13
export const PageContent = co.map({
  title: z.string(),
  content: z.string(),
  oldField: z.string(), // Want to remove in v14
});

// v14 - ❌ BREAKS existing data
export const PageContent = co.map({
  title: z.string(),
  content: z.string(),
  // oldField removed - crashes on load!
});
```

✅ **CORRECT: Keep optional, migrate data**

```typescript
// v14 - Keep field optional
export const PageContent = co.map({
  title: z.string(),
  content: z.string(),
  oldField: z.string().optional(),  // ✅ Keep but optional
  newField: z.string().optional(),  // ✅ Add new fields optional
});

// Migration moves data
.withMigration(async (account) => {
  const { root } = await account.$jazz.ensureLoaded({ resolve: { root: true } });

  for (const [hash, content] of Object.entries(root.contentStore || {})) {
    if (content.oldField && !content.newField) {
      content.$jazz.set('newField', transform(content.oldField));
    }
  }
});
```

## Gotcha: Port Disconnections

❌ **WRONG: Not handling disconnect**

```typescript
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    // Handle message
  });
  // ❌ Port disconnects, subscription leaks
});
```

✅ **CORRECT: Clean up on disconnect**

```typescript
chrome.runtime.onConnect.addListener((port) => {
  const subscriptionId = generateId();

  port.onMessage.addListener((msg) => {
    if (msg.type === "jazz:subscribe") {
      registerSubscription(subscriptionId, msg.path, port);
    }
  });

  // ✅ Clean up subscription
  port.onDisconnect.addListener(() => {
    unregisterSubscription(subscriptionId);
  });
});
```

## Gotcha: Mutation Debouncing

❌ **WRONG: Broadcasting every change**

```typescript
// Jazz subscription fires on every small change
content.$jazz.subscribe(() => {
  // ❌ Broadcasts 10 times for 10 field updates
  broadcastUpdate(["root", "contentStore"], data);
});
```

✅ **CORRECT: Debounce broadcasts**

```typescript
let debounceTimer: any = null;
let pendingBroadcasts: string[] = [];

function scheduleBroadcast(collection: string) {
  pendingBroadcasts.push(collection);

  if (debounceTimer) clearTimeout(debounceTimer);

  // ✅ Batch updates
  debounceTimer = setTimeout(() => {
    const unique = new Set(pendingBroadcasts);
    pendingBroadcasts = [];

    for (const col of unique) {
      broadcastUpdate(getPathForCollection(col), data);
    }
  }, 500);
}
```

## Gotcha: IndexedDB in Tests

❌ **WRONG: Not mocking IndexedDB**

```typescript
// test/setup.ts
// ❌ Tests share IndexedDB state
```

✅ **CORRECT: Use fake-indexeddb**

```typescript
// test/setup.ts
import "fake-indexeddb/auto";

// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});

// Clean between tests
afterEach(async () => {
  // Clear fake IndexedDB
  const dbs = await window.indexedDB.databases();
  for (const db of dbs) {
    if (db.name) {
      await new Promise((resolve, reject) => {
        const req = window.indexedDB.deleteDatabase(db.name!);
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    }
  }
});
```

## Gotcha: Service Worker Restart

❌ **WRONG: Assuming persistent state**

```typescript
// background/jazz-worker.ts
let cachedData: any = null;

export function getData() {
  // ❌ Lost on SW restart
  return cachedData;
}
```

✅ **CORRECT: Restore from Jazz on init**

```typescript
// background/jazz-worker.ts
export async function ensureJazzInitialized() {
  if (isJazzWorkerInitialized()) return;

  // ✅ Restore from storage
  const storage = new SecureStorage();
  const selectedAccountId = await storage.get("jazz_selected_account_id");
  const fullIdentities = await storage.get("jazz_full_identities");

  if (selectedAccountId && fullIdentities?.[selectedAccountId]) {
    const account = fullIdentities[selectedAccountId];
    await initializeJazzWorker(account.accountID, account.accountSecret);
  }
}
```

## Gotcha: Circular Dependencies

❌ **WRONG: Direct schema references**

```typescript
// schemas/author.ts
import { Post } from "./post"; // ❌ Circular

export const Author = co.map({
  name: z.string(),
  posts: co.list(Post), // Post imports Author?
});

// schemas/post.ts
import { Author } from "./author";

export const Post = co.map({
  title: z.string(),
  author: Author, // Circular!
});
```

✅ **CORRECT: Use getters for deferred evaluation**

```typescript
// schemas/author.ts
export const Author = co.map({
  name: z.string(),
  get posts() {
    return co.list(Post); // ✅ Evaluated when accessed
  },
});

// schemas/post.ts
export const Post = co.map({
  title: z.string(),
  author: Author, // ✅ Forward reference OK
});
```

## Gotcha: Chrome Storage Size Limits

❌ **WRONG: Storing large CoValues in chrome.storage**

```typescript
// ❌ chrome.storage has 5MB limit
await chrome.storage.local.set({
  contentStore: root.contentStore, // May exceed limit
});
```

✅ **CORRECT: Let Jazz handle persistence**

```typescript
// ✅ Jazz uses IndexedDB via cojson-storage-indexeddb
// No manual storage needed - Jazz persists automatically

// Only store small metadata in chrome.storage
await chrome.storage.local.set({
  jazz_selected_account_id: accountId,
  jazz_full_identities: {
    [accountId]: { accountID, accountSecret },
  },
});
```
