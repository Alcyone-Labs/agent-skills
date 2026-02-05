# Jazz Extension Troubleshooting

## Common Issues

### Issue 1: UI Not Updating After Mutation

**Symptoms**:

- Mutation succeeds (service worker updates)
- Other popups see the update
- Original popup doesn't refresh

**Root Cause**: Missing `trackLocalMutation()` causes broadcast to include sender

**Fix**:

```typescript
// BEFORE (broken):
async function updateEntity(me, entityType, entityId, data, meta) {
  const entity = findEntity(root, entityId);
  entity.$jazz.set("title", data.title); // ❌ Missing trackLocalMutation
}

// AFTER (fixed):
async function updateEntity(me, entityType, entityId, data, meta) {
  trackLocalMutation(entityType, "update", entityId, meta); // ✅ Track first
  const entity = findEntity(root, entityId);
  entity.$jazz.set("title", data.title);
}
```

### Issue 2: Service Worker Not Initialized

**Symptoms**:

- "Jazz worker not initialized" error
- Queries return empty data

**Diagnosis**:

```typescript
// Check worker state
const state = getWorkerState();
console.log(state);
// { isInitialized: false, dataLoaded: false, accountID: null }
```

**Fix**:

```typescript
// Ensure initialization before operations
export async function ensureJazzInitialized(): Promise<void> {
  if (isJazzWorkerInitialized()) return;

  // Restore from storage
  const storage = new SecureStorage();
  const selectedAccountId = await storage.get("jazz_selected_account_id");
  const fullIdentities = await storage.get("jazz_full_identities");

  if (selectedAccountId && fullIdentities?.[selectedAccountId]) {
    const account = fullIdentities[selectedAccountId];
    await initializeJazzWorker(account.accountID, account.accountSecret);
  }
}
```

### Issue 3: Data Not Persisting

**Symptoms**:

- Data lost after browser restart
- Service worker restart clears data

**Root Cause**: Storing data in memory instead of Jazz

**Fix**:

```typescript
// ❌ WRONG: Memory only
let cachedData: any = null; // Lost on SW restart

// ✅ CORRECT: Use Jazz + IndexedDB
const content = PageContent.create({ ... }, account);
root.contentStore.$jazz.set(urlHash, content); // Persisted
```

### Issue 4: Slow Initial Load

**Symptoms**:

- Popup takes >5s to show content
- UI blocked during loading

**Fix**:

```typescript
// BEFORE: Blocking deep load
await deepLoadAllData(); // ❌ Blocks UI

// AFTER: Incremental loading
// 1. Load metadata (fast)
const rootResponse = await queryServiceWorker(["root"], ROOT_META_RESOLVE);
updateCachedContext(rootResponse.data);
notifySubscribers(); // UI renders immediately

// 2. Background: load collections
void loadCollections();

// 3. Background: load content in batches
void loadContentStoreBatched();
```

### Issue 5: Duplicate Updates

**Symptoms**:

- UI flickers
- Same update applied multiple times

**Root Cause**: Not excluding sender from broadcast

**Fix**:

```typescript
// Track mutation with clientId
trackLocalMutation(entityType, operation, entityId, {
  requestId,
  clientId: getExtensionClientId(), // ✅ Identify sender
});

// Broadcast excludes sender
const meta = getLatestMutationMetaForCollection(collection);
broadcastUpdate(path, data, {
  excludeClientId: meta?.clientId, // ✅ Exclude sender
});
```

## Debugging Techniques

### Enable Debug Logging

```typescript
// background/jazz-worker.ts
const DEBUG = import.meta.env.DEV;

function log(...args: any[]) {
  if (DEBUG) console.log("[Jazz Worker]", ...args);
}

// Usage
log("Initializing with account:", accountID);
```

### Trace Data Flow

```typescript
// Add request ID tracing
async function handleJazzQuery(request: JazzQueryRequest) {
  console.log(`[Query ${request.requestId}] Start:`, request.path);

  const startTime = performance.now();
  const result = await processQuery(request);

  console.log(`[Query ${request.requestId}] End:`, {
    duration: performance.now() - startTime,
    success: result.success,
  });

  return result;
}
```

### Inspect Jazz State

```typescript
// Chrome DevTools console
// Get Jazz context
const context = await chrome.runtime.sendMessage({
  type: "jazz:getStatus",
  requestId: "debug_1",
});

console.log("Jazz State:", context);

// Query specific data
const data = await chrome.runtime.sendMessage({
  type: "jazz:query",
  requestId: "debug_2",
  path: ["root", "contentStore"],
});

console.log("Content Store:", data);
```

### Check Subscriptions

```typescript
// background/jazz-subscription-manager.ts
export function debugSubscriptions(): void {
  console.log("[Subscriptions] Active:", activeSubscriptions.size);

  for (const [id, sub] of activeSubscriptions) {
    console.log(`  ${id}:`, {
      path: sub.path,
      clientId: sub.clientId,
      portConnected: !!sub.port,
    });
  }
}
```

## Data Integrity Repair

### Manual Repair

```typescript
// Trigger from popup
await chrome.runtime.sendMessage({
  type: "jazz:runRepair",
  requestId: ulid(),
});

// Or from DevTools
await chrome.runtime.sendMessage({
  type: "jazz:runRepair",
  requestId: "manual_1",
});
```

### Repair Report

```typescript
// Check repair results
const result = await chrome.runtime.sendMessage({
  type: "jazz:getMaintenanceStatus",
  requestId: ulid(),
});

console.log("Last repair:", new Date(result.lastRepairAt));
console.log("Last index rebuild:", new Date(result.lastIndexRebuildAt));
```

### Force Migration

```typescript
// If schema version mismatch
await chrome.runtime.sendMessage({
  type: "jazz:forceMigration",
  requestId: ulid(),
});
```

## Performance Debugging

### Measure Query Latency

```typescript
// popup/jazz/proxy/metrics.ts
export const metricsCollector = {
  queryLatencies: [] as number[],

  recordQueryLatency(latencyMs: number) {
    this.queryLatencies.push(latencyMs);

    if (this.queryLatencies.length > 100) {
      this.queryLatencies.shift();
    }

    // Log slow queries
    if (latencyMs > 1000) {
      console.warn(`[Metrics] Slow query: ${latencyMs.toFixed(0)}ms`);
    }
  },

  getStats() {
    const sorted = [...this.queryLatencies].sort((a, b) => a - b);
    return {
      count: sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },
};
```

### Profile Data Loading

```typescript
// background/jazz-worker.ts
async function deepLoadAllData(): Promise<void> {
  const startTime = performance.now();

  await me.root.$jazz.ensureLoaded({
    resolve: {
      /* ... */
    },
  });

  const elapsed = performance.now() - startTime;

  console.log(`[Jazz Worker] Data loaded in ${elapsed.toFixed(0)}ms`);

  if (elapsed > 5000) {
    console.warn("[Jazz Worker] Slow load detected!");

    // Log breakdown
    console.log(
      "  Collections:",
      Object.keys(me.root.collections || {}).length,
    );
    console.log(
      "  ContentStore:",
      Object.keys(me.root.contentStore || {}).length,
    );
  }
}
```

## Recovery Procedures

### Reset Jazz State

```typescript
// 1. Logout
await chrome.runtime.sendMessage({ type: "LOGOUT" });

// 2. Clear storage
await chrome.storage.local.clear();

// 3. Reload extension
chrome.runtime.reload();
```

### Rebuild Indexes

```typescript
await chrome.runtime.sendMessage({
  type: "jazz:rebuildIndex",
  requestId: ulid(),
});
```

### Clear IndexedDB

```typescript
// DevTools > Application > Storage > IndexedDB
// Delete 'jazz-storage' database

// Or programmatically
const dbs = await window.indexedDB.databases();
for (const db of dbs) {
  if (db.name?.includes("jazz")) {
    await new Promise((resolve, reject) => {
      const req = window.indexedDB.deleteDatabase(db.name!);
      req.onsuccess = resolve;
      req.onerror = reject;
    });
  }
}
```
