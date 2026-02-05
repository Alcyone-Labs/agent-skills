# Jazz Extension Configuration

## Environment Variables

```bash
# Jazz Sync Server
VITE_JAZZ_SYNC_SERVER=wss://cloud.jazz.tools
VITE_JAZZ_API_KEY=your-api-key@gmail.com

# Aquaria RSS Backend (optional)
VITE_AQUARIA_BASE_URL=https://api.example.com

# Metadata API (optional)
VITE_METADATA_API_BASE=https://metadata.example.com

# Debug Mode
VITE_DEBUG_MENU=true  # Show debug context menu items
```

## Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Sauve",
  "version": "2.2.1",
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "popup/popup.html"
  },
  "permissions": [
    "storage",
    "alarms",
    "contextMenus",
    "sidePanel",
    "activeTab"
  ],
  "host_permissions": ["http://*/", "https://*/"]
}
```

## Schema Version Management

```typescript
// popup/jazz/schemas/root.ts

/** Current schema version - bump on breaking changes */
export const CURRENT_SCHEMA_VERSION = 16;

/** Check if schema needs migration */
export function needsMigration(root: AppRootType): boolean {
  return (root.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION;
}
```

### Migration Strategy

1. **Additive Only**: Only add new fields, never remove
2. **Optional Fields**: All new fields must be `.optional()`
3. **Default Values**: Use migrations to populate new required fields
4. **Version Tracking**: Store `schemaVersion` in AppRoot
5. **Repair System**: Daily auto-repair for data integrity

```typescript
// background/migration-service.ts

export async function runMigrations(
  account: any,
  root: AppRootType,
  fromVersion: number,
  toVersion: number,
): Promise<void> {
  if (fromVersion < 13) {
    await migrateV12ToV13(account, root);
  }
  if (fromVersion < 14) {
    await migrateV13ToV14(account, root);
  }
  // ... etc

  // Update schema version
  root.$jazz.set("schemaVersion", toVersion);
}
```

## Storage Keys

```typescript
// Service worker storage keys
const STORAGE_KEYS = {
  // Jazz identities
  IDENTITIES: "jazz_identities",
  FULL_IDENTITIES: "jazz_full_identities",
  SELECTED_ACCOUNT_ID: "jazz_selected_account_id",

  // Credentials
  CREDENTIAL_REQUESTS: "jazz_credential_requests",
  WEBSITE_INTEGRATIONS: "jazz_website_integrations",

  // RSS
  TAB_RSS_FEEDS: "tabRssFeeds",
  RSS_MENU_ITEM_IDS: "rssMenuItemIds",

  // Sync
  SYNC_CURSOR: "jazz_sync_cursor",
  SYNC_SNAPSHOT: "jazz_sync_snapshot",
};
```

## Namespace Configuration

```typescript
// popup/jazz/schemas/reserved-namespaces.ts

/** Reserved namespace prefixes */
export const RESERVED_NAMESPACES = [
  "rss", // RSS feeds: rss:/example.com/feed
  "bookmarks", // Bookmarks: bookmarks:/default
  "topics", // IPTC topics: topics:/medtop:20001362
  "system", // System collections
] as const;

/** Namespace separator */
export const NAMESPACE_SEPARATOR = ":/";

/** Check if name is in a reserved namespace */
export function getNamespace(name: string): string | null {
  for (const ns of RESERVED_NAMESPACES) {
    if (name.startsWith(`${ns}:/`)) {
      return ns;
    }
  }
  return null;
}
```

## Resolve Specs

```typescript
// Common resolve specifications for partial loading

/** Root metadata only */
const ROOT_META_RESOLVE = {
  displayName: true,
  settings: {
    inbox: true,
    content: true,
    aquaria: true,
    keyboardShortcuts: true,
    ui: true,
    reading: true,
    notifications: true,
    security: true,
    backup: true,
    tabs: true,
  },
  schemaVersion: true,
};

/** Collections with content hashes */
const COLLECTIONS_RESOLVE = {
  $each: {
    name: true,
    displayName: true,
    namespace: true,
    isSystem: true,
    isNamespaceRoot: true,
    children: true,
    childLabels: true,
    contentHashes: { $each: true },
    metadataType: true,
    metadataJson: true,
  },
};

/** Content store entry */
const CONTENT_STORE_ENTRY_RESOLVE = {
  urlHash: true,
  url: true,
  title: true,
  markdown: true,
  faviconUrl: true,
  createdAt: true,
  publishedAt: true,
  userReadAt: true,
  userDeletedAt: true,
  userStarredAt: true,
  sourceType: true,
  sourceUrl: true,
  sourceTitle: true,
  summary: true,
  collectionNames: true,
};
```

## Index Configuration

```typescript
// background/jazz-indexes.ts

/** Application indexes for fast queries */
export interface ApplicationIndexes {
  /** urlHash → content metadata */
  contentByHash: Map<string, ContentIndexEntry>;

  /** collection name → collection metadata */
  collectionByName: Map<string, CollectionIndexEntry>;

  /** feed URL → feed metadata */
  feedByUrl: Map<string, FeedIndexEntry>;
}

/** Build indexes from root data */
export function buildApplicationIndexes(root: AppRootType): ApplicationIndexes {
  const indexes: ApplicationIndexes = {
    contentByHash: new Map(),
    collectionByName: new Map(),
    feedByUrl: new Map(),
  };

  // Index contentStore
  for (const [urlHash, content] of Object.entries(root.contentStore || {})) {
    if (urlHash.startsWith("$")) continue;
    indexes.contentByHash.set(urlHash, {
      title: content.title,
      url: content.url,
      collections: content.collectionNames || [],
      isRead: content.userReadAt != null,
    });
  }

  // Index collections
  for (const [name, collection] of Object.entries(root.collections || {})) {
    if (name.startsWith("$")) continue;
    indexes.collectionByName.set(name, {
      displayName: collection.displayName,
      namespace: collection.namespace,
      contentCount: collection.contentHashes?.length || 0,
    });
  }

  return indexes;
}
```

## Timing Constants

```typescript
// background/jazz-worker.ts

/** Daily repair interval */
const REPAIR_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Broadcast debounce delay */
const BROADCAST_DEBOUNCE_MS = 500;

/** Mutation tracking TTL */
const MUTATION_TRACK_TTL = 2000;

/** Connection timeout */
const CONNECTION_TIMEOUT_MS = 3000;

/** Deep load warning threshold */
const DEEP_LOAD_WARNING_MS = 5000;
```

## Batch Sizes

```typescript
// popup/jazz/proxy/context-proxy.ts

/** Content store batch loading size */
const CONTENT_STORE_BATCH_SIZE = 20;

/** Reading list page size */
const READING_LIST_PAGE_SIZE = 50;

/** Unread count batch size */
const UNREAD_COUNT_BATCH_SIZE = 250;
```
