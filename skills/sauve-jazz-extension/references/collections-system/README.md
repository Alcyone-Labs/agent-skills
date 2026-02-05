# Collections System Overview

## Architecture

The collections system provides a unified way to organize content from multiple sources (RSS, Bookmarks, manual imports) using namespaces. All content lives in `contentStore` and is categorized through collection membership.

## Namespace Structure

```
Collections (AppRoot.collections)
├── rss:/                    # RSS feeds (system-managed)
│   └── example.com/feed     # Individual RSS feeds
├── bookmarks:/              # Bookmark folders
│   └── default              # Default bookmark folder
├── topics:/                 # IPTC Media Topics (system-managed)
│   └── medtop:20001362      # Standardized topics
├── labels:/                 # User-defined labels (hierarchical)
│   ├── ai                   # labels:/ai
│   │   └── research         # labels:/ai/research
│   └── work
├── rss-group:/              # RSS feed groupings
│   └── research             # Group containing multiple rss:/ feeds
├── reading-list:/           # Reading list collections
├── starred                  # Special flag (no children)
└── archived                 # Special flag (no children)
```

## Collection Types

| Namespace     | Type           | Managed By | Hierarchy    | Purpose          |
| ------------- | -------------- | ---------- | ------------ | ---------------- |
| `rss:/`       | Source         | System     | Flat         | RSS feed sources |
| `bookmarks:/` | Source         | User       | Hierarchical | Bookmark folders |
| `topics:/`    | Classification | System     | Hierarchical | IPTC topics      |
| `labels:/`    | Organization   | User       | Hierarchical | User labels      |
| `rss-group:/` | Grouping       | User       | Hierarchical | Feed collections |
| `starred`     | Flag           | System     | N/A          | Starred items    |
| `archived`    | Flag           | System     | N/A          | Archived items   |

## Content Source Detection

Every item in `contentStore` has a `sourceType` field indicating its origin:

```typescript
sourceType: "rss" | "bookmark" | "manual" | "import";
```

### Detection Logic

```typescript
function detectContentSource(content: PageContent): ContentSource {
  // Primary: Check sourceType field
  if (content.sourceType) {
    return content.sourceType;
  }

  // Fallback: Check collection names
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

### Source-Specific Fields

**RSS Items:**

```typescript
{
  sourceType: 'rss',
  sourceUrl: 'https://example.com/feed.xml',  // Feed URL
  sourceTitle: 'Example Blog',                 // Feed title
  publishedAt: 1234567890,                     // Original pub date
  guid: 'unique-item-id',                      // RSS GUID
  itemId: 'ulid-cursor',                       // Aquaria cursor
}
```

**Bookmark Items:**

```typescript
{
  sourceType: 'bookmark',
  // Bookmarks don't need sourceUrl - URL is the content URL
}
```

## Unified ContentStore

All content lives in a single record keyed by URL hash:

```typescript
AppRoot.contentStore: Record<urlHash, PageContent>

// Example entries:
{
  "abc123...": {
    urlHash: "abc123...",
    url: "https://example.com/article",
    title: "Article Title",
    markdown: "# Content...",
    sourceType: "rss",
    sourceUrl: "https://example.com/feed.xml",
    collectionNames: [
      "rss:/example.com/feed",     // From RSS feed
      "labels:/ai",                 // User label
      "starred"                     // User starred
    ],
    userReadAt: 1234567890,
    userStarredAt: 1234567890,
  }
}
```

### Benefits

1. **Single Source of Truth**: No duplicate data across stores
2. **Unified State**: Read/star/delete state is global, not per-source
3. **Cross-Source Labels**: Items can have multiple collections (RSS + AI label)
4. **Efficient Queries**: O(1) lookup by URL hash

## RSS Groups

RSS Groups allow users to organize feeds without duplicating content:

```
rss-group:/research
├── children: [
│   "rss:/ai-blog.com/feed",
│   "rss:/ml-news.com/rss",
│   "rss:/arxiv.org/cs.AI"
│]
└── contentHashes: []  // Empty! Items come from child feeds
```

### How RSS Groups Work

1. **Group Collection**: `rss-group:/research` stores `children` array
2. **Feed Membership**: RSS feeds listed in `children` are part of the group
3. **Content Aggregation**: Items shown in group = union of all child feed items
4. **No Duplication**: Items stored once in contentStore, referenced by multiple collections

### Creating RSS Groups

```typescript
// 1. Create the group collection
await createCollection(root, "rss-group:/research", account, {
  namespace: "rss-group",
  isSystem: false,
});

// 2. Add RSS feeds as children
const group = root.collections["rss-group:/research"];
const children = getCollectionChildren(group);
setCollectionChildren(root, "rss-group:/research", [
  ...children,
  "rss:/ai-blog.com/feed",
]);
```

## Collection Metadata

Different collection types store type-specific metadata:

```typescript
// RSS Collection
{
  name: "rss:/example.com/feed",
  namespace: "rss",
  isSystem: true,
  metadataType: "rss",
  metadataJson: JSON.stringify({
    type: "rss",
    feedUrl: "https://example.com/feed.xml",
    feedEnabled: true,
    lastFetchedAt: 1234567890,
  }),
}

// Bookmark Collection
{
  name: "bookmarks:/work",
  namespace: "bookmarks",
  isSystem: false,
  metadataType: "bookmark",
  metadataJson: JSON.stringify({
    type: "bookmark",
    isDefault: false,
    sortOrder: 1,
  }),
}
```

## Workflow Decision Tree

```
Content arrives from source
├─ RSS Feed → sourceType: 'rss'
│   ├─ Add to contentStore
│   ├─ Assign rss:/{feed} collection
│   └─ Update rss:/ root children
├─ Bookmark → sourceType: 'bookmark'
│   ├─ Add to contentStore
│   └─ Assign bookmarks:/default collection
├─ Manual Import → sourceType: 'import'
│   ├─ Add to contentStore
│   └─ Assign user labels
└─ Manual Add → sourceType: 'manual'
    ├─ Add to contentStore
    └─ Assign user labels

User organizes content
├─ Assign label → Add to content.collectionNames
│   └─ Update label.contentHashes (bidirectional)
├─ Create RSS Group → Create rss-group:/name
│   └─ Add rss:/ feeds to children
├─ Star item → Add "starred" to collectionNames
└─ Archive item → Add "archived" to collectionNames

Display content by source
├─ RSS Tab → Filter by sourceType: 'rss'
├─ Bookmarks Tab → Filter by sourceType: 'bookmark'
├─ Inbox → All items (minus deleted)
└─ Collection View → Filter by collection membership
```

## Key Rules

### System-Managed vs User-Managed

- **System-managed** (`rss:/`, `topics:/`): Created by extension, immutable by users
- **User-managed** (`labels:/`, `bookmarks:/`, `rss-group:/`): Users can create, rename, delete

### Namespace Isolation

```typescript
// Each namespace has its own root
const roots = {
  rss: "rss:/",
  bookmarks: "bookmarks:/",
  topics: "topics:/",
  labels: "labels:/",
  "rss-group": "rss-group:/",
};

// Roots track their children
root.collections["rss:/"].children = [
  "rss:/example.com/feed",
  "rss:/another.com/rss",
];
```

### Hierarchical Label Aggregation

- `labels:/parent` views include all descendant labels (`labels:/parent/**`).
- `contentHashes` on labels are direct membership only; UI aggregates
  descendants when listing items for a parent label.

### Content Uniqueness

Content is unique by `urlHash`. Same URL from different sources merges:

```typescript
// RSS item arrives
contentStore["abc123"] = {
  url: "https://example.com/page",
  sourceType: "rss",
  collectionNames: ["rss:/example.com/feed"],
};

// Later bookmarked
// Same urlHash → Update existing
contentStore["abc123"].collectionNames.push("bookmarks:/default");
// Now has BOTH rss and bookmark collections
```

## References

- `api.md` - Collection management functions
- `configuration.md` - Schema and data model
- `patterns.md` - Common implementation patterns
- `search-dsl.md` - Filtering collections
- `gotchas.md` - Common issues
