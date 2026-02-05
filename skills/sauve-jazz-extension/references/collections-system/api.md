# Collections System API

## Collection Detection

### `detectContentSource(content: PageContent): ContentSource`

Detects the original source of content.

```typescript
function detectContentSource(
  content: PageContent,
): "rss" | "bookmark" | "manual" | "import" {
  // Primary: Check sourceType field
  if (content.sourceType) {
    return content.sourceType;
  }

  // Fallback: Check collections
  const collections = getContentCollections(content);

  if (collections.some((c) => c.startsWith("rss:/"))) {
    return "rss";
  }
  if (collections.some((c) => c.startsWith("bookmarks:/"))) {
    return "bookmark";
  }

  return "manual";
}
```

**Usage:**

```typescript
const content = root.contentStore[urlHash];
const source = detectContentSource(content);
// → 'rss' | 'bookmark' | 'manual' | 'import'
```

---

### `isFromNamespace(content: PageContent, namespace: string): boolean`

Checks if content belongs to a specific namespace.

```typescript
function isFromNamespace(content: PageContent, namespace: string): boolean {
  const collections = getContentCollections(content);
  return collections.some((c) => c.startsWith(`${namespace}:/`));
}

// Usage
isFromNamespace(content, "rss"); // → true/false
isFromNamespace(content, "bookmarks"); // → true/false
```

---

### `getSourceCollection(content: PageContent): string | null`

Returns the primary source collection (rss:/ or bookmarks:/ entry).

```typescript
function getSourceCollection(content: PageContent): string | null {
  const collections = getContentCollections(content);

  // Prefer rss:/ collection
  const rssCollection = collections.find((c) => c.startsWith("rss:/"));
  if (rssCollection) return rssCollection;

  // Fall back to bookmarks:/
  const bookmarkCollection = collections.find((c) =>
    c.startsWith("bookmarks:/"),
  );
  if (bookmarkCollection) return bookmarkCollection;

  return null;
}
```

---

## Namespace Operations

### `getNamespaceCollections(root, namespaceKey): CollectionType[]`

Gets all collections in a namespace.

```typescript
import { getNamespaceCollections } from "#/lib/jazz/collection-access";

// Get all RSS feeds
const rssFeeds = getNamespaceCollections(root, "rss");
// → [rss:/example.com/feed, rss:/another.com/rss, ...]

// Get all bookmark folders
const bookmarkFolders = getNamespaceCollections(root, "bookmarks");
// → [bookmarks:/default, bookmarks:/work, ...]
```

---

### `getCollectionsByNamespace(): GroupedCollections`

Frontend function to get organized collections by namespace.

```typescript
import { getCollectionsByNamespace } from '#/popup/jazz/features/collections';

const { userCollections, namespaces } = await getCollectionsByNamespace();

// Result:
{
  userCollections: [
    { name: 'my-label', contentCount: 5 },
  ],
  namespaces: {
    rss: [
      { name: 'rss:/example.com', displayName: 'Example', contentCount: 10 },
    ],
    bookmarks: [
      { name: 'bookmarks:/default', displayName: 'Default', contentCount: 5, isDefault: true },
    ],
    topics: [...],
    'rss-group': [...],
    labels: [...],  // Hierarchical user labels
  }
}
```

---

## RSS Group Operations

### `createRSSGroup(root, name, account): Promise<CollectionType>`

Creates an RSS group collection.

```typescript
async function createRSSGroup(
  root: AppRootType,
  groupName: string, // "research" (without rss-group:/ prefix)
  account: any,
): Promise<CollectionType> {
  const fullName = `rss-group:/${groupName}`;

  return createCollection(root, fullName, account, {
    namespace: "rss-group",
    isSystem: false,
    metadata: {
      type: "user",
    },
  });
}
```

---

### `addFeedToGroup(root, groupName, feedCollectionName): void`

Adds an RSS feed to a group.

```typescript
import {
  setCollectionChildren,
  getCollectionChildren,
} from "#/lib/jazz/collection-access";

function addFeedToGroup(
  root: AppRootType,
  groupName: string, // "rss-group:/research"
  feedCollectionName: string, // "rss:/example.com/feed"
): void {
  const group = root.collections[groupName];
  if (!group) throw new Error(`Group not found: ${groupName}`);

  const children = getCollectionChildren(group);

  if (!children.includes(feedCollectionName)) {
    setCollectionChildren(root, groupName, [...children, feedCollectionName]);
  }
}

// Usage
addFeedToGroup(root, "rss-group:/research", "rss:/ai-blog.com/feed");
```

---

### `getFeedsInGroup(root, groupName): string[]`

Gets all RSS feeds in a group.

```typescript
function getFeedsInGroup(root: AppRootType, groupName: string): string[] {
  const group = root.collections[groupName];
  if (!group) return [];

  return getCollectionChildren(group);
}

// Usage
const feeds = getFeedsInGroup(root, "rss-group:/research");
// → ['rss:/ai-blog.com/feed', 'rss:/ml-news.com/rss']
```

---

### `getGroupItems(root, groupName): PlainReadingListItem[]`

Gets all content items from feeds in a group.

```typescript
async function getGroupItems(
  root: AppRootType,
  groupName: string,
): Promise<PlainReadingListItem[]> {
  const feedNames = getFeedsInGroup(root, groupName);
  const items: PlainReadingListItem[] = [];

  for (const feedName of feedNames) {
    const feedItems = await getItemsForCollection(feedName);
    items.push(...feedItems.readingListItems);
  }

  // Remove duplicates (same item might be in multiple feeds)
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.urlHash)) return false;
    seen.add(item.urlHash);
    return true;
  });
}
```

---

## Content Source Filtering

### `getRSSItems(root): PlainReadingListItem[]`

Gets all RSS items (from all feeds).

```typescript
function getRSSItems(root: AppRootType): PlainReadingListItem[] {
  const items: PlainReadingListItem[] = [];

  for (const [urlHash, content] of Object.entries(root.contentStore)) {
    if (content.sourceType === "rss") {
      items.push(pageContentToReadingListItem(content));
    }
  }

  return items.sort((a, b) => {
    const aTime = a.publishedAt || a.cachedAt || 0;
    const bTime = b.publishedAt || b.cachedAt || 0;
    return bTime - aTime;
  });
}
```

---

### `getBookmarkItems(root): PlainReadingListItem[]`

Gets all bookmark items.

```typescript
function getBookmarkItems(root: AppRootType): PlainReadingListItem[] {
  const items: PlainReadingListItem[] = [];

  for (const [urlHash, content] of Object.entries(root.contentStore)) {
    if (content.sourceType === "bookmark") {
      items.push(pageContentToReadingListItem(content));
    }
  }

  return items;
}
```

---

### `getItemsForCollection(collectionName): Promise<ReadingListResult>`

Gets all items in a specific collection.

```typescript
import { getItemsForCollection } from "#/popup/jazz/features/collections";

// Get items from RSS feed
const { readingListItems } = await getItemsForCollection(
  "rss:/example.com/feed",
);

// Get items from bookmark folder
const { readingListItems } = await getItemsForCollection("bookmarks:/work");

// Get items from user label
const { readingListItems } = await getItemsForCollection("labels:/ai");
```

**Implementation:**

```typescript
export async function getItemsForCollection(collectionName: string) {
  const collection = await getCollectionByName(collectionName);
  if (!collection) return { readingListItems: [] };

  const listCollectionKeys = (record: Record<string, any>): string[] =>
    Object.keys(record).filter(
      (key) =>
        key && key !== "_refs" && !key.startsWith("$") && !key.startsWith("_"),
    );

  const resolvedName = collection.name || collectionName;
  const collectionNames = isLabelCollection(resolvedName)
    ? listCollectionKeys(root.collections).filter(
        (name) => name === resolvedName || name.startsWith(`${resolvedName}/`),
      )
    : [resolvedName];

  const contentHashes = new Set<string>();
  for (const name of collectionNames) {
    const hashes = getContentForCollection(root, name);
    hashes.forEach((hash) => contentHashes.add(hash));
  }
  const items: PlainReadingListItem[] = [];

  for (const urlHash of contentHashes) {
    const content = root.contentStore[urlHash];
    if (content && !content.userDeletedAt) {
      items.push(pageContentToReadingListItem(content));
    }
  }

  return { readingListItems: items };
}
```

---

## Collection Metadata Access

### `getCollectionMetadata(collection): PlainCollectionMetadata`

Parses metadata from a collection.

```typescript
import { toPlainCollectionMetadata } from "#/popup/jazz/schemas/collection-metadata";

const collection = root.collections["rss:/example.com/feed"];
const metadata = toPlainCollectionMetadata(collection);

// RSS metadata:
// {
//   type: 'rss',
//   feedUrl: 'https://example.com/feed.xml',
//   feedEnabled: true,
//   lastFetchedAt: 1234567890,
// }
```

---

### `parseRssCollectionMetadata(metadataJson): RSSMetadata`

Parses RSS-specific metadata from JSON string.

```typescript
function parseRssCollectionMetadata(metadataJson?: string): RSSMetadata | null {
  if (!metadataJson) return null;

  try {
    return JSON.parse(metadataJson);
  } catch {
    return null;
  }
}

// Usage
const collection = root.collections["rss:/example.com/feed"];
const meta = parseRssCollectionMetadata(collection.metadataJson);
// → { type: 'rss', feedUrl: '...', feedEnabled: true, ... }
```

---

## Feed Metadata Resolution

### `getFeedMetadataForContent(collections, feedMetaMap)`

Gets feed metadata for a content item based on its RSS collections.

```typescript
function getFeedMetadataForContent(
  contentCollections: string[],
  feedMetaByCollection: Map<string, FeedMetadata>,
): FeedMetadata | null {
  // Find first RSS collection
  const rssCollection = contentCollections.find((c) => c.startsWith("rss:/"));

  if (!rssCollection) return null;

  return feedMetaByCollection.get(rssCollection) || null;
}

// Usage
const content = root.contentStore[urlHash];
const feedMeta = getFeedMetadataForContent(
  content.collectionNames,
  feedMetadataMap,
);
// → { feedId: 'rss:/example.com/feed', feedUrl: '...', feedTitle: '...' }
```

---

## Complete Flow: Displaying RSS Items with Feed Info

```typescript
async function displayRSSItemsWithFeedInfo() {
  // 1. Build feed metadata map
  const feedMetaByCollection = new Map();
  const rssCollections = getNamespaceCollections(root, "rss");

  for (const collection of rssCollections) {
    const metadata = parseRssCollectionMetadata(collection.metadataJson);
    if (metadata?.feedUrl) {
      feedMetaByCollection.set(collection.name, {
        feedId: collection.name,
        feedUrl: metadata.feedUrl,
        feedTitle: collection.displayName || collection.name,
      });
    }
  }

  // 2. Get all RSS items
  const items = getRSSItems(root);

  // 3. Enrich with feed info
  return items.map((item) => {
    const feedMeta = getFeedMetadataForContent(
      item.collectionNames,
      feedMetaByCollection,
    );

    return {
      ...item,
      feedTitle: feedMeta?.feedTitle || "Unknown Feed",
      feedUrl: feedMeta?.feedUrl,
    };
  });
}
```
