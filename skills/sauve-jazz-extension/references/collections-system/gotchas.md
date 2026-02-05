# Collections System Gotchas

## Gotcha 1: sourceType Not Set on Existing Content

### Problem

Content created before v13 may not have `sourceType` field, causing source detection to fail.

```typescript
// Old content
{
  urlHash: "abc123",
  title: "Old Article",
  // Missing sourceType!
  collectionNames: ["rss:/example.com/feed"]
}

// Detection fails
detectContentSource(content); // → 'manual' (fallback)
```

### Solution

Use fallback detection via collections:

```typescript
function detectContentSourceSafe(content: PageContent): ContentSource {
  // Primary: Check sourceType
  if (content.sourceType) {
    return content.sourceType;
  }

  // Fallback 1: Check collections
  const collections = getContentCollections(content);
  if (collections.some((c) => c.startsWith("rss:/"))) return "rss";
  if (collections.some((c) => c.startsWith("bookmarks:/"))) return "bookmark";

  // Fallback 2: Check for sourceUrl (RSS-only field)
  if (content.sourceUrl) return "rss";

  return "manual";
}
```

### Migration

```typescript
// Repair migration to set sourceType
async function migrateSetSourceType(root) {
  for (const [urlHash, content] of Object.entries(root.contentStore)) {
    if (!content.sourceType) {
      const detected = detectContentSourceSafe(content);
      content.$jazz.set("sourceType", detected);
    }
  }
}
```

---

## Gotcha 2: RSS Groups Don't Own Content

### Problem

Querying `rss-group:/research.contentHashes` returns empty array.

```typescript
const group = root.collections["rss-group:/research"];
console.log(group.contentHashes); // → [] (empty!)

// But group has children feeds
console.log(group.children); // → ['rss:/feed1', 'rss:/feed2']
```

### Solution

RSS groups aggregate content from children, don't own it:

```typescript
function getRSSGroupContentHashes(root, groupName: string): string[] {
  const group = root.collections[groupName];
  if (!group) return [];

  const feedNames = getCollectionChildren(group);
  const allHashes = new Set<string>();

  for (const feedName of feedNames) {
    const feed = root.collections[feedName];
    if (feed?.contentHashes) {
      for (const hash of feed.contentHashes) {
        allHashes.add(hash);
      }
    }
  }

  return Array.from(allHashes);
}

// Usage
const hashes = getRSSGroupContentHashes(root, "rss-group:/research");
```

---

## Gotcha 3: Duplicate Content from Multiple Feeds

### Problem

Same article appears in multiple RSS feeds, creating duplicates.

```typescript
// Article in feed1
{
  urlHash: "abc123",
  collectionNames: ["rss:/feed1"]
}

// Same article in feed2
{
  urlHash: "abc123",
  collectionNames: ["rss:/feed1", "rss:/feed2"]  // Merged!
}

// Group containing both feeds shows duplicate
const groupItems = getRSSGroupItems('rss-group:/tech');
// → [article, article] (duplicate!)
```

### Solution

Deduplicate when aggregating:

```typescript
function getRSSGroupItems(root, groupName: string) {
  const feedNames = getFeedsInGroup(root, groupName);
  const seen = new Set<string>();
  const items: PlainReadingListItem[] = [];

  for (const feedName of feedNames) {
    const feedItems = getItemsForCollection(feedName);

    for (const item of feedItems) {
      if (!seen.has(item.urlHash)) {
        seen.add(item.urlHash);
        items.push(item);
      }
    }
  }

  return items;
}
```

---

## Gotcha 4: Missing Namespace Roots

### Problem

Old accounts may not have namespace root collections (e.g., `rss:/`), breaking enumeration.

```typescript
// Try to get RSS feeds
const rssFeeds = getNamespaceCollections(root, "rss");
// → [] (empty because rss:/ root doesn't exist!)
```

### Solution

Initialize missing roots on startup:

```typescript
async function ensureNamespaceRoots(root, account) {
  for (const [key, config] of Object.entries(RESERVED_NAMESPACES)) {
    if (config.rootLabel && !root.collections?.[config.rootLabel]) {
      await createCollection(
        root,
        config.rootLabel,
        account,
        {
          namespace: key,
          isSystem: true,
          isNamespaceRoot: true,
        },
        true, // isSystemCall
      );
    }
  }
}

// Call on account initialization
await ensureNamespaceRoots(root, account);
```

---

## Gotcha 5: Feed Metadata Not Parsed

### Problem

`metadataJson` is a string, not an object. Direct access fails.

```typescript
const collection = root.collections["rss:/example.com/feed"];
console.log(collection.metadataJson.feedUrl);
// → undefined (it's a JSON string!)
```

### Solution

Always parse metadataJson:

```typescript
function parseRssCollectionMetadata(metadataJson?: string) {
  if (!metadataJson) return null;
  try {
    return JSON.parse(metadataJson);
  } catch {
    return null;
  }
}

// Usage
const metadata = parseRssCollectionMetadata(collection.metadataJson);
console.log(metadata?.feedUrl); // → "https://example.com/feed.xml"
```

---

## Gotcha 6: Content Without Collections

### Problem

Content may exist without any collections (orphaned during migration).

```typescript
// Orphaned content
{
  urlHash: "abc123",
  title: "Orphan Article",
  collectionNames: []  // Empty!
}

// Won't appear in any collection view
```

### Solution

Repair orphaned content:

```typescript
async function repairOrphanedContent(root, account) {
  for (const [urlHash, content] of Object.entries(root.contentStore)) {
    const collections = getContentCollections(content);

    if (collections.length === 0) {
      // Assign to default based on sourceType
      if (content.sourceType === "rss") {
        await addCollectionToContent(
          root,
          urlHash,
          "rss:/unknown-feed",
          account,
        );
      } else if (content.sourceType === "bookmark") {
        await addCollectionToContent(
          root,
          urlHash,
          "bookmarks:/orphaned",
          account,
        );
      }
    }
  }
}
```

---

## Gotcha 7: sourceUrl vs url Confusion

### Problem

Mixing up `sourceUrl` (feed URL) with `url` (content URL).

```typescript
// Wrong: Using sourceUrl as link
<a href={content.sourceUrl}>{content.title}</a>
// → Links to feed, not article!

// Correct
<a href={content.url}>{content.title}</a>
// → Links to actual article
```

### Field Reference

| Field         | Purpose                       | Example                        |
| ------------- | ----------------------------- | ------------------------------ |
| `url`         | Content URL (link to article) | `https://example.com/article`  |
| `sourceUrl`   | Feed URL (RSS only)           | `https://example.com/feed.xml` |
| `sourceTitle` | Feed name (RSS only)          | "Example Blog"                 |

---

## Gotcha 8: Collection Names Not Normalized

### Problem

User input creates collections with inconsistent casing.

```typescript
// User creates
await createCollection(root, "AI-Research", account, {}); // Uppercase
await createCollection(root, "ai-research", account, {}); // Lowercase

// Creates TWO different collections!
```

### Solution

Always normalize before creation:

```typescript
async function createCollectionSafe(root, name: string, account, options) {
  const normalized = normalizeCollectionName(name);

  // Check for existing (case-insensitive)
  const existing = Object.keys(root.collections || {}).find(
    (key) => key.toLowerCase() === normalized.toLowerCase(),
  );

  if (existing) {
    throw new Error(`Collection already exists: ${existing}`);
  }

  return createCollection(root, normalized, account, options);
}
```

---

## Gotcha 9: Reading Group Children as Content

### Problem

Trying to iterate `rss-group:/name.contentHashes` directly instead of aggregating from children.

```typescript
// Wrong
const group = root.collections["rss-group:/research"];
for (const urlHash of group.contentHashes) {
  // group.contentHashes is empty!
}

// Correct
const feedNames = getCollectionChildren(group);
for (const feedName of feedNames) {
  const feed = root.collections[feedName];
  for (const urlHash of feed.contentHashes || []) {
    const content = root.contentStore[urlHash];
    // Process content
  }
}
```

---

## Gotcha 10: Topics vs Labels Confusion

### Problem

Mixing up `topics:/` (IPTC system-managed) with user labels.

```typescript
// topics:/ are system-managed IPTC classifications
// - Created by AI classification
// - Users cannot create/modify
// - 1392 standardized topics

// labels:/ are user-managed
// - Created by users
// - Fully user-controlled
// - Can be hierarchical
```

### Correct Usage

```typescript
// Check if collection is a topic
function isTopicCollection(name: string): boolean {
  return name.startsWith('topics:/');
}

// Check if collection is a user label
function isUserLabel(name: string): boolean {
  return name.startsWith('labels:/');
}

// Display topics differently (read-only badge)
function CollectionBadge({ name }) {
  if (isTopicCollection(name)) {
    return <TopicBadge name={name} readOnly />;
  }
  if (isUserLabel(name)) {
    return <UserLabelBadge name={name} editable />;
  }
  return <CollectionBadge name={name} />;
}
```

---

## Debugging Collections

### Log All Collections by Namespace

```typescript
function logCollectionsByNamespace(root) {
  const byNamespace: Record<string, string[]> = {};

  for (const key of Object.keys(root.collections || {})) {
    if (key.startsWith("$") || key === "_refs") continue;

    const ns = getNamespace(key) || "user";
    if (!byNamespace[ns]) byNamespace[ns] = [];
    byNamespace[ns].push(key);
  }

  for (const [ns, collections] of Object.entries(byNamespace)) {
    console.log(`\n${ns}:/ (${collections.length}):`);
    for (const name of collections) {
      const col = root.collections[name];
      console.log(`  ${name} (${col.contentHashes?.length || 0} items)`);
    }
  }
}
```

### Validate Collection Integrity

```typescript
function validateCollections(root) {
  const issues: string[] = [];

  for (const [name, collection] of Object.entries(root.collections)) {
    if (name.startsWith("$") || name === "_refs") continue;

    // Check namespace matches
    const ns = getNamespace(name);
    if (ns && collection.namespace !== ns) {
      issues.push(
        `${name}: namespace mismatch (${collection.namespace} vs ${ns})`,
      );
    }

    // Check contentHashes exist
    for (const hash of collection.contentHashes || []) {
      if (!root.contentStore?.[hash]) {
        issues.push(`${name}: missing content ${hash}`);
      }
    }

    // Check children exist (for hierarchical)
    for (const child of collection.children || []) {
      if (!root.collections?.[child]) {
        issues.push(`${name}: missing child ${child}`);
      }
    }
  }

  return issues;
}
```
