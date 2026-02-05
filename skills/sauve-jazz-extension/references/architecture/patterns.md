# Jazz Extension Patterns

## Pattern 1: Service Worker Initialization

```typescript
// background/jazz-worker.ts

/**
 * Initialize Jazz worker with account credentials
 * Handles both new accounts and restoration from storage
 */
export async function initializeJazzWorker(
  accountID: string,
  accountSecret: string,
  displayName?: string,
): Promise<void> {
  if (workerState.isInitialized) {
    console.log("[Jazz Worker] Already initialized");
    return;
  }

  try {
    // 1. Create account schema with migration logic
    const BasicAccountSchema = createAccountSchema(displayName);

    // 2. Get IndexedDB storage
    const storage = await getIndexedDBStorage("jazz-storage");

    // 3. Start Jazz worker
    workerInstance = await startWorker({
      accountID,
      accountSecret,
      syncServer:
        import.meta.env.VITE_JAZZ_SYNC_SERVER ||
        `wss://cloud.jazz.tools/?key=${import.meta.env.VITE_JAZZ_API_KEY}`,
      AccountSchema: BasicAccountSchema,
      skipInboxLoad: true,
      asActiveAccount: true,
      storage,
    });

    // 4. Update state
    workerState.isInitialized = true;
    workerState.accountID = accountID;

    // 5. Ensure root is loaded
    const { me } = getJazzContext();
    await me.root.$jazz.ensureLoaded({
      resolve: {
        collections: true,
        contentStore: true,
        readingListIndex: true,
        settings: true,
        schemaVersion: true,
      },
    });

    // 6. Set up subscriptions for live sync
    setupJazzSubscriptions();

    // 7. Background: deep load and integrity check
    if (!IS_TEST) {
      void (async () => {
        await workerInstance!.waitForConnection();
        await deepLoadAllData();
        await verifyDataIntegrity();
        workerState.dataLoaded = true;
      })();
    }
  } catch (error) {
    console.error("[Jazz Worker] Initialization failed:", error);
    resetJazzWorker();
    throw error;
  }
}
```

## Pattern 2: Proxy Context Initialization

```typescript
// popup/jazz/proxy/context-proxy.ts

/**
 * Initialize proxy and connect to service worker
 * Returns true if initialized, false if waiting for account
 */
export async function initializeProxy(): Promise<boolean> {
  if (isInitialized) return true;

  console.log("[Proxy] Initializing...");

  try {
    // 1. Set up subscription FIRST (before querying)
    setupSubscription();

    // 2. Query root metadata
    let response = await queryServiceWorker(["root"], ROOT_META_RESOLVE);

    // 3. Handle uninitialized worker
    if (!response.success && response.error === "Jazz worker not initialized") {
      // Try to init from stored credentials
      const creds = await getInitCredentials();
      if (creds) {
        await sendRuntimeMessage({
          type: "jazz:init",
          requestId: ulid(),
          ...creds,
        });
        await sleep(500);
        response = await queryServiceWorker(["root"], ROOT_META_RESOLVE);
      } else {
        return false; // Waiting for account creation
      }
    }

    // 4. Create cached context
    ensureCachedContextBase(response.data);
    isInitialized = true;

    // 5. Mark sync state
    syncStateManager.setInitialized(true);
    syncStateManager.setRootLoaded(true);

    // 6. Notify subscribers (UI can render)
    notifySubscribers();

    // 7. Background: load collections and content
    void loadInitialCollections();

    return true;
  } catch (error) {
    console.error("[Proxy] Initialization failed:", error);
    throw error;
  }
}
```

## Pattern 3: Mutation Handler

```typescript
// background/jazz-message-handler.ts

/**
 * Handle mutation request from popup
 * Creates, updates, or deletes entities
 */
export async function handleJazzMutate(
  request: JazzMutateRequest,
): Promise<JazzMutateResponse> {
  const { requestId, clientId, operation, entityType, entityId, data } =
    request;

  try {
    // 1. Ensure Jazz is initialized
    await ensureJazzInitialized();

    if (!isJazzWorkerInitialized()) {
      return {
        type: "jazz:mutateResponse",
        requestId,
        success: false,
        error: "Jazz worker not initialized",
      };
    }

    // 2. Get Jazz context
    const context = getJazzContext();
    const me = context.me;

    // 3. Route to handler
    const meta = { requestId, clientId };
    let result: { entityId: string; data: any };

    switch (operation) {
      case "create":
        result = await createEntity(me, entityType, data, meta);
        break;
      case "update":
        result = await updateEntity(me, entityType, entityId!, data, meta);
        break;
      case "delete":
        result = await deleteEntity(me, entityType, entityId!, meta);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    // 4. Get updated indexes
    const indexes = getRelevantIndexes([entityType]);

    // 5. Return success
    return {
      type: "jazz:mutateResponse",
      requestId,
      success: true,
      entityId: result.entityId,
      data: result.data,
      indexes,
    };
  } catch (error) {
    return {
      type: "jazz:mutateResponse",
      requestId,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create entity - CRITICAL: track BEFORE Jazz operation
 */
async function createEntity(
  me: any,
  entityType: string,
  data: any,
  meta: { requestId: string; clientId?: string },
): Promise<{ entityId: string; data: any }> {
  const root = me.root as AppRootType;

  switch (entityType) {
    case "contentStore": {
      // 1. Get urlHash key
      const urlHash = data.urlHash || (await hashUrl(data.url));

      // 2. Ensure contentStore exists
      if (!root.contentStore) {
        root.$jazz.set("contentStore", ContentStoreRecord.create({}, me));
      }

      // 3. CRITICAL: Track mutation BEFORE creating
      // This ensures broadcast excludes the sender
      trackLocalMutation("contentStore", "create", urlHash, meta);

      // 4. Create PageContent
      const content = PageContent.create(
        {
          urlHash,
          url: data.url,
          title: data.title,
          markdown: data.markdown,
          collectionNames: data.collections || [],
          // ... other fields
        },
        me,
      );

      // 5. Add to contentStore
      (root.contentStore as any).$jazz.set(urlHash, content);

      // 6. Update indexes
      indexAddContent(urlHash, content);

      // 7. Return serialized data
      return { entityId: urlHash, data: serializeCoValue(content) };
    }
    // ... other entity types
  }
}
```

## Pattern 4: Jazz Subscription Setup

```typescript
// background/jazz-worker.ts

/**
 * Set up Jazz subscriptions for live sync
 * Called once after worker initialization
 */
function setupJazzSubscriptions() {
  // Clean up existing subscriptions
  for (const u of unsubscribers) {
    try {
      u();
    } catch {
      /* ignore */
    }
  }
  unsubscribers = [];

  try {
    const { me } = getJazzContext();
    const root = me.root;
    if (!root) return;

    // Helper to subscribe to a CoValue
    const subscribeTo = (coValue: any, collection: string) => {
      if (coValue?.$jazz?.subscribe) {
        unsubscribers.push(
          coValue.$jazz.subscribe(() => {
            scheduleBroadcast(collection);
          }),
        );
      }
    };

    // Subscribe to main data structures
    subscribeTo(root.collections, "collections");
    subscribeTo(root.contentStore, "contentStore");
    subscribeTo(root.settings, "settings");

    console.log("[Jazz Worker] Subscriptions set up");
  } catch (err) {
    console.error("[Jazz Worker] Subscription setup failed:", err);
  }
}

/**
 * Schedule broadcast with debouncing
 */
function scheduleBroadcast(collection: string): void {
  pendingBroadcasts.push(collection);

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const unique = new Set(pendingBroadcasts);
    pendingBroadcasts = [];

    for (const col of unique) {
      const path = getPathForCollection(col);
      if (!path) continue;

      // Get mutation metadata to exclude sender
      const meta = getLatestMutationMetaForCollection(col);
      const data = meta
        ? { _refresh: true, _collection: col, _cause: meta }
        : { _refresh: true, _collection: col };

      broadcastUpdate(path, data, { excludeClientId: meta?.clientId });
    }
  }, BROADCAST_DEBOUNCE_MS);
}
```

## Pattern 5: Bidirectional Collection Links

```typescript
// lib/jazz/collection-operations.ts

/**
 * Add collection to content with bidirectional linking
 * Updates both content.collectionNames and collection.contentHashes
 */
export async function addCollectionToContent(
  root: AppRootType,
  urlHash: string,
  collectionName: string,
  account: any,
  options?: {
    namespace?: string;
    metadata?: Record<string, any>;
  },
): Promise<void> {
  // 1. Get or create collection
  let collection = (root.collections as any)?.[collectionName];

  if (!collection) {
    collection = Collection.create(
      {
        name: collectionName,
        displayName: options?.metadata?.displayName || collectionName,
        namespace: options?.namespace,
        contentHashes: UrlHashList.create([], account),
        createdAt: Date.now(),
        metadataType: options?.metadata?.type,
        metadataJson: options?.metadata
          ? JSON.stringify(options.metadata)
          : undefined,
      },
      account,
    );

    (root.collections as any).$jazz.set(collectionName, collection);
  }

  // 2. Get content entry
  const content = (root.contentStore as any)?.[urlHash];
  if (!content) return;

  // 3. Update content.collectionNames
  const currentCollections = getContentCollections(content);
  if (!currentCollections.includes(collectionName)) {
    content.$jazz.set("collectionNames", [
      ...currentCollections,
      collectionName,
    ]);
  }

  // 4. Update collection.contentHashes
  const currentHashes = collection.contentHashes || [];
  if (!currentHashes.includes(urlHash)) {
    collection.contentHashes.$jazz.push(urlHash);
  }
}

/**
 * Remove collection from content
 */
export async function removeCollectionFromContent(
  root: AppRootType,
  urlHash: string,
  collectionName: string,
): Promise<void> {
  // 1. Get content entry
  const content = (root.contentStore as any)?.[urlHash];
  if (!content) return;

  // 2. Update content.collectionNames
  const currentCollections = getContentCollections(content);
  const newCollections = currentCollections.filter((c) => c !== collectionName);

  if (newCollections.length !== currentCollections.length) {
    content.$jazz.set("collectionNames", newCollections);
  }

  // 3. Update collection.contentHashes
  const collection = (root.collections as any)?.[collectionName];
  if (collection?.contentHashes) {
    const hashes = collection.contentHashes;
    const index = hashes.indexOf(urlHash);
    if (index !== -1) {
      hashes.$jazz.splice(index, 1);
    }
  }
}
```

## Pattern 6: Optimistic UI Update

```typescript
// popup/jazz/proxy/optimistic-update-manager.ts

interface OptimisticUpdate {
  requestId: string;
  collection: string;
  entityId: string;
  rollback: () => void;
}

const pendingUpdates = new Map<string, OptimisticUpdate>();

export const optimisticUpdateManager = {
  /**
   * Apply optimistic update to cached context
   */
  applyUpdate(
    requestId: string,
    collection: string,
    entityId: string,
    changes: Record<string, any>,
  ): void {
    const context = getCachedContext();
    if (!context) return;

    // Get current state
    const entity = context.me.root[collection]?.[entityId];
    if (!entity) return;

    // Store rollback state
    const previousState = { ...entity };

    // Apply changes
    Object.assign(entity, changes);

    // Store rollback function
    const rollback = () => {
      Object.assign(entity, previousState);
      notifySubscribers();
    };

    pendingUpdates.set(requestId, {
      requestId,
      collection,
      entityId,
      rollback,
    });

    // Notify UI immediately
    notifySubscribers();
  },

  /**
   * Handle mutation response
   */
  handleResponse(requestId: string, success: boolean): void {
    const update = pendingUpdates.get(requestId);
    if (!update) return;

    pendingUpdates.delete(requestId);

    if (!success) {
      // Rollback on failure
      update.rollback();
      console.error(
        `[Optimistic] Rolled back ${update.collection}/${update.entityId}`,
      );
    }
  },

  /**
   * Rollback all pending updates (e.g., on disconnect)
   */
  rollbackAll(): void {
    for (const [requestId, update] of pendingUpdates) {
      update.rollback();
      pendingUpdates.delete(requestId);
    }
  },
};

// Usage in component
async function handleUpdateTitle(urlHash: string, newTitle: string) {
  const requestId = ulid();

  // Apply optimistic update
  optimisticUpdateManager.applyUpdate(requestId, "contentStore", urlHash, {
    title: newTitle,
  });

  // Send mutation
  const response = await sendRuntimeMessage({
    type: "jazz:mutate",
    requestId,
    operation: "update",
    entityType: "contentStore",
    entityId: urlHash,
    data: { title: newTitle },
  });

  // Handle response
  optimisticUpdateManager.handleResponse(requestId, response.success);
}
```

## Pattern 7: Derived View (Reading List)

```typescript
// lib/jazz/reading-list.ts

/**
 * Get reading list items with pagination and filtering
 * Derived view from contentStore + readingListIndex
 */
export async function getReadingListItems(
  account: any,
  options: ReadingListQueryOptions = {},
  onProgress?: (progress: { loaded: number; total: number }) => void,
): Promise<ReadingListResult> {
  const root = account?.root;
  if (!root) {
    return { items: [], total: 0, hasMore: false, loadedCount: 0 };
  }

  const offset = options.offset || 0;
  const limit = options.limit || 50;

  // 1. Ensure required data is loaded
  await root.$jazz.ensureLoaded({
    resolve: {
      readingListIndex: true,
      contentStore: true,
      collections: true,
    },
  });

  // 2. Get ordered urlHashes from index
  const urlHashes = root.readingListIndex || [];
  const total = urlHashes.length;

  // 3. Get page of hashes
  const pageHashes = urlHashes.slice(offset, offset + limit);

  // 4. Build feed metadata map from rss:/ collections
  const feedMetaByCollection = buildFeedMetadataFromCollections(root);

  // 5. Load content entries in batches
  const items: PlainReadingListItem[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < pageHashes.length; i += BATCH_SIZE) {
    const batch = pageHashes.slice(i, i + BATCH_SIZE);

    const batchItems = await Promise.all(
      batch.map(async (urlHash: string) => {
        // Load content entry
        const entryRef = root.contentStore?.[urlHash];
        const entry = await loadPageContent(entryRef);

        if (!entry?.$isLoaded) return null;

        const plain = toPlainPageContent(entry);

        // Filter: deleted, read, collection
        if (!isInReadingList(plain, options)) return null;

        // Get feed metadata
        const feedMeta = getFeedMetadataForContent(
          plain.collectionNames || [],
          feedMetaByCollection,
        );

        return pageContentToReadingListItem(plain, feedMeta);
      }),
    );

    items.push(...batchItems.filter(Boolean));
    onProgress?.({ loaded: items.length, total: pageHashes.length });
  }

  return {
    items,
    total,
    hasMore: offset + limit < total,
    loadedCount: items.length,
  };
}
```
