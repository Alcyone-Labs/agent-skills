---
name: sauve-jazz-extension
description: Build features for Jazz-powered Chrome extensions with service worker architecture E2E encrypted sync and real-time data flow
references:
  - architecture
  - data-flow
  - sync-patterns
  - testing
  - troubleshooting
  - schemas
  - message-protocol
  - labels-management
  - collections-system
---

## When to Apply

- Building Chrome Extension MV3 with Jazz E2E encrypted storage
- Implementing service worker as sole Jazz client
- Creating popup-to-service-worker message protocols
- Adding new features to existing Jazz extension
- Debugging sync issues between popup and service worker
- Working in proxy mode (`isProxyMode() === true`) flows
- Writing tests for Jazz CoValue operations
- Migrating schemas or repairing data integrity

## Rules

### Architecture Rules

- Service worker is the ONLY Jazz client - never use `createJazzContext` in popup
- Popup uses proxy pattern - mimics JazzBrowserContextManager API
- All data flows through typed message protocol
- IndexedDB persistence via `cojson-storage-indexeddb`
- WebAssembly crypto loaded via `jazz-tools/load-edge-wasm`
- Proxy mode is primary - always check `isProxyMode()` before data ops
- When `isProxyMode()` is true, route all reads/mutations through service worker
- Service worker handles alarms, context menus, metadata realtime, Aquaria sync, notifications/badge
- Label assignment flows through reading list updateCollections mutations
- Parent label views aggregate descendant label items (labels:/parent/\*\*)

### Schema Rules

- Use `co.*` from `jazz-tools` for all persistent data
- Use `z.*` from `jazz-tools` (NOT standalone zod) for primitives
- CoRecord for O(1) lookup by key (urlHash, collection name)
- CoList for ordered collections (readingListIndex)
- Always include `schemaVersion` field for migrations
- Never remove fields - only add optional fields

### Message Protocol Rules

- Always include `requestId` for correlation
- Use `clientId` to exclude sender from broadcast
- Serialize CoValues with `serializeCoValue()` - strips `$jazz` internals
- Mutations must `trackLocalMutation()` before Jazz operations
- Broadcast updates via `broadcastUpdate()` after mutations

### Sync Rules

- Load data incrementally - don't block UI on deep loads
- Use `ensureLoaded()` with resolve specs for partial loading
- Batch contentStore loads (20 items at a time)
- Subscribe to Jazz changes immediately on init
- Debounce broadcasts (500ms) to prevent thundering herd

### Testing Rules

- Mock `jazz-tools/worker` in service worker tests
- Use `fake-indexeddb` for IndexedDB mocking
- Clean Jazz state in `afterEach` to prevent cross-test contamination
- Test message protocol with mock chrome.runtime
- Verify optimistic updates roll back on failure

## Workflow Decision Tree

```
Request: Build Jazz extension feature
A. Identify feature type
   ├─ New schema field → Check schema-version compatibility
   ├─ New entity type → Add to message protocol + mutation handler
   ├─ New UI component → Use proxy context + optimistic updates
   ├─ Labels (labels:/) → See labels-management reference
   ├─ Collections/RSS groups/source detection → See collections-system reference
   └─ Background sync → Add to service worker + alarm handler

B. Implement data flow
   1. Gate: If isProxyMode() true, use SW message protocol
   2. Schema: Add to appropriate CoValue in schemas/
   3. Service Worker: Add mutation handler in jazz-message-handler.ts
   4. Popup: Add feature function in features/
   5. UI: Use proxy context hooks for data access

C. Verify sync
   1. Mutation tracks via trackLocalMutation()
   2. Jazz subscription fires on change
   3. Broadcast reaches all popup instances
   4. UI updates with new data

D. Test
   1. Unit: Mock service worker responses
   2. Integration: Test full popup→SW→popup flow
   3. E2E: Verify real-time sync across popup instances
```

## Examples

### Example 1: Add New Entity Type (Reading List Item)

```typescript
// 1. SCHEMA: popup/jazz/schemas/page-content.ts
export const PageContent = co.map({
  // ... existing fields
  userReadAt: z.number().nullable().optional(),
  userDeletedAt: z.number().nullable().optional(),
});

// 2. SERVICE WORKER: background/jazz-message-handler.ts
async function createEntity(me, entityType, data) {
  switch (entityType) {
    case 'contentStore': {
      const result = upsertContentStore(root, me, data);
      trackLocalMutation('contentStore', 'create', result.entityId, meta);
      indexAddContent(result.entityId, result.data);
      return result;
    }
  }
}

// 3. POPUP: lib/jazz/reading-list.ts
export async function markReadingListItemAsRead(account, urlHash) {
  const root = account?.root;
  await root.$jazz.ensureLoaded({ resolve: { contentStore: true } });
  const entry = await loadPageContent(root.contentStore[urlHash]);
  entry.$jazz.set('userReadAt', Date.now());
}

// 4. UI: popup/components/reading-list/item.tsx
function ReadingListItem({ urlHash }) {
  const context = useJazzContext();
  const content = context.me.root.contentStore[urlHash];

  const handleMarkRead = async () => {
    await sendRuntimeMessage({
      type: 'jazz:readingList:markRead',
      requestId: ulid(),
      urlHash,
    });
  };

  return <button onClick={handleMarkRead}>Mark Read</button>;
}
```

### Example 2: Fix Sync Issue (Missing Broadcast)

```typescript
// PROBLEM: Mutation updates Jazz but UI doesn't refresh
// CAUSE: Missing trackLocalMutation() causes broadcast to include sender

// BEFORE (broken):
async function updateEntity(me, entityType, entityId, data) {
  const entity = findEntity(root, entityId);
  entity.$jazz.set("title", data.title); // Jazz updates, but...
  // Missing: trackLocalMutation()
  // Result: broadcastUpdate() sends to ALL clients including sender
  // Sender ignores (clientId match), but other popups get update
  // Original popup never refreshes because it excluded itself
}

// AFTER (fixed):
async function updateEntity(me, entityType, entityId, data, meta) {
  // CRITICAL: Track BEFORE Jazz operation
  trackLocalMutation(entityType, "update", entityId, meta);

  const entity = findEntity(root, entityId);
  entity.$jazz.set("title", data.title);

  // Now broadcastUpdate() knows to exclude the sender
  // Sender will receive update and refresh UI
}
```

### Example 3: Add Optimistic UI Update

```typescript
// popup/jazz/proxy/optimistic-update-manager.ts
export const optimisticUpdateManager = {
  applyUpdate(collection, entityId, changes) {
    // Apply to cached context immediately
    const context = getCachedContext();
    const entity = context.me.root[collection][entityId];

    // Store rollback state
    const rollback = { ...entity };

    // Apply optimistic changes
    Object.assign(entity, changes);

    // Return rollback function
    return () => {
      Object.assign(entity, rollback);
      notifySubscribers();
    };
  },

  handleResponse(requestId, success, rollback) {
    if (!success) {
      rollback();
      showToast("Update failed - changes reverted");
    }
  },
};

// Usage in component
async function handleSave() {
  const rollback = optimisticUpdateManager.applyUpdate(
    "contentStore",
    urlHash,
    { title: newTitle },
  );

  const response = await sendRuntimeMessage({
    type: "jazz:mutate",
    operation: "update",
    entityType: "contentStore",
    entityId: urlHash,
    data: { title: newTitle },
  });

  optimisticUpdateManager.handleResponse(
    response.requestId,
    response.success,
    rollback,
  );
}
```

### Example 4: Create Hierarchical Label

```typescript
// 1. SCHEMA: Collection already has children field
export const Collection = co.map({
  name: z.string(),
  children: z.array(z.string()).optional(), // For hierarchy
  contentHashes: co.list(z.string()),
});

// 2. SERVICE WORKER: Use ensureLabelPath for labels
async function createEntity(me, entityType, data) {
  switch (entityType) {
    case 'collection': {
      const normalizedName = data.name;

      // Route labels through ensureLabelPath
      if (getNamespace(normalizedName) === 'labels') {
        const collection = await ensureLabelPath(
          root, normalizedName, me,
          { displayName: data.displayName }
        );

        // Index all created collections
        const toIndex = [
          LABELS_ROOT,
          ...getLabelAncestorNames(normalizedName),
          normalizedName,
        ];

        for (const name of toIndex) {
          const entry = root.collections?.[name];
          if (entry) indexAddCollection(entry);
        }

        return { entityId: collection.$jazz.id, data: serializeCoValue(collection) };
      }
    }
  }
}

// 3. POPUP: Normalize user input
export async function createLabel(input: string) {
  const normalized = normalizeLabelCollectionName(input);
  // "AI/Research" → "labels:/ai/research"

  await optimisticUpdateManager.applyOptimistic('create', 'collection', {
    name: normalized,
    displayName: input,
  });
}

// 4. UI: Show hierarchical tree
function LabelTree({ collections }) {
  const tree = buildLabelTree(collections);
  return (
    <ul>
      {tree.map(node => (
        <li key={node.name}>
          {node.displayName} ({node.contentCount})
          {node.children.length > 0 && <LabelTree collections={node.children} />}
        </li>
      ))}
    </ul>
  );
}
```

### Example 5: Create RSS Group and Filter by Source

```typescript
// 1. SCHEMA: RSS group uses children array to track feeds
// Collection already has children field for hierarchy
export const Collection = co.map({
  name: z.string(),
  children: z.array(z.string()).optional(), // Feed collection names
  contentHashes: co.list(z.string()), // Aggregated from children
  namespace: z.string().optional(), // 'rss-group'
});

// 2. SERVICE WORKER: Create RSS group with feeds
async function createRSSGroup(root, groupName, feedUrls, account) {
  const fullName = `rss-group:/${groupName}`;

  // Create group collection
  const group = Collection.create({
    name: fullName,
    namespace: 'rss-group',
    children: [], // Will populate with feeds
    contentHashes: [], // Aggregated, not direct
  }, account);

  root.collections.$jazz.set(fullName, group);

  // Resolve URLs to collection names and add as children
  const feedNames = feedUrls.map(url => buildRssCollectionNameFromUrl(url));
  group.$jazz.set('children', feedNames);

  return group;
}

// 3. POPUP: Get items from RSS group (aggregate from children)
async function getRSSGroupItems(groupName) {
  const group = await getCollectionByName(groupName);
  const feedNames = getCollectionChildren(group);

  // Aggregate content from all feeds
  const allHashes = new Set();
  for (const feedName of feedNames) {
    const feed = await getCollectionByName(feedName);
    (feed.contentHashes || []).forEach(h => allHashes.add(h));
  }

  // Deduplicate and load
  return Array.from(allHashes)
    .map(hash => root.contentStore[hash])
    .filter(Boolean);
}

// 4. UI: Filter by source type and search
function SourceFilter({ items, sourceType, searchQuery }) {
  const filtered = useMemo(() => {
    return items.filter(item => {
      // Filter by source type
      if (sourceType && item.sourceType !== sourceType) {
        return false;
      }

      // Search DSL collection filter
      if (searchQuery) {
        const criteria = parseCollectionExpression(searchQuery);
        return matchesCollectionCriteria(item, criteria);
      }

      return true;
    });
  }, [items, sourceType, searchQuery]);

  return <ItemList items={filtered} />;
}
```

## Reference Topics

- **architecture/** - Service worker pattern, proxy context, file organization
- **data-flow/** - Query/mutation/subscription patterns, serialization
- **sync-patterns/** - Real-time updates, optimistic UI, conflict resolution
- **labels-management/** - Hierarchical labels (labels:/) creation, hierarchy, sync
- **collections-system/** - Unified contentStore, source detection, RSS groups, Search DSL
- **testing/** - Unit/integration/E2E test patterns for Jazz
- **troubleshooting/** - Common sync issues, debugging techniques
- **schemas/** - CoValue patterns, migrations, namespace design
- **message-protocol/** - Message types, handlers, port-based subscriptions
