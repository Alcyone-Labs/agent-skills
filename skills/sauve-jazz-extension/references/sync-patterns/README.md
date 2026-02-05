# Jazz Sync Patterns

## Real-time Sync Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Popup A    │◄───►│   Service   │◄───►│  Popup B    │
│  (Writer)   │     │   Worker    │     │  (Reader)   │
└──────┬──────┘     │  (Jazz Hub) │     └──────┬──────┘
       │            └──────┬──────┘            │
       │                   │                   │
       │              ┌────┴────┐              │
       │              │  Jazz   │              │
       │              │  Cloud  │              │
       │              └────┬────┘              │
       │                   │                   │
       │              ┌────┴────┐              │
       └─────────────►│  User's │◄─────────────┘
         (via SW)     │  Phone  │    (via SW)
                      └─────────┘
```

## Sync Flow

### 1. Local Sync (Same Device)

```
Popup A writes ──► Service Worker ──► Jazz (IndexedDB)
                         │
                         ▼ (subscription)
                    Popup B receives update
```

### 2. Cloud Sync (Cross Device)

```
Popup A writes ──► Service Worker ──► Jazz Cloud
                                              │
                                              ▼
User's Phone ◄──── Service Worker ◄──── Jazz Cloud
```

## Optimistic UI Pattern

```typescript
// 1. Apply optimistic update immediately
const rollback = applyOptimisticUpdate({
  collection: "contentStore",
  entityId: urlHash,
  changes: { title: newTitle },
});

// 2. Send mutation to service worker
const response = await sendMutation({
  operation: "update",
  entityType: "contentStore",
  entityId: urlHash,
  data: { title: newTitle },
});

// 3. Confirm or rollback
if (response.success) {
  // Keep optimistic update
} else {
  rollback(); // Revert to original
  showError("Update failed");
}

// 4. Receive broadcast (confirm sync)
// All popups get update including originator
```

## Conflict Resolution

### Last-Write-Wins (Default)

```typescript
// Jazz uses last-write-wins by default
// Timestamps determine winner

// User A writes at T1
content.$jazz.set("title", "Title A");

// User B writes at T2 (T2 > T1)
content.$jazz.set("title", "Title B");

// Result: Title B (later timestamp)
```

### Custom Merge Strategy

```typescript
// For complex conflicts, use CoMap with merge logic
export const PageContent = co
  .map({
    title: z.string(),

    // Track edit history
    editHistory: co.list(
      co.map({
        timestamp: z.number(),
        userId: z.string(),
        field: z.string(),
        oldValue: z.string(),
        newValue: z.string(),
      }),
    ),
  })
  .withMigration((content) => {
    // Custom merge logic can be added here
  });
```

## Subscription Management

### Path Matching

```typescript
// Subscription path: ['root', 'collections']
// Changed path: ['root', 'collections', 'rss:/example.com']
// Result: MATCH (changed path starts with subscription path)

// Subscription path: ['root', 'bookmarks']
// Changed path: ['root', 'collections']
// Result: NO MATCH

function pathMatches(
  subscriptionPath: string[],
  changedPath: string[],
): boolean {
  if (changedPath.length < subscriptionPath.length) return false;
  return subscriptionPath.every((segment, i) => segment === changedPath[i]);
}
```

### Subscription Lifecycle

```typescript
// 1. Create subscription
const subscriptionId = `sub_${ulid()}`;

port.postMessage({
  type: "jazz:subscribe",
  subscriptionId,
  path: ["root", "contentStore"],
});

// 2. Receive updates
port.onMessage.addListener((msg) => {
  if (msg.type === "jazz:dataUpdated") {
    updateUI(msg.data);
  }
});

// 3. Cleanup on unmount
port.postMessage({
  type: "jazz:unsubscribe",
  subscriptionId,
});
port.disconnect();
```

## Broadcast Exclusion

### Why Exclude Sender?

```typescript
// Without exclusion:
// 1. Popup sends mutation
// 2. Service worker updates Jazz
// 3. Jazz subscription fires
// 4. Broadcast sent to ALL popups
// 5. Original popup receives its own update
// 6. Popup re-applies update (duplicate!)

// With exclusion:
// 1. Popup sends mutation (with clientId)
// 2. Service worker tracks mutation
// 3. Jazz subscription fires
// 4. Broadcast excludes sender
// 5. Other popups receive update
// 6. Original popup already has update (optimistic)
```

### Implementation

```typescript
// 1. Track mutation with clientId
trackLocalMutation("contentStore", "update", urlHash, {
  requestId,
  clientId: getExtensionClientId(),
});

// 2. Broadcast excludes sender
const meta = getLatestMutationMetaForCollection("contentStore");
broadcastUpdate(["root", "contentStore"], data, {
  excludeClientId: meta?.clientId,
});
```

## Multi-Window Sync

```typescript
// Window A and Window B both open

// Window A makes change
await saveBookmark({ url, title });

// Service worker:
// 1. Updates Jazz
// 2. Broadcasts to all subscriptions
// 3. Window A receives (excluded, already has optimistic)
// 4. Window B receives (applies update)

// Result: Both windows in sync
```

## Sync State Management

```typescript
// Track sync state for UI indicators
interface SyncState {
  collections: {
    phase: "idle" | "loadingIndex" | "loadingPage" | "synced" | "error";
    loaded: number;
    total?: number;
    error?: string;
  };
  inbox: {
    phase: "idle" | "loadingIndex" | "loadingPage" | "synced" | "error";
    loaded: number;
    total?: number;
  };
}

// Update on progress
syncStateManager.setCollectionProgress("inbox", {
  phase: "loadingPage",
  loaded: 50,
  total: 100,
});

// UI shows: "Loading inbox... 50/100"
```
