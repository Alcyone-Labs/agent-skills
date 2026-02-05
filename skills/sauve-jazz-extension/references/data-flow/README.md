# Jazz Data Flow

## Overview

Data flows through the Jazz extension in three main patterns:

1. **Query Flow**: Popup requests data from service worker
2. **Mutation Flow**: Popup sends changes to service worker
3. **Subscription Flow**: Service worker pushes updates to popup

## Proxy Mode Decision Flow

```
Popup/UI
  │
  │  1. isProxyMode() ?
  ├── Yes → Use chrome.runtime message protocol
  │          - sendRuntimeMessage jazz:query/jazz:mutate
  │          - subscribe via jazz-subscription port
  └── No  → Direct Jazz access (service worker only)
             - getJazzContext()
             - CoValue ops ($jazz.set/push/splice)
```

## Query Flow

```
Popup                              Service Worker                    Jazz
  │                                    │                              │
  │  1. sendRuntimeMessage({           │                              │
  │       type: 'jazz:query',          │                              │
  │       path: ['root', 'contentStore']                              │
  │     })                             │                              │
  │ ──────────────────────────────────►│                              │
  │                                    │                              │
  │                                    │  2. handleJazzQuery()        │
  │                                    │                              │
  │                                    │  3. getJazzContext()         │
  │                                    │     → me.root                │
  │                                    │                              │
  │                                    │  4. navigatePath()           │
  │                                    │     → root.contentStore      │
  │                                    │                              │
  │                                    │  5. ensureLoaded()           │
  │                                    │─────────────────────────────►│
  │                                    │                              │
  │                                    │◄─────────────────────────────│
  │                                    │     Data loaded from IDB     │
  │                                    │                              │
  │                                    │  6. serializeCoValue()       │
  │                                    │     → Strip $jazz internals  │
  │                                    │                              │
  │  7. { type: 'jazz:queryResponse', │                              │
  │       data: {...} }                │                              │
  │◄───────────────────────────────────│                              │
  │                                    │                              │
  │  8. Update cachedContext           │                              │
  │  9. notifySubscribers()            │                              │
  │  10. UI re-renders                 │                              │
```

### Query Flow Code

```typescript
// POPUP: Request data
const response = await sendRuntimeMessage({
  type: "jazz:query",
  requestId: ulid(),
  path: ["root", "contentStore", urlHash],
  resolve: {
    urlHash: true,
    title: true,
    markdown: true,
    collectionNames: true,
  },
});

// SERVICE WORKER: Handle query
export async function handleJazzQuery(request: JazzQueryRequest) {
  const context = getJazzContext();
  const root = context.me.root;

  // Navigate to requested path
  const data = await navigatePath(root, request.path, request.resolve);

  // Serialize for transport
  return {
    type: "jazz:queryResponse",
    requestId: request.requestId,
    success: true,
    data: serializeCoValue(data),
  };
}

// POPUP: Handle response
if (response.success) {
  cachedContext.me.root.contentStore[urlHash] = response.data;
  notifySubscribers();
}
```

## Mutation Flow

```
Popup                              Service Worker                    Jazz
  │                                    │                              │
  │  1. Optimistic update              │                              │
  │     → Update cachedContext         │                              │
  │     → UI updates immediately       │                              │
  │                                    │                              │
  │  2. sendRuntimeMessage({           │                              │
  │       type: 'jazz:mutate',         │                              │
  │       operation: 'update',         │                              │
  │       entityType: 'contentStore',  │                              │
  │       entityId: urlHash,           │                              │
  │       data: { title: 'New' }       │                              │
  │     })                             │                              │
  │ ──────────────────────────────────►│                              │
  │                                    │                              │
  │                                    │  3. handleJazzMutate()       │
  │                                    │                              │
  │                                    │  4. trackLocalMutation()     │
  │                                    │     → Records requestId      │
  │                                    │     → For broadcast exclude  │
  │                                    │                              │
  │                                    │  5. updateEntity()           │
  │                                    │                              │
  │                                    │  6. entity.$jazz.set()       │
  │                                    │─────────────────────────────►│
  │                                    │                              │
  │                                    │◄─────────────────────────────│
  │                                    │     Jazz persists to IDB     │
  │                                    │     Syncs to cloud           │
  │                                    │                              │
  │                                    │  7. Jazz subscription fires  │
  │                                    │◄─────────────────────────────│
  │                                    │                              │
  │                                    │  8. scheduleBroadcast()      │
  │                                    │     → Debounced 500ms        │
  │                                    │                              │
  │  9. { type: 'jazz:mutateResponse', │                              │
  │       success: true }              │                              │
  │◄───────────────────────────────────│                              │
  │                                    │                              │
  │  10. Confirm optimistic update     │                              │
  │      OR rollback on failure        │                              │
  │                                    │                              │
  │  11. Port message:                 │                              │
  │      'jazz:dataUpdated'            │                              │
  │◄───────────────────────────────────│                              │
  │      (other popups get this too)   │                              │
```

## Label Assignment Flow (Hierarchical Labels)

```
Popup/UI                              Service Worker
  │                                        │
  │  1. User enters label path             │
  │     (e.g. ai/context-engineering)     │
  │                                        │
  │  2. normalizeLabelCollectionName()     │
  │     → labels:/ai/context-engineering   │
  │                                        │
  │  3. updateBookmarkCollections()        │
  │     → reading-list-client              │
  │  4. sendRuntimeMessage({               │
  │       type: 'jazz:readingList:updateCollections',
  │       urlHash,
  │       collections: [...]               │
  │     })                                 │
  │ ─────────────────────────────────────► │
  │                                        │
  │                                        │ 5. handleReadingListMutation()
  │                                        │ 6. updateReadingListItemCollections()
  │                                        │ 7. addCollectionToContent()
  │                                        │    → ensureLabelPath()
  │                                        │    → create parents + update children
  │                                        │ 8. broadcastUpdate(contentStore)
  │                                        │ 9. broadcastUpdate(collections)
  │◄────────────────────────────────────── │
  │ 10. cachedContext refreshes            │
  │ 11. UI re-renders                      │
```

### Key Notes

- UI can add a nested label without explicitly creating it; the service
  worker will create missing parents via `ensureLabelPath`.
- Parent label views aggregate descendants in the collection UI (labels
  are treated as subtree selections).

### Mutation Flow Code

```typescript
// POPUP: Send mutation with optimistic update
async function updateTitle(urlHash: string, newTitle: string) {
  const requestId = ulid();

  // 1. Optimistic update
  const previousTitle = cachedContext.me.root.contentStore[urlHash].title;
  cachedContext.me.root.contentStore[urlHash].title = newTitle;
  notifySubscribers();

  // 2. Send mutation
  const response = await sendRuntimeMessage({
    type: "jazz:mutate",
    requestId,
    operation: "update",
    entityType: "contentStore",
    entityId: urlHash,
    data: { title: newTitle },
  });

  // 10. Handle response
  if (!response.success) {
    // Rollback
    cachedContext.me.root.contentStore[urlHash].title = previousTitle;
    notifySubscribers();
    showToast("Update failed");
  }
}

// SERVICE WORKER: Handle mutation
export async function handleJazzMutate(request: JazzMutateRequest) {
  const { requestId, clientId, operation, entityType, entityId, data } =
    request;

  const context = getJazzContext();
  const me = context.me;

  // 4. Track BEFORE Jazz operation
  trackLocalMutation(entityType, operation, entityId, { requestId, clientId });

  // 5-6. Perform Jazz operation
  const result = await updateEntity(me, entityType, entityId, data);

  return {
    type: "jazz:mutateResponse",
    requestId,
    success: true,
    entityId: result.entityId,
    data: result.data,
  };
}

// SERVICE WORKER: Jazz subscription triggers broadcast
function setupJazzSubscriptions() {
  const { me } = getJazzContext();

  me.root.contentStore.$jazz.subscribe(() => {
    scheduleBroadcast("contentStore");
  });
}

function scheduleBroadcast(collection: string) {
  pendingBroadcasts.push(collection);

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    for (const col of pendingBroadcasts) {
      const meta = getLatestMutationMetaForCollection(col);
      broadcastUpdate(
        ["root", col],
        { _refresh: true },
        { excludeClientId: meta?.clientId },
      );
    }
    pendingBroadcasts = [];
  }, 500);
}
```

## Subscription Flow

```
Popup                              Service Worker
  │                                    │
  │  1. port = chrome.runtime.connect  │
  │     ({ name: 'jazz-subscription' })│
  │ ──────────────────────────────────►│
  │                                    │
  │  2. port.postMessage({             │
  │       type: 'jazz:subscribe',      │
  │       subscriptionId: 'sub_123',   │
  │       path: ['root', 'collections']│
  │     })                             │
  │ ──────────────────────────────────►│
  │                                    │
  │                                    │  3. handleJazzSubscribe()
  │                                    │     → registerSubscription()
  │                                    │     → Store: id, path, port
  │                                    │
  │◄═══════════════════════════════════│  4. Port kept open
  │      Long-lived connection         │
  │                                    │
  │                                    │
  │                                    │  5. Jazz data changes
  │                                    │     (from any source)
  │                                    │
  │                                    │  6. Jazz subscription fires
  │                                    │
  │                                    │  7. broadcastUpdate()
  │                                    │     → Find matching subs
  │                                    │
  │  8. port.postMessage({             │
  │       type: 'jazz:dataUpdated',    │
  │       subscriptionId: 'sub_123',   │
  │       data: {...}                  │
  │     })                             │
  │◄───────────────────────────────────│
  │                                    │
  │  9. Update cachedContext           │
  │  10. notifySubscribers()           │
  │  11. UI re-renders                 │
  │                                    │
  │  12. port.onDisconnect             │
  │ ──────────────────────────────────►│
  │                                    │  13. unregisterSubscription()
```

### Subscription Flow Code

```typescript
// POPUP: Set up subscription
function setupSubscription() {
  // 1. Connect port
  const port = chrome.runtime.connect({ name: "jazz-subscription" });

  // 2. Send subscribe message
  port.postMessage({
    type: "jazz:subscribe",
    subscriptionId: `sub_${ulid()}`,
    clientId: getExtensionClientId(),
    path: ["root", "collections"],
  });

  // 8. Handle updates
  port.onMessage.addListener((message) => {
    if (message.type === "jazz:dataUpdated") {
      handleDataUpdate(message);
    }
  });

  // 12. Handle disconnect
  port.onDisconnect.addListener(() => {
    // Reconnect logic...
  });
}

// SERVICE WORKER: Handle subscription
export function handleJazzSubscribe(
  request: JazzSubscribeRequest,
  port: chrome.runtime.Port,
) {
  const { subscriptionId, clientId, path } = request;

  // 3. Register subscription
  registerSubscription(subscriptionId, path, null, port, clientId);

  // Clean up on disconnect
  port.onDisconnect.addListener(() => {
    unregisterSubscription(subscriptionId);
  });
}

// SERVICE WORKER: Broadcast to subscribers
export function broadcastUpdate(
  changedPath: string[],
  data: any,
  options?: { excludeClientId?: string },
) {
  for (const [id, sub] of activeSubscriptions) {
    // Skip sender if specified
    if (options?.excludeClientId && sub.clientId === options.excludeClientId) {
      continue;
    }

    // Check if path matches subscription
    if (pathMatches(sub.path, changedPath)) {
      // 8. Send update via port
      sub.port.postMessage({
        type: "jazz:dataUpdated",
        subscriptionId: id,
        data: serializeCoValue(data),
        changedPaths: [changedPath],
      });
    }
  }
}
```

## Data Loading Patterns

### Pattern 1: Incremental Loading

```typescript
// Load root metadata first (fast)
const rootResponse = await queryServiceWorker(["root"], {
  displayName: true,
  settings: true,
  schemaVersion: true,
});

// UI renders immediately with basic info
updateCachedContext(rootResponse.data);

// Background: load collections
void (async () => {
  const collectionsResponse = await queryServiceWorker(
    ["root", "collections"],
    COLLECTIONS_RESOLVE,
  );
  updateCachedContext({ collections: collectionsResponse.data });
})();

// Background: load content in batches
void (async () => {
  const urlHashes = getUrlHashesFromCollections();

  for (let i = 0; i < urlHashes.length; i += BATCH_SIZE) {
    const batch = urlHashes.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (urlHash) => {
        const response = await queryServiceWorker(
          ["root", "contentStore", urlHash],
          CONTENT_STORE_ENTRY_RESOLVE,
        );
        updateCachedContext({
          contentStore: { [urlHash]: response.data },
        });
      }),
    );
  }
})();
```

### Pattern 2: Lazy Loading

```typescript
// Only load when needed
async function loadContentForReading(urlHash: string) {
  // Check cache first
  if (cachedContext.me.root.contentStore[urlHash]?.$isLoaded) {
    return cachedContext.me.root.contentStore[urlHash];
  }

  // Load from service worker
  const response = await queryServiceWorker(["root", "contentStore", urlHash], {
    urlHash: true,
    title: true,
    markdown: true,
  });

  // Cache result
  cachedContext.me.root.contentStore[urlHash] = response.data;

  return response.data;
}
```

### Pattern 3: Resolve Specs

```typescript
// Load only specific fields
const response = await queryServiceWorker(["root", "contentStore", urlHash], {
  urlHash: true,
  title: true,
  // Don't load heavy fields
  // markdown: false,
  // images: false,
});

// Load nested relationships
const response = await queryServiceWorker(["root", "collections"], {
  $each: {
    name: true,
    contentHashes: { $each: true }, // Load all contentHashes
    metadata: {
      feedUrl: true,
      feedTitle: true,
    },
  },
});
```

## Serialization

### CoValue to Plain Object

```typescript
// background/jazz-serialization.ts

export function serializeCoValue(coValue: unknown): any {
  // Handle null/undefined
  if (coValue == null) return null;

  // Handle primitives
  if (typeof coValue !== "object") return coValue;

  // Handle arrays
  if (Array.isArray(coValue)) {
    return coValue.map((item) => serializeCoValue(item));
  }

  // Handle CoValue objects
  const result: Record<string, any> = {};

  // Preserve Jazz ID
  if (coValue.$jazz?.id) {
    result._jazzId = coValue.$jazz.id;
  }

  // Copy enumerable properties (skip $jazz)
  for (const key in coValue) {
    if (key === "$jazz") continue;
    if (!Object.prototype.hasOwnProperty.call(coValue, key)) continue;

    result[key] = serializeCoValue(coValue[key]);
  }

  return result;
}
```

### Before/After Serialization

```typescript
// Original CoValue (in service worker)
const content = root.contentStore[urlHash];
console.log(content);
// {
//   $jazz: { id: 'co_z123', ... },  // Jazz internals
//   urlHash: 'abc123',
//   title: 'Example',
//   $isLoaded: true,
//   _refs: {...},
// }

// Serialized (sent to popup)
const serialized = serializeCoValue(content);
console.log(serialized);
// {
//   _jazzId: 'co_z123',  // Preserved for reference
//   urlHash: 'abc123',
//   title: 'Example',
//   // $jazz removed
//   // $isLoaded removed
//   // _refs removed
// }
```
