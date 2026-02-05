# Labels Management Gotchas

## Gotcha 1: Creating Labels Outside labels:/ Namespace

### Problem

User-created collections not in `labels:/` namespace don't sync properly and break hierarchy.

```typescript
// BAD: Creates flat collection without namespace
await createCollection(root, "ai-research", account, {});
// → Collection stored as "ai-research" (no hierarchy, no sync)

// GOOD: Normalizes to labels namespace
await createCollection(root, "labels:/ai-research", account, {});
// → Proper hierarchical structure
```

### Solution

Always normalize user input:

```typescript
// In UI layer (useCollectionCRUD)
const normalizedName = normalizeLabelCollectionName(userInput);
// "AI Research" → "labels:/ai-research"

// In service worker (createEntity)
if (getNamespace(normalizedName) === "labels") {
  await ensureLabelPath(root, normalizedName, account, options);
}
```

---

## Gotcha 2: Missing Children Arrays

### Problem

Creating a nested label without updating parent `children` breaks hierarchy display.

```typescript
// BAD: Manual creation without linking
const parent = Collection.create({ name: "labels:/ai", children: [] }, account);
const child = Collection.create({ name: "labels:/ai/research" }, account);
// Parent doesn't know about child!

// UI shows:
// ├─ ai (no expand arrow, appears empty)
```

### Solution

Use `ensureLabelPath` which handles linking:

```typescript
// GOOD: Automatic hierarchy management
await ensureLabelPath(root, "labels:/ai/research", account);

// Creates:
// 1. labels:/ai (if missing)
// 2. labels:/ai/research
// 3. Updates labels:/ai.children to include research
```

---

## Gotcha 3: Orphaned Children on Delete

### Problem

Deleting a parent label leaves children without proper hierarchy.

```typescript
// Delete labels:/ai (has child labels:/ai/research)
(root.collections as any).$jazz.delete("labels:/ai");

// Result:
// labels:/ai/research still exists
// But has no valid parent (labels:/ai is gone)
// Children array of deleted parent is lost
```

### Solution

Check for children before delete:

```typescript
async function deleteLabelSafe(root, labelName) {
  const collection = root.collections[labelName];
  const children = getCollectionChildren(collection);

  if (children.length > 0) {
    throw new Error(
      `Cannot delete "${labelName}" - it has ${children.length} ` +
        `sub-collection(s). Delete them first or move them.`,
    );
  }

  // Also check if any content uses this label
  const contentCount = collection.contentHashes?.length || 0;
  if (contentCount > 0) {
    // Either prevent or remove from content
  }

  // Safe to delete
  (root.collections as any).$jazz.delete(labelName);

  // Remove from parent's children
  const parent = getLabelParentName(labelName);
  if (parent && parent !== LABELS_ROOT) {
    const parentCollection = root.collections[parent];
    const siblings = getCollectionChildren(parentCollection);
    setCollectionChildren(
      root,
      parent,
      siblings.filter((c) => c !== labelName),
    );
  }
}
```

---

## Gotcha 4: Case Sensitivity in Normalization

### Problem

Different casing creates duplicate labels.

```typescript
// User creates:
normalizeLabelCollectionName("AI Research"); // → "labels:/ai-research"
normalizeLabelCollectionName("ai research"); // → "labels:/ai-research" (same!)
```

But in display:

```typescript
// Both map to same normalized name
// UI should show: "AI Research" (displayName)
// Not: "ai-research" (normalized)
```

### Solution

Preserve display name separately:

```typescript
await createCollection(root, "labels:/ai-research", account, {
  displayName: "AI Research", // Preserved user input
});

// In UI:
const display =
  collection.displayName || formatLabelForDisplay(collection.name);
```

---

## Gotcha 5: Race Conditions in Parallel Creation

### Problem

Creating multiple nested labels in parallel can cause duplicate parent creation.

```typescript
// Parallel creation
await Promise.all([
  ensureLabelPath(root, "labels:/ai/research", account),
  ensureLabelPath(root, "labels:/ai/implementation", account),
]);

// Possible result:
// Both try to create labels:/ai simultaneously
// One succeeds, one gets conflict
```

### Solution

Sequential creation or check-before-create:

```typescript
// Option 1: Sequential (safe)
await ensureLabelPath(root, "labels:/ai/research", account);
await ensureLabelPath(root, "labels:/ai/implementation", account);

// Option 2: Sequential reduce (for arrays)
const labels = ["labels:/ai/research", "labels:/ai/implementation"];
await labels.reduce(async (promise, label) => {
  await promise;
  await ensureLabelPath(root, label, account);
}, Promise.resolve());

// Option 3: Check exists (in ensureLabelPath implementation)
const existing = collectionsRecord?.[path];
if (!existing) {
  await createCollectionInternal(root, path, account, options);
}
```

---

## Gotcha 6: Stale Children Arrays After Rename

### Problem

Renaming a label doesn't update parent's `children` array references.

```typescript
// Initial:
// labels:/ai has children: ["labels:/ai/research"]

// Rename labels:/ai/research → labels:/ai/papers
await renameCollection(
  root,
  "labels:/ai/research",
  "labels:/ai/papers",
  account,
);

// Result:
// labels:/ai still has children: ["labels:/ai/research"] (stale!)
// New collection "labels:/ai/papers" exists but not in children
```

### Solution

Use `renameLabelWithCascade` or manual update:

```typescript
// Use cascade function that updates all references
await renameLabelWithCascade(
  root,
  "labels:/ai/research",
  "labels:/ai/papers",
  account,
  true, // cascade = true
);

// Or manual fix:
const parent = root.collections["labels:/ai"];
const children = getCollectionChildren(parent);
const updated = children.map((c) =>
  c === "labels:/ai/research" ? "labels:/ai/papers" : c,
);
setCollectionChildren(root, "labels:/ai", updated);
```

---

## Gotcha 7: Optimistic Updates Not Including Hierarchy

### Problem

Optimistic update only shows leaf collection, not created parents.

```typescript
// User creates "ai/research"
// Optimistic shows: labels:/ai/research
// But labels:/ai doesn't appear until server response

// UI shows incomplete tree until sync completes
```

### Solution

Include ancestors in optimistic data:

```typescript
const normalized = normalizeLabelCollectionName("ai/research");
const ancestors = getLabelAncestorNames(normalized);
// → ["labels:/ai"]

// Optimistic update includes all
const optimisticData = {
  ...normalized,
  // Also add parents to cached context
};

// Or trigger full reload after create
optimisticUpdateManager.setReloadCallback(async () => {
  await loadCollections(); // Full refresh
});
```

---

## Gotcha 8: Content Counts in Parent Collections

### Problem

Parent collections don't automatically aggregate child content counts.

```typescript
// Structure:
// labels:/ai has 0 contentHashes
// labels:/ai/research has 5 contentHashes

// UI shows:
// ├─ ai (0)        ← Misleading, should show 5
// │  └─ research (5)
```

### Solution

Calculate recursively:

```typescript
function getTotalContentCount(
  root: AppRootType,
  collectionName: string,
): number {
  const collection = root.collections[collectionName];
  if (!collection) return 0;

  // Direct content
  let count = collection.contentHashes?.length || 0;

  // Plus all descendants
  const children = getCollectionChildren(collection);
  for (const child of children) {
    count += getTotalContentCount(root, child);
  }

  return count;
}

// In UI:
const count = useMemo(
  () =>
    isExpanded
      ? collection.contentHashes?.length || 0
      : getTotalContentCount(root, collection.name),
  [collection, isExpanded],
);
```

---

## Gotcha 9: Path Parsing with Special Characters

### Problem

Label names with `/` or `:` break path parsing.

```typescript
// User wants label: "AI/ML Research"
normalizeLabelCollectionName("AI/ML Research");
// → "labels:/ai/ml-research" (split on /)
// But user expected: "labels:/ai-ml-research"
```

### Solution

Escape or normalize special characters:

```typescript
// Current behavior (accepts / as hierarchy)
"AI/Research" → "labels:/ai/research"  // Two levels

// If user wants literal slash (edge case):
// Must use escape sequence or different character
"AI-Research" → "labels:/ai-research"  // Single level with hyphen

// Document this behavior clearly in UI
```

---

## Gotcha 10: Broadcast Not Including All Created Collections

### Problem

Creating `labels:/ai/research` only broadcasts the leaf, not `labels:/ai`.

```typescript
// ensureLabelPath creates:
// - labels:/ai (parent)
// - labels:/ai/research (leaf)

// But broadcast only mentions leaf
broadcastUpdate(["root", "collections"], { _refresh: true });

// Other popups may not reload parent
```

### Solution

Index all created collections:

```typescript
// In jazz-message-handler.ts
case 'collection': {
  if (getNamespace(normalizedName) === 'labels') {
    const collection = await ensureLabelPath(root, normalizedName, me, options);

    // Index all created/updated collections
    const collectionsToIndex = [
      LABELS_ROOT,
      ...getLabelAncestorNames(normalizedName),
      normalizedName,
    ];

    for (const name of collectionsToIndex) {
      const entry = root.collections?.[name];
      if (entry) indexAddCollection(entry);
    }
  }
}
```

---

## Debugging Tips

### Check Collection Structure

```typescript
// Log full hierarchy
function logLabelHierarchy(root, name = LABELS_ROOT, depth = 0) {
  const collection = root.collections?.[name];
  if (!collection) return;

  const indent = "  ".repeat(depth);
  console.log(`${indent}${name} (${collection.contentHashes?.length || 0})`);

  const children = getCollectionChildren(collection);
  for (const child of children) {
    logLabelHierarchy(root, child, depth + 1);
  }
}

// Usage
logLabelHierarchy(root);
// labels:/ (0)
//   labels:/ai (0)
//     labels:/ai/research (5)
```

### Validate Children Arrays

```typescript
function validateLabelIntegrity(root) {
  const issues = [];

  for (const [name, collection] of Object.entries(root.collections)) {
    if (!isLabelCollection(name)) continue;

    const children = getCollectionChildren(collection);

    // Check all children exist
    for (const child of children) {
      if (!root.collections?.[child]) {
        issues.push(`${name} references missing child: ${child}`);
      }

      // Check parent back-reference
      const parent = getLabelParentName(child);
      if (parent !== name) {
        issues.push(`${child} has wrong parent: ${parent} (expected ${name})`);
      }
    }
  }

  return issues;
}
```
