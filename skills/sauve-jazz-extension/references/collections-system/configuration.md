# Collections System Configuration

## Schema Types

### PageContent Source Fields

```typescript
// packages/sauve-chrome-extension/src/popup/jazz/schemas/page-content.ts
export const PageContent = co.map({
  // ... other fields

  // === Source Metadata ===
  /** Source type: how this content was added */
  sourceType: z.enum(["rss", "bookmark", "manual", "import"]).optional(),

  /** Source URL (e.g., feed URL for RSS items) */
  sourceUrl: z.string().optional(),

  /** Source title (e.g., feed title for RSS items) */
  sourceTitle: z.string().optional(),

  // === RSS/Atom ===
  /** RSS/Atom GUID if available */
  guid: z.string().optional(),

  /** Aquaria itemId (ULID cursor) if available */
  itemId: z.string().optional(),

  // === Collections ===
  /** Collection names for this content (v15) */
  collectionNames: z.array(z.string()).optional(),

  /** Topic labels in topics:/ namespace */
  topicLabels: z.array(z.string()).optional(),
});
```

### Collection Schema with Metadata

```typescript
// packages/sauve-chrome-extension/src/popup/jazz/schemas/collection.ts
export const Collection = co.map({
  name: z.string(), // "rss:/example.com/feed"
  displayName: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),

  // Namespace
  namespace: z.string().optional(), // "rss", "bookmarks", "labels"
  isSystem: z.boolean().optional(), // true for rss:/, topics:/
  isNamespaceRoot: z.boolean().optional(), // true for rss:/, labels:/

  // Hierarchy
  children: z.array(z.string()).optional(),

  // Bidirectional linking
  contentHashes: co.list(z.string()), // URL hashes of content

  // Metadata storage
  metadataType: z.string().optional(), // "rss", "topic", "bookmark", "user"
  metadataJson: z.string().optional(), // JSON-encoded metadata

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});
```

---

## Reserved Namespaces Configuration

```typescript
// packages/sauve-chrome-extension/src/popup/jazz/schemas/reserved-namespaces.ts

export const RESERVED_NAMESPACES = {
  // === Content Sources ===
  rss: {
    pattern: /^rss:\/\/.*/,
    rootLabel: "rss:/",
    description: "RSS/Atom feed subscriptions",
    example: "rss:/example.com/feed.xml",
    systemManaged: true, // ← Extension creates, users cannot
  },

  bookmarks: {
    pattern: /^bookmarks:\/\/.*/,
    rootLabel: "bookmarks:/",
    description: "Bookmark folders",
    example: "bookmarks:/default",
    systemManaged: false, // ← Users can create folders
  },

  topics: {
    pattern: /^topics:\/\/.*/,
    rootLabel: "topics:/",
    description: "IPTC Media Topics (1392 standardized topics)",
    example: "topics:/medtop:20001362",
    systemManaged: true,
  },

  // === User Collections ===
  labels: {
    pattern: /^labels:\/\/.*/,
    rootLabel: "labels:/",
    description: "User labels with hierarchical organization",
    example: "labels:/ai/research",
    systemManaged: false,
  },

  "rss-group": {
    pattern: /^rss-group:\/\/.*/,
    rootLabel: "rss-group:/",
    description: "RSS feed groups",
    example: "rss-group:/research",
    systemManaged: false,
  },

  "reading-list": {
    pattern: /^reading-list(:\/.+)?/,
    rootLabel: "reading-list:/",
    description: "Reading list collections",
    example: "reading-list:/ai",
    systemManaged: false,
  },

  // === Special Flags ===
  starred: {
    pattern: /^starred$/,
    rootLabel: null, // No children
    description: "Starred items",
    systemManaged: true,
  },

  archived: {
    pattern: /^archived$/,
    rootLabel: null,
    description: "Archived items",
    systemManaged: true,
  },
};
```

---

## Collection Metadata Schemas

### RSS Collection Metadata

```typescript
// packages/sauve-chrome-extension/src/popup/jazz/schemas/collection-metadata.ts

export interface PlainRSSCollectionMetadata {
  type: 'rss';
  feedUrl: string;
  feedEnabled: boolean;
  lastFetchedAt?: number;
  fetchIntervalMinutes?: number;
  errorCount?: number;
  lastError?: string;
}

// Usage in collection:
{
  name: 'rss:/example.com/feed',
  namespace: 'rss',
  isSystem: true,
  metadataType: 'rss',
  metadataJson: JSON.stringify({
    type: 'rss',
    feedUrl: 'https://example.com/feed.xml',
    feedEnabled: true,
    lastFetchedAt: Date.now(),
    fetchIntervalMinutes: 60,
  }),
}
```

### Bookmark Collection Metadata

```typescript
export interface PlainBookmarkCollectionMetadata {
  type: 'bookmark';
  isDefault?: boolean;
  sortOrder?: number;
}

// Usage:
{
  name: 'bookmarks:/default',
  namespace: 'bookmarks',
  metadataType: 'bookmark',
  metadataJson: JSON.stringify({
    type: 'bookmark',
    isDefault: true,
    sortOrder: 0,
  }),
}
```

### Topic Collection Metadata

```typescript
export interface PlainTopicCollectionMetadata {
  type: 'topic';
  qcode: string;           // "medtop:20001362"
  iptcLabel: string;       // "public transport"
  iptcUri?: string;
  parentQcode?: string;
  score?: number;          // AI confidence
}

// Usage:
{
  name: 'topics:/medtop:20001362',
  namespace: 'topics',
  isSystem: true,
  metadataType: 'topic',
  metadataJson: JSON.stringify({
    type: 'topic',
    qcode: 'medtop:20001362',
    iptcLabel: 'public transport',
  }),
}
```

---

## Data Model Relationships

### Content → Collections (Many-to-Many)

```
PageContent
├─ urlHash: "abc123"
├─ sourceType: "rss"
├─ sourceUrl: "https://example.com/feed.xml"
└─ collectionNames: [
    "rss:/example.com/feed",     // Source collection
    "labels:/ai",                 // User label
    "topics:/medtop:20001362",    // Auto-classified topic
    "starred"                     // User flag
   ]

Collections
├─ rss:/example.com/feed
│   └─ contentHashes: ["abc123", "def456", ...]
├─ labels:/ai
│   └─ contentHashes: ["abc123", "ghi789", ...]
├─ topics:/medtop:20001362
│   └─ contentHashes: ["abc123", "jkl012", ...]
└─ starred
    └─ contentHashes: ["abc123", ...]
```

### RSS Group Structure

```
rss-group:/research
├─ namespace: "rss-group"
├─ children: [
│   "rss:/ai-blog.com/feed",
│   "rss:/ml-news.com/rss",
│   "rss:/arxiv.org/cs.AI"
│  ]
└─ contentHashes: []  // Group doesn't own content directly

rss:/ai-blog.com/feed
└─ contentHashes: ["article1", "article2", ...]

// Items shown in rss-group:/research = union of children's content
```

---

## Source Type Determination

### Flowchart

```
Content arrives
├─ From RSS fetcher
│   └─ sourceType: 'rss'
│   └─ sourceUrl: feedUrl
│   └─ sourceTitle: feedTitle
│   └─ publishedAt: item.pubDate
│   └─ guid: item.guid
│
├─ From bookmark creation
│   └─ sourceType: 'bookmark'
│   └─ (no sourceUrl - URL is content URL)
│
├─ From import
│   └─ sourceType: 'import'
│   └─ (preserves original metadata if available)
│
└─ From manual add
    └─ sourceType: 'manual'
```

### Source Collections Assignment

```typescript
// RSS item creation
const content = PageContent.create(
  {
    urlHash,
    url: item.link,
    title: item.title,
    sourceType: "rss",
    sourceUrl: feedUrl,
    sourceTitle: feedTitle,
    publishedAt: new Date(item.pubDate).getTime(),
    collectionNames: [
      `rss:/${feedHostname}/feed`, // Source collection
    ],
  },
  account,
);

// Bookmark creation
const content = PageContent.create(
  {
    urlHash,
    url: bookmark.url,
    title: bookmark.title,
    sourceType: "bookmark",
    collectionNames: [
      "bookmarks:/default", // Default folder
    ],
  },
  account,
);
```

---

## Namespace Roots

### Purpose

Namespace roots serve as:

1. **Enumeration points**: `Object.keys(root.collections).filter(k => k.startsWith('rss:/'))`
2. **Parent tracking**: Root's `children` array lists top-level collections
3. **Policy enforcement**: System-managed roots can't be deleted

### Structure

```typescript
// rss:/ root
{
  name: 'rss:/',
  namespace: 'rss',
  isNamespaceRoot: true,
  isSystem: true,
  children: [
    'rss:/example.com/feed',
    'rss:/another.com/rss',
  ],
  contentHashes: [],  // Root doesn't track content directly
}

// labels:/ root
{
  name: 'labels:/',
  namespace: 'labels',
  isNamespaceRoot: true,
  isSystem: false,  // Users can create labels
  children: [
    'labels:/ai',
    'labels:/work',
    'labels:/personal',
  ],
}
```

### Root Initialization

```typescript
// On account creation, ensure all namespace roots exist
async function initializeNamespaceRoots(root, account) {
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
        true,
      ); // isSystemCall = true
    }
  }
}
```

---

## Content Deduplication

### URL-Based Merging

Content is unique by `urlHash` (SHA-256 of canonical URL):

```typescript
// Item arrives from RSS
const urlHash = await hashUrl(item.link);

if (root.contentStore[urlHash]) {
  // Content exists - add RSS collection
  const existing = root.contentStore[urlHash];
  const collections = new Set(getContentCollections(existing));
  collections.add(`rss:/${feedHostname}/feed`);

  existing.$jazz.set('collectionNames', Array.from(collections));

  // Update sourceType if not set
  if (!existing.sourceType) {
    existing.$jazz.set('sourceType', 'rss');
  }
} else {
  // Create new content
  root.contentStore.$jazz.set(urlHash, PageContent.create({ ... }, account));
}
```

### Result

Same URL from different sources merges into single entry with multiple collections:

```typescript
// Initially bookmarked
{
  urlHash: "abc123",
  sourceType: "bookmark",
  collectionNames: ["bookmarks:/default"]
}

// Later appears in RSS feed
// → Updates existing
{
  urlHash: "abc123",
  sourceType: "bookmark",  // Preserved (or could update to 'rss')
  sourceUrl: "https://example.com/feed.xml",  // Added
  collectionNames: [
    "bookmarks:/default",
    "rss:/example.com/feed"  // Added
  ]
}
```

---

## Query Patterns

### Get All RSS Items

```typescript
// Method 1: Filter by sourceType
const rssItems = Object.values(root.contentStore).filter(
  (c) => c.sourceType === "rss",
);

// Method 2: Check collections
const rssItems = Object.values(root.contentStore).filter((c) =>
  getContentCollections(c).some((col) => col.startsWith("rss:/")),
);
```

### Get Items by Feed

```typescript
const feedName = "rss:/example.com/feed";
const feed = root.collections[feedName];
const urlHashes = feed.contentHashes || [];

const items = urlHashes.map((hash) => root.contentStore[hash]).filter(Boolean);
```

### Get Items by Multiple Criteria

```typescript
// Items that are:
// - From RSS (sourceType: 'rss')
// - Have 'ai' label
// - Not read
const items = Object.values(root.contentStore).filter(
  (c) =>
    c.sourceType === "rss" &&
    getContentCollections(c).includes("labels:/ai") &&
    !c.userReadAt,
);
```
