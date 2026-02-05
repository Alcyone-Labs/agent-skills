# Labels Management Patterns

## Pattern 1: Creating Labels with Hierarchy

### Frontend: Collections Tab

```typescript
// useCollectionCRUD.ts
export function useCollectionCRUD(collections, onCollectionsChange) {
  const createCollection = async (collectionName: string) => {
    const trimmedName = collectionName.trim();
    if (!trimmedName) return;

    try {
      // 1. Normalize to labels:/ namespace
      const normalizedName = normalizeLabelCollectionName(trimmedName);
      // "ai/research" → "labels:/ai/research"

      // 2. Validate not in system-managed namespace
      validateCollectionCreation(normalizedName, false);

      // 3. Check for duplicates
      if (collections.some((c) => c.name === normalizedName)) {
        setError("Collection already exists");
        return;
      }

      // 4. Create via optimistic update
      if (isProxyMode()) {
        const result = await optimisticUpdateManager.applyOptimistic(
          "create",
          "collection",
          {
            name: normalizedName,
            displayName: trimmedName,
            isSystem: false,
            isNamespaceRoot: false,
          },
        );

        if (result.success) {
          await onCollectionsChange();
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return { createCollection };
}
```

### Service Worker: ensureLabelPath

```typescript
// jazz-message-handler.ts
case 'collection': {
  const normalizedName = data.name;

  // Route labels through ensureLabelPath
  if (getNamespace(normalizedName) === 'labels') {
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

    for (const name of collectionsToIndex) {
      const entry = root.collections?.[name];
      if (entry) indexAddCollection(entry);
    }

    return { entityId: collection.$jazz.id, data: serializeCoValue(collection) };
  }

  // ... standard collection creation
}
```

---

## Pattern 2: Assigning Labels to Content

### Modal Component

```typescript
// CollectionAssignmentDialog.tsx
export function CollectionAssignmentDialog({
  isOpen,
  onClose,
  onAssignCollections,
  currentCollections = [],
}) {
  const [selectedCollections, setSelectedCollections] = useState(currentCollections);

  const handleCreateNew = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    try {
      // Normalize to labels:/
      const normalized = normalizeLabelCollectionName(trimmed);

      // Add to selection
      setSelectedCollections([...selectedCollections, normalized]);
      setSearchQuery('');
    } catch {
      setError('Invalid collection format');
    }
  };

  const handleToggle = (collection: string) => {
    if (selectedCollections.includes(collection)) {
      setSelectedCollections(selectedCollections.filter(c => c !== collection));
    } else {
      setSelectedCollections([...selectedCollections, collection]);
    }
  };

  return (
    // ... JSX for collection selection
  );
}
```

### Bulk Assignment (Reading List Mutations)

```typescript
// Assigning to multiple items
async function assignCollectionsToItems(
  urlHashes: string[],
  collections: string[],
) {
  const { updateReadingListItemCollections } =
    await import("#/popup/jazz/features/reading-list-client");

  await Promise.all(
    urlHashes.map(async (urlHash) =>
      updateReadingListItemCollections(urlHash, collections),
    ),
  );
}

// For bookmarks by URL
async function assignBookmarkCollections(url: string, collections: string[]) {
  const { updateBookmarkCollections } =
    await import("#/popup/jazz/features/bookmarks");
  await updateBookmarkCollections(url, collections);
}
```

Service worker enforces hierarchy on write:
`updateReadingListItemCollections` → `addCollectionToContent` → `ensureLabelPath`.

---

## Pattern 3: Displaying Hierarchical Labels

### Tree View Component

```typescript
interface LabelNode {
  name: string;
  displayName: string;
  children: LabelNode[];
  contentCount: number;
}

function buildLabelTree(collections: CollectionType[]): LabelNode[] {
  const labelMap = new Map<string, LabelNode>();

  // First pass: create all nodes
  for (const collection of collections) {
    if (!isLabelCollection(collection.name)) continue;

    labelMap.set(collection.name, {
      name: collection.name,
      displayName: collection.displayName || getLabelDisplayName(collection.name),
      children: [],
      contentCount: collection.contentHashes?.length || 0,
    });
  }

  // Second pass: build tree structure
  const roots: LabelNode[] = [];

  for (const [name, node] of labelMap) {
    const parentName = getLabelParentName(name);

    if (parentName === LABELS_ROOT || !parentName) {
      roots.push(node);
    } else {
      const parent = labelMap.get(parentName);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  return roots;
}

// Usage
function LabelTree({ collections }) {
  const tree = useMemo(() => buildLabelTree(collections), [collections]);

  return (
    <ul>
      {tree.map(node => (
        <LabelTreeItem key={node.name} node={node} />
      ))}
    </ul>
  );
}
```

### Collection Items View (Parent Labels)

```typescript
// Parent labels aggregate descendants
const { readingListItems } = await getItemsForCollection("labels:/ai");
// Includes items tagged with labels:/ai and labels:/ai/**
```

---

## Pattern 4: Filtering by Labels

### Search DSL

```typescript
// User types: has:ai/research
// Parsed to: { type: 'has', value: 'labels:/ai/research' }

function matchesLabelFilter(content: PageContent, labelName: string): boolean {
  const collections = getContentCollections(content);

  // Exact match
  if (collections.includes(labelName)) return true;

  // Parent match (labels:/ai matches content with labels:/ai/research)
  for (const collection of collections) {
    if (collection.startsWith(labelName + "/")) return true;
  }

  return false;
}
```

### Label Picker with Search

```typescript
function LabelPicker({ availableLabels, selected, onChange }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const normalized = normalizeCollection(search.toLowerCase());
    return availableLabels.filter(label =>
      label.toLowerCase().includes(normalized) ||
      getLabelDisplayName(label).toLowerCase().includes(search.toLowerCase())
    );
  }, [availableLabels, search]);

  return (
    // ... render filtered labels
  );
}
```

---

## Pattern 5: Renaming Labels

### With Cascade

```typescript
async function renameLabel(oldName: string, newName: string) {
  const normalizedOld = normalizeLabelCollectionName(oldName);
  const normalizedNew = normalizeLabelCollectionName(newName);

  // Use cascade rename for labels
  await renameLabelWithCascade(
    root,
    normalizedOld,
    normalizedNew,
    account,
    true, // cascade = true
  );

  // Effects:
  // 1. Renames labels:/ai to labels:/machine-learning
  // 2. Renames labels:/ai/research to labels:/machine-learning/research
  // 3. Updates all content.collectionNames references
  // 4. Updates all parent.children arrays
}
```

---

## Pattern 6: Deleting Labels

### Safety Check

```typescript
async function deleteLabel(labelName: string) {
  const collection = root.collections[labelName];

  // Check for children
  const children = getCollectionChildren(collection);
  if (children.length > 0) {
    throw new Error(
      `Cannot delete "${labelName}" - it has ${children.length} sub-collections. ` +
        "Move or delete them first.",
    );
  }

  // Check for content
  const contentCount = collection.contentHashes?.length || 0;
  if (contentCount > 0) {
    // Option 1: Prevent deletion
    throw new Error(`Cannot delete - ${contentCount} items use this label`);

    // Option 2: Remove label from all content
    for (const urlHash of collection.contentHashes) {
      await removeCollectionFromContent(root, urlHash, labelName);
    }
  }

  // Remove from parent.children
  const parentName = getLabelParentName(labelName);
  if (parentName) {
    const parent = root.collections[parentName];
    const parentChildren = getCollectionChildren(parent);
    const filtered = parentChildren.filter((c) => c !== labelName);
    setCollectionChildren(root, parentName, filtered);
  }

  // Delete the collection
  (root.collections as any).$jazz.delete(labelName);
}
```

---

## Pattern 7: Sync State for Labels

### Loading Indicator

```typescript
function useLabelSyncState() {
  const [state, setState] = useState(syncStateManager.getState());

  useEffect(() => {
    return syncStateManager.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  const isLoading = state.collections.phase === 'loadingIndex' ||
                    state.collections.phase === 'loadingPage';

  const progress = state.collections.total
    ? Math.round((state.collections.loaded / state.collections.total) * 100)
    : 0;

  return { isLoading, progress, phase: state.collections.phase };
}

// Usage
function CollectionsView() {
  const { isLoading, progress } = useLabelSyncState();

  if (isLoading) {
    return <ProgressBar value={progress} />;
  }

  return <CollectionsList />;
}
```
