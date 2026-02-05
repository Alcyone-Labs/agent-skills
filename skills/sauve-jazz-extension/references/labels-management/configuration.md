# Labels Configuration

## Schema Types

### Collection Schema

Labels use the same `Collection` schema as all other collections.

```typescript
// packages/sauve-chrome-extension/src/popup/jazz/schemas/collection.ts
export const Collection = co.map({
  // Identity
  name: z.string(), // "labels:/ai/research"
  displayName: z.string().optional(), // "AI Research"

  // Namespace
  namespace: z.string().optional(), // "labels" for all labels
  isSystem: z.boolean().optional(), // false for user labels
  isNamespaceRoot: z.boolean().optional(), // true only for labels:/

  // Hierarchy - CRITICAL for labels
  children: z.array(z.string()).optional(),
  // e.g., labels:/ai has children: ["labels:/ai/research"]

  // Content
  contentHashes: co.list(z.string()),
  // Bidirectional: which content items have this label

  // Metadata
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});
```

### Collection Record

All collections are stored in a record keyed by name.

```typescript
export const CollectionRecord = co.record(z.string(), Collection);

// Structure in AppRoot:
{
  collections: {
    "labels:/": { name: "labels:/", isNamespaceRoot: true, children: ["labels:/ai"], ... },
    "labels:/ai": { name: "labels:/ai", children: ["labels:/ai/research"], ... },
    "labels:/ai/research": { name: "labels:/ai/research", children: [], ... },
  }
}
```

### PageContent Labels

Content references labels via `collectionNames`.

```typescript
export const PageContent = co.map({
  urlHash: z.string(),
  url: z.string(),
  title: z.string().optional(),
  markdown: z.string(),

  // Labels assigned to this content
  collectionNames: z.array(z.string()).optional(),
  // e.g., ["labels:/ai/research", "labels:/work"]

  // ... other fields
});
```

---

## Namespace Configuration

Labels are defined in `reserved-namespaces.ts` as user-managed.

```typescript
// packages/sauve-chrome-extension/src/popup/jazz/schemas/reserved-namespaces.ts
export const RESERVED_NAMESPACES = {
  // ... other namespaces

  labels: {
    pattern: /^labels:\/\/.*/,
    rootLabel: "labels:/",
    description: "User labels with hierarchical organization",
    example: "labels:/ai/research",
    systemManaged: false, // ← Users can create/modify
  },
};
```

**Key difference**:

- `systemManaged: true` (rss:, topics:) - Extension creates, users cannot
- `systemManaged: false` (labels:, bookmarks:, notes:) - Users can create freely

---

## Label-Specific Constants

```typescript
// packages/sauve-chrome-extension/src/lib/jazz/namespaces/labels.ts
export const LABELS_NAMESPACE = "labels";
export const LABELS_ROOT = "labels:/";
export const DEFAULT_LABEL_COLLECTION = "labels:/default";
```

---

## Hierarchy Rules

### Parent-Child Relationships

```typescript
// labels:/ (root)
{
  name: 'labels:/',
  isNamespaceRoot: true,
  children: ['labels:/ai', 'labels:/work', 'labels:/personal'],
  // Root tracks all top-level labels
}

// labels:/ai (intermediate)
{
  name: 'labels:/ai',
  children: ['labels:/ai/research', 'labels:/ai/implementation'],
  // Parent tracks its children
}

// labels:/ai/research (leaf)
{
  name: 'labels:/ai/research',
  children: [],  // Or undefined
  // Leaf has no children (yet)
}
```

### Path Resolution

```typescript
// Path parsing
parseCollectionName("labels:/ai/research");
// → {
//   namespaceKey: 'labels',
//   segments: ['ai', 'research'],
//   isRoot: false,
//   isNamespaced: true
// }

// Path normalization
normalizeCollectionName("AI/Research Papers");
// → 'labels:/ai/research-papers'
```

---

## Data Model Relationships

### Content → Labels (Many-to-Many)

```
PageContent (contentStore record)
├─ urlHash: "abc123"
├─ title: "Transformer Architecture"
└─ collectionNames: ["labels:/ai/research", "labels:/important"]

Collection (labels:/ai/research)
├─ name: "labels:/ai/research"
└─ contentHashes: ["abc123", "def456", ...]
```

### Label Hierarchy (Tree)

```
labels:/                    [root, children: [ai, work]]
├─ labels:/ai               [children: [research]]
│  └─ labels:/ai/research   [children: []]
└─ labels:/work             [children: []]
```

---

## Sync Configuration

Labels sync through the standard Jazz protocol:

```typescript
// Subscriptions automatically include labels
const response = await queryServiceWorker(["root", "collections"], {
  $each: {
    name: true,
    children: true, // Load children for hierarchy
    contentHashes: { $each: true },
    displayName: true,
    color: true,
  },
});
```

### Broadcast Path

Labels are broadcast on the `collections` path:

```typescript
// Service worker subscription
me.root.collections.$jazz.subscribe(() => {
  scheduleBroadcast("collections");
});

// Popup receives
port.onMessage.addListener((msg) => {
  if (
    msg.type === "jazz:dataUpdated" &&
    msg.changedPaths.includes("collections")
  ) {
    // Reload labels
  }
});
```

---

## Validation Rules

### Collection Name Validation

```typescript
validateCollectionCreation("labels:/ai/research", false);
// → OK (labels is user-managed)

validateCollectionCreation("rss:/example.com", false);
// → ERROR: Cannot create in system-managed namespace
```

### Display Name Defaults

```typescript
// If no displayName provided, derive from path
const displayName = getCollectionDisplayName({ name: "labels:/ai/research" });
// → "Ai/research" (formatted)
```

---

## Migration Considerations

### Schema Version History

- **v12**: Labels stored in separate `labels` array
- **v13+**: Labels unified into `collections` record with `labels:/` namespace
- **v14**: Added `children` field for hierarchy
- **v15+**: Full hierarchical support with `ensureLabelPath`

### Migration Pattern

```typescript
async function migrateV14ToV15(account, root) {
  // Old: Flat labels without hierarchy
  // New: Hierarchical labels with children arrays

  for (const [name, collection] of Object.entries(root.collections)) {
    if (isLabelCollection(name) && !collection.children) {
      // Initialize children array
      collection.$jazz.set("children", []);
    }
  }
}
```
