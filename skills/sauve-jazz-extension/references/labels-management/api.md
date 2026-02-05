# Labels Management API

## Core Functions

### `normalizeLabelCollectionName(input: string): string`

Normalizes user input to a proper labels:/ path.

```typescript
// Simple label
normalizeLabelCollectionName("AI Research");
// → "labels:/ai-research"

// Already namespaced (preserved)
normalizeLabelCollectionName("labels:/ai");
// → "labels:/ai"

// Hierarchical path
normalizeLabelCollectionName("ai/research");
// → "labels:/ai/research"

// With normalization per segment
normalizeLabelCollectionName("Work/Active Projects");
// → "labels:/work/active-projects"
```

**Location**: `packages/sauve-chrome-extension/src/lib/jazz/namespaces/labels.ts`

---

### `ensureLabelPath(root, labelName, account, options?): Promise<CollectionType>`

Ensures a complete label path exists, creating missing parents and linking hierarchy.

```typescript
// Creates labels:/, labels:/ai, and labels:/ai/research
// Links ai as child of labels:/
// Links research as child of labels:/ai
const collection = await ensureLabelPath(root, "labels:/ai/research", account, {
  displayName: "AI Research", // Only applied to leaf
  description: "Research papers",
  color: "#3b82f6",
});
```

**Behavior**:

- Creates all ancestors that don't exist
- Updates `children` arrays on all parents
- Returns the leaf collection
- Idempotent (safe to call multiple times)

**Location**: `packages/sauve-chrome-extension/src/lib/jazz/collection-operations.ts`

---

### `isLabelCollection(name: string): boolean`

Checks if a collection name is in the labels namespace.

```typescript
isLabelCollection("labels:/ai");
// → true

isLabelCollection("rss:/example.com");
// → false
```

---

### `getLabelParentName(name: string): string | null`

Returns the parent label name or null for root.

```typescript
getLabelParentName("labels:/ai/research");
// → "labels:/ai"

getLabelParentName("labels:/ai");
// → "labels:/"

getLabelParentName("labels:/");
// → null
```

---

### `getLabelAncestorNames(name: string): string[]`

Returns all ancestor paths (excluding root, excluding self).

```typescript
getLabelAncestorNames("labels:/work/projects/active");
// → ["labels:/work", "labels:/work/projects"]

getLabelAncestorNames("labels:/ai");
// → []
```

---

### `getLabelDisplayName(name: string): string`

Strips the `labels:/` prefix for UI display.

```typescript
getLabelDisplayName("labels:/ai/research");
// → "ai/research"

getLabelDisplayName("labels:/");
// → "labels:/"  (root preserved)
```

---

### `getLabelDepth(name: string): number`

Returns nesting depth (0 = root, 1 = top-level, etc.).

```typescript
getLabelDepth("labels:/");
// → 0

getLabelDepth("labels:/ai");
// → 1

getLabelDepth("labels:/ai/research");
// → 2
```

---

## Collection Operations

### `createCollection(root, name, account, options?, isSystemCall?)`

Creates a collection. Automatically routes labels through `ensureLabelPath`.

```typescript
// Automatically ensures full path for labels
await createCollection(root, "labels:/ai/research", account, {
  displayName: "AI Research",
});

// Non-label collections use standard creation
await createCollection(root, "my-collection", account, {
  displayName: "My Collection",
});
```

**Location**: `packages/sauve-chrome-extension/src/lib/jazz/collection-operations.ts`

---

### `addCollectionToContent(root, urlHash, collectionName, account)`

Assigns a collection to content with bidirectional linking.

```typescript
await addCollectionToContent(
  root,
  "abc123...", // urlHash
  "labels:/ai/research",
  account,
);

// Effects:
// 1. Adds "labels:/ai/research" to content.collectionNames
// 2. Adds urlHash to collection.contentHashes
// 3. Creates collection if doesn't exist (for labels, ensures path)
```

---

### `removeCollectionFromContent(root, urlHash, collectionName)`

Removes a collection from content.

```typescript
await removeCollectionFromContent(root, "abc123...", "labels:/ai/research");
```

---

## Frontend Features

### `getUserCollections(): Promise<string[]>`

Returns all user-manageable collection names (excludes system-managed namespaces).

```typescript
const collections = await getUserCollections();
// → ["labels:/ai", "labels:/ai/research", "labels:/work"]
```

**Location**: `packages/sauve-chrome-extension/src/popup/jazz/features/collections.ts`

---

### `createCollection(name): Promise<void>`

UI-facing function that normalizes and creates via proxy mode.

```typescript
// In useCollectionCRUD hook
const { createCollection } = useCollectionCRUD(collections, onChange);

// User types "AI Research"
await createCollection("AI Research");
// Normalized to "labels:/ai-research" and created with hierarchy
```

**Location**: `packages/sauve-chrome-extension/src/popup/components/content/collections/hooks/useCollectionCRUD.ts`

---

## Service Worker Mutation

### `handleJazzMutate` - Collection Creation

Service worker routes label creation through `ensureLabelPath`.

```typescript
// background/jazz-message-handler.ts
case 'collection': {
  const normalizedName = data.name;

  if (getNamespace(normalizedName) === 'labels') {
    // Use ensureLabelPath for labels (creates hierarchy)
    const collection = await ensureLabelPath(root, normalizedName, me, {
      displayName: data.displayName,
      description: data.description,
      color: data.color,
      icon: data.icon,
    });

    // Index all created collections
    const collectionsToIndex = [
      LABELS_ROOT,
      ...getLabelAncestorNames(normalizedName),
      normalizedName,
    ];

    for (const collectionName of collectionsToIndex) {
      const entry = collectionsRecord?.[collectionName];
      if (entry) indexAddCollection(entry);
    }

    return { entityId, data: serialized };
  }

  // Standard collection creation for non-labels
  // ...
}
```

---

## Complete Flow Example

```typescript
// 1. User creates "ai/research" in Collections UI
//    ↓
// 2. useCollectionCRUD.createCollection("ai/research")
//    ↓
// 3. normalizeLabelCollectionName("ai/research")
//    → "labels:/ai/research"
//    ↓
// 4. optimisticUpdateManager.applyOptimistic('create', 'collection', data)
//    ↓
// 5. sendRuntimeMessage({ type: 'jazz:mutate', entityType: 'collection', ... })
//    ↓
// 6. Service Worker: ensureLabelPath(root, "labels:/ai/research", me, options)
//    ├─ Creates labels:/ (if missing)
//    ├─ Creates labels:/ai (if missing)
//    ├─ Creates labels:/ai/research
//    ├─ Adds labels:/ai to labels:/.children
//    └─ Adds labels:/ai/research to labels:/ai.children
//    ↓
// 7. Index all created collections
//    ↓
// 8. Broadcast update to all popups
```
