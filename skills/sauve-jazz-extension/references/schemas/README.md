# Jazz Schema Design

## CoValue Types

| Type                    | Use Case                       | Example                              |
| ----------------------- | ------------------------------ | ------------------------------------ |
| `co.map({...})`         | Object with fixed keys         | PageContent, Collection              |
| `co.record(key, value)` | Dictionary with arbitrary keys | ContentStoreRecord, CollectionRecord |
| `co.list(item)`         | Ordered array                  | UrlHashList, readingListIndex        |
| `co.profile({...})`     | User profile                   | Account profile                      |
| `co.account({...})`     | User account                   | Jazz account with root               |

## Schema Patterns

### Content Store Pattern

```typescript
// Single source of truth for all content
export const PageContent = co.map({
  // Identity
  urlHash: z.string(),
  url: z.string(),

  // Content
  title: z.string().optional(),
  markdown: z.string(),

  // User state
  userReadAt: z.number().nullable().optional(),
  userDeletedAt: z.number().nullable().optional(),

  // Collections
  collectionNames: z.array(z.string()).optional(),
});

// O(1) lookup by urlHash
export const ContentStoreRecord = co.record(z.string(), PageContent);
```

### Collection Pattern

```typescript
export const Collection = co.map({
  name: z.string(),
  displayName: z.string().optional(),
  namespace: z.string().optional(),

  // Bidirectional: collection knows its content
  contentHashes: co.list(z.string()),

  // Hierarchical
  children: z.array(z.string()).optional(),
});

// O(1) lookup by name
export const CollectionRecord = co.record(z.string(), Collection);
```

### Namespace Pattern

```typescript
// Reserved namespaces
const NAMESPACE_SEPARATOR = ":/";

// rss:/example.com/feed
// bookmarks:/default
// topics:/medtop:20001362

export function buildCollectionName(namespace: string, path: string): string {
  return `${namespace}:${NAMESPACE_SEPARATOR}${path}`;
}

export function parseCollectionName(name: string): {
  namespace: string | null;
  path: string;
} {
  const separatorIndex = name.indexOf(NAMESPACE_SEPARATOR);
  if (separatorIndex === -1) {
    return { namespace: null, path: name };
  }
  return {
    namespace: name.slice(0, separatorIndex),
    path: name.slice(separatorIndex + NAMESPACE_SEPARATOR.length),
  };
}
```

## Migrations

### Version Bump Process

1. Increment `CURRENT_SCHEMA_VERSION`
2. Add migration function
3. Mark old fields as `.optional()`
4. Test with old data

```typescript
// popup/jazz/schemas/root.ts
export const CURRENT_SCHEMA_VERSION = 16;

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
  // ...

  root.$jazz.set("schemaVersion", toVersion);
}
```

### Migration Example

```typescript
async function migrateV12ToV13(account: any, root: AppRootType) {
  // Legacy: bookmarks array
  // New: contentStore with bookmarks:/default collection

  if (root.bookmarks) {
    for (const bookmark of root.bookmarks) {
      const urlHash = await hashUrl(bookmark.url);

      // Create PageContent
      const content = PageContent.create(
        {
          urlHash,
          url: bookmark.url,
          title: bookmark.title,
          markdown: bookmark.contentMarkdown || "",
          collectionNames: ["bookmarks:/default"],
        },
        account,
      );

      // Add to contentStore
      root.contentStore.$jazz.set(urlHash, content);
    }

    // Remove legacy (optional - can keep for rollback)
    // root.$jazz.delete('bookmarks');
  }
}
```
