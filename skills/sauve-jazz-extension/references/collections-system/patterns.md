# Collections System Patterns

## Pattern 1: Source-Aware Content Display

### RSS Feed View

Display items grouped by feed with metadata:

```typescript
async function getRSSFeedView(): Promise<FeedGroup[]> {
  // 1. Build feed metadata map
  const feedMetaMap = new Map<string, FeedMetadata>();
  const rssCollections = getNamespaceCollections(root, "rss");

  for (const collection of rssCollections) {
    const metadata = parseRssCollectionMetadata(collection.metadataJson);
    if (metadata?.feedUrl) {
      feedMetaMap.set(collection.name, {
        feedId: collection.name,
        feedUrl: metadata.feedUrl,
        feedTitle: collection.displayName || collection.name,
        lastFetchedAt: metadata.lastFetchedAt,
      });
    }
  }

  // 2. Group items by feed
  const itemsByFeed = new Map<string, PlainReadingListItem[]>();

  for (const content of Object.values(root.contentStore)) {
    if (content.sourceType !== "rss") continue;

    const collections = getContentCollections(content);
    const rssCollection = collections.find((c) => c.startsWith("rss:/"));

    if (rssCollection && feedMetaMap.has(rssCollection)) {
      if (!itemsByFeed.has(rssCollection)) {
        itemsByFeed.set(rssCollection, []);
      }
      itemsByFeed
        .get(rssCollection)!
        .push(pageContentToReadingListItem(content));
    }
  }

  // 3. Build feed groups
  return Array.from(itemsByFeed.entries()).map(([feedName, items]) => ({
    ...feedMetaMap.get(feedName)!,
    items: items.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)),
  }));
}
```

---

## Pattern 2: Unified Inbox

### Show All Sources Together

```typescript
async function getUnifiedInbox(): Promise<InboxItem[]> {
  const items: InboxItem[] = [];

  for (const [urlHash, content] of Object.entries(root.contentStore)) {
    // Skip deleted
    if (content.userDeletedAt) continue;

    // Get source info
    const sourceType = content.sourceType || "manual";
    const collections = getContentCollections(content);

    // Get source collection name
    const sourceCollection =
      collections.find((c) => c.startsWith("rss:/")) ||
      collections.find((c) => c.startsWith("bookmarks:/")) ||
      "manual";

    // Get source display name
    let sourceName: string;
    if (sourceType === "rss") {
      const feed = root.collections[sourceCollection];
      sourceName = feed?.displayName || sourceCollection;
    } else if (sourceType === "bookmark") {
      sourceName = "Bookmark";
    } else {
      sourceName = "Added manually";
    }

    items.push({
      ...pageContentToReadingListItem(content),
      sourceType,
      sourceName,
    });
  }

  // Sort by date (newest first)
  return items.sort((a, b) => {
    const aTime = a.publishedAt || a.cachedAt || 0;
    const bTime = b.publishedAt || b.cachedAt || 0;
    return bTime - aTime;
  });
}
```

---

## Pattern 3: RSS Group Management

### Create and Populate RSS Group

```typescript
async function createAndPopulateRSSGroup(
  groupName: string,
  feedUrls: string[],
): Promise<void> {
  const fullGroupName = `rss-group:/${groupName}`;

  // 1. Create group collection
  await createCollection(root, fullGroupName, account, {
    namespace: "rss-group",
    isSystem: false,
    displayName: groupName,
  });

  // 2. Resolve feed URLs to collection names
  const feedCollectionNames: string[] = [];

  for (const url of feedUrls) {
    // Find or create RSS feed collection
    const collectionName = buildRssCollectionNameFromUrl(url);
    feedCollectionNames.push(collectionName);

    // Ensure feed exists (will create if new)
    if (!root.collections?.[collectionName]) {
      await addRSSFeed(url); // Creates rss:/ collection
    }
  }

  // 3. Add feeds as children
  setCollectionChildren(root, fullGroupName, feedCollectionNames);
}

// Usage
createAndPopulateRSSGroup("ai-research", [
  "https://ai-blog.com/feed.xml",
  "https://ml-news.com/rss",
  "https://arxiv.org/rss/cs.AI",
]);
```

### Display Group with Aggregated Items

```typescript
async function getRSSGroupItems(groupName: string): Promise<{
  groupInfo: GroupInfo;
  items: PlainReadingListItem[];
}> {
  const group = root.collections[groupName];
  if (!group) throw new Error("Group not found");

  const feedNames = getCollectionChildren(group);
  const items: PlainReadingListItem[] = [];
  const errors: string[] = [];

  // Collect items from all feeds
  for (const feedName of feedNames) {
    const feed = root.collections[feedName];
    if (!feed) {
      errors.push(`Feed not found: ${feedName}`);
      continue;
    }

    const hashes = feed.contentHashes || [];
    for (const urlHash of hashes) {
      const content = root.contentStore[urlHash];
      if (content && !content.userDeletedAt) {
        items.push(pageContentToReadingListItem(content));
      }
    }
  }

  // Remove duplicates and sort
  const seen = new Set<string>();
  const uniqueItems = items
    .filter((item) => {
      if (seen.has(item.urlHash)) return false;
      seen.add(item.urlHash);
      return true;
    })
    .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

  return {
    groupInfo: {
      name: groupName,
      displayName: group.displayName || groupName,
      feedCount: feedNames.length,
      itemCount: uniqueItems.length,
      errors,
    },
    items: uniqueItems,
  };
}
```

---

## Pattern 4: Cross-Source Labeling

### Add Label to RSS Item

```typescript
async function labelRSSItem(urlHash: string, labelName: string): Promise<void> {
  const content = root.contentStore[urlHash];
  if (!content) throw new Error("Content not found");

  // Verify it's an RSS item
  if (content.sourceType !== "rss") {
    throw new Error("Can only label RSS items");
  }

  // Normalize label
  const normalizedLabel = normalizeLabelCollectionName(labelName);

  // Add collection to content
  await addCollectionToContent(root, urlHash, normalizedLabel, account);

  // Item now has BOTH rss:/ and labels:/ collections
  // {
  //   collectionNames: [
  //     "rss:/example.com/feed",
  //     "labels:/ai"
  //   ]
  // }
}
```

### Find All Items by Label (Regardless of Source)

```typescript
async function getItemsByLabel(
  labelName: string,
): Promise<PlainReadingListItem[]> {
  const normalizedLabel = normalizeLabelCollectionName(labelName);
  const labelNames = Object.keys(root.collections || {})
    .filter((name) => name && !name.startsWith("$") && name !== "_refs")
    .filter(
      (name) =>
        name === normalizedLabel || name.startsWith(`${normalizedLabel}/`),
    );

  const contentHashes = new Set<string>();
  for (const name of labelNames) {
    const label = root.collections[name];
    if (!label) continue;
    for (const urlHash of label.contentHashes || []) {
      contentHashes.add(urlHash);
    }
  }

  const items: PlainReadingListItem[] = [];
  for (const urlHash of contentHashes) {
    const content = root.contentStore[urlHash];
    if (!content || content.userDeletedAt) continue;

    items.push({
      ...pageContentToReadingListItem(content),
      sourceType: content.sourceType,
      sourceName: getSourceDisplayName(content),
    });
  }

  return items;
}

function getSourceDisplayName(content: PageContent): string {
  const collections = getContentCollections(content);

  const rssCollection = collections.find((c) => c.startsWith("rss:/"));
  if (rssCollection) {
    const feed = root.collections[rssCollection];
    return feed?.displayName || "RSS";
  }

  const bookmarkCollection = collections.find((c) =>
    c.startsWith("bookmarks:/"),
  );
  if (bookmarkCollection) {
    return "Bookmark";
  }

  return "Manual";
}
```

---

## Pattern 5: Source-Specific Actions

### Different Actions Based on Source

```typescript
function getItemActions(content: PageContent): Action[] {
  const actions: Action[] = [];
  const sourceType = content.sourceType;

  // Common actions (all sources)
  actions.push(
    { type: 'read', label: 'Mark as read' },
    { type: 'star', label: 'Star' },
    { type: 'archive', label: 'Archive' },
    { type: 'label', label: 'Add label' },
  );

  // Source-specific actions
  if (sourceType === 'rss') {
    actions.push(
      { type: 'open-feed', label: 'View in feed' },
      { type: 'unsubscribe', label: 'Unsubscribe' },
    );
  } else if (sourceType === 'bookmark') {
    actions.push(
      { type: 'edit-bookmark', label: 'Edit bookmark' },
      { type: 'remove-bookmark', label: 'Remove bookmark' },
    );
  }

  return actions;
}

// Usage in component
function ItemCard({ content }) {
  const actions = useMemo(() => getItemActions(content), [content]);

  return (
    <Card>
      <SourceBadge sourceType={content.sourceType} />
      <Title>{content.title}</Title>
      <ActionMenu actions={actions} onAction={handleAction} />
    </Card>
  );
}
```

---

## Pattern 6: Feed Status Dashboard

### Show Feed Health

```typescript
interface FeedStatus {
  feedName: string;
  feedUrl: string;
  feedEnabled: boolean;
  lastFetchedAt: number | null;
  errorCount: number;
  lastError: string | null;
  itemCount: number;
  unreadCount: number;
}

async function getFeedStatusDashboard(): Promise<FeedStatus[]> {
  const rssCollections = getNamespaceCollections(root, "rss");
  const statusList: FeedStatus[] = [];

  for (const collection of rssCollections) {
    const metadata = parseRssCollectionMetadata(collection.metadataJson);
    if (!metadata) continue;

    const contentHashes = collection.contentHashes || [];
    const items = contentHashes
      .map((hash) => root.contentStore[hash])
      .filter(Boolean);

    const unreadCount = items.filter(
      (item) => !item.userReadAt && !item.userDeletedAt,
    ).length;

    statusList.push({
      feedName: collection.name,
      feedUrl: metadata.feedUrl,
      feedEnabled: metadata.feedEnabled,
      lastFetchedAt: metadata.lastFetchedAt || null,
      errorCount: metadata.errorCount || 0,
      lastError: metadata.lastError || null,
      itemCount: items.length,
      unreadCount,
    });
  }

  return statusList.sort((a, b) => b.unreadCount - a.unreadCount);
}
```

---

## Pattern 7: Import with Source Preservation

### Import Bookmarks with Metadata

```typescript
interface ImportBookmark {
  url: string;
  title: string;
  addedAt: number;
  folder?: string;
  tags?: string[];
}

async function importBookmarks(
  bookmarks: ImportBookmark[],
): Promise<ImportResult> {
  const results = { created: 0, merged: 0, errors: 0 };

  for (const bookmark of bookmarks) {
    try {
      const urlHash = await hashUrl(bookmark.url);
      const existing = root.contentStore[urlHash];

      if (existing) {
        // Merge with existing
        const collections = new Set(getContentCollections(existing));
        collections.add("bookmarks:/default");

        if (bookmark.folder) {
          collections.add(`bookmarks:/${normalizeSegment(bookmark.folder)}`);
        }

        existing.$jazz.set("collectionNames", Array.from(collections));

        // Update source type if not set
        if (!existing.sourceType) {
          existing.$jazz.set("sourceType", "bookmark");
        }

        results.merged++;
      } else {
        // Create new
        const collections = ["bookmarks:/default"];

        if (bookmark.folder) {
          collections.push(`bookmarks:/${normalizeSegment(bookmark.folder)}`);
        }

        const content = PageContent.create(
          {
            urlHash,
            url: bookmark.url,
            title: bookmark.title,
            markdown: "", // Will be extracted later
            sourceType: "import",
            collectionNames: collections,
            createdAt: bookmark.addedAt,
            extractedAt: Date.now(),
            cachedAt: Date.now(),
          },
          account,
        );

        root.contentStore.$jazz.set(urlHash, content);
        results.created++;
      }
    } catch (error) {
      console.error("Failed to import bookmark:", bookmark.url, error);
      results.errors++;
    }
  }

  return results;
}
```

---

## Pattern 8: Source Filtering in Search

### Filter by Source Type

```typescript
interface SearchFilters {
  sources?: ("rss" | "bookmark" | "manual" | "import")[];
  feeds?: string[]; // Specific RSS feed names
  labels?: string[]; // User labels
  read?: boolean;
  starred?: boolean;
  dateRange?: { from: Date; to: Date };
}

function filterBySource(
  items: PlainReadingListItem[],
  filters: SearchFilters,
): PlainReadingListItem[] {
  return items.filter((item) => {
    // Source type filter
    if (filters.sources?.length) {
      if (!filters.sources.includes(item.sourceType)) {
        return false;
      }
    }

    // Feed filter (for RSS items)
    if (filters.feeds?.length && item.sourceType === "rss") {
      const itemFeeds = item.collectionNames.filter((c) =>
        c.startsWith("rss:/"),
      );
      if (!itemFeeds.some((f) => filters.feeds!.includes(f))) {
        return false;
      }
    }

    // Label filter
    if (filters.labels?.length) {
      const normalizedLabels = filters.labels.map(normalizeLabelCollectionName);
      if (!normalizedLabels.some((l) => item.collectionNames?.includes(l))) {
        return false;
      }
    }

    // Read status
    if (filters.read !== undefined) {
      const isRead = !!item.userReadAt;
      if (isRead !== filters.read) return false;
    }

    // Starred status
    if (filters.starred !== undefined) {
      const isStarred = item.collectionNames?.includes("starred") || false;
      if (isStarred !== filters.starred) return false;
    }

    // Date range
    if (filters.dateRange) {
      const itemDate = item.publishedAt || item.cachedAt;
      if (
        itemDate < filters.dateRange.from.getTime() ||
        itemDate > filters.dateRange.to.getTime()
      ) {
        return false;
      }
    }

    return true;
  });
}
```
