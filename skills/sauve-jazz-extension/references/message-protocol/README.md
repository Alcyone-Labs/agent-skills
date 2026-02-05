# Jazz Message Protocol

## Message Types

### Query Messages

```typescript
// Request
interface JazzQueryRequest {
  type: "jazz:query";
  requestId: string;
  clientId?: string;
  path: string[];
  resolve?: any;
  includeIndexes?: boolean;
}

// Response
interface JazzQueryResponse {
  type: "jazz:queryResponse";
  requestId: string;
  success: boolean;
  data?: any;
  indexes?: Partial<ApplicationIndexes>;
  error?: string;
}
```

### Mutation Messages

```typescript
// Request
interface JazzMutateRequest {
  type: "jazz:mutate";
  requestId: string;
  clientId?: string;
  operation: "create" | "update" | "delete";
  entityType: "bookmark" | "collection" | "contentStore" | "rootSettings";
  entityId?: string;
  data?: any;
}

// Response
interface JazzMutateResponse {
  type: "jazz:mutateResponse";
  requestId: string;
  success: boolean;
  entityId?: string;
  data?: any;
  indexes?: Partial<ApplicationIndexes>;
  error?: string;
}
```

### Reading List Mutation Messages

```typescript
// Request (subset)
type JazzReadingListMutationRequest =
  | { type: "jazz:readingList:markRead"; requestId: string; urlHash: string }
  | { type: "jazz:readingList:markUnread"; requestId: string; urlHash: string }
  | { type: "jazz:readingList:delete"; requestId: string; urlHash: string }
  | {
      type: "jazz:readingList:updateCollections";
      requestId: string;
      urlHash: string;
      collections: string[];
    }
  | {
      type: "jazz:readingList:markMultipleRead";
      requestId: string;
      urlHashes: string[];
    }
  | {
      type: "jazz:readingList:deleteMultiple";
      requestId: string;
      urlHashes: string[];
    };

// Response
interface JazzReadingListMutationResponse {
  type: "jazz:readingList:mutationResponse";
  requestId: string;
  success: boolean;
  error?: string;
}
```

**Label assignment uses** `jazz:readingList:updateCollections` to add
`labels:/...` collections without a separate create call.

### Subscription Messages

```typescript
// Subscribe request
interface JazzSubscribeRequest {
  type: "jazz:subscribe";
  clientId?: string;
  subscriptionId: string;
  path: string[];
  resolve?: any;
}

// Unsubscribe request
interface JazzUnsubscribeRequest {
  type: "jazz:unsubscribe";
  subscriptionId: string;
}

// Data update (broadcast)
interface JazzDataUpdate {
  type: "jazz:dataUpdated";
  subscriptionId: string;
  data: any;
  indexes?: Partial<ApplicationIndexes>;
  changedPaths: string[][];
}
```

## Proxy Mode Routing (isProxyMode)

- Proxy mode is the default for popup/UI
- Always branch on `isProxyMode()` before any Jazz read/write
- When true, ALL reads/mutations go through `chrome.runtime` message protocol

```typescript
// Popup feature
export async function updateTitle(urlHash: string, title: string) {
  if (isProxyMode()) {
    return sendRuntimeMessage({
      type: "jazz:mutate",
      requestId: ulid(),
      operation: "update",
      entityType: "contentStore",
      entityId: urlHash,
      data: { title },
    });
  }

  // Direct mode (service worker only)
  const context = getJazzContext();
  const entry = context.me.root.contentStore[urlHash];
  entry.$jazz.set("title", title);
}
```

## Port-Based Subscriptions

```typescript
// Popup: Connect port
const port = chrome.runtime.connect({ name: "jazz-subscription" });

// Send subscribe
port.postMessage({
  type: "jazz:subscribe",
  subscriptionId: "sub_123",
  path: ["root", "collections"],
});

// Receive updates
port.onMessage.addListener((msg) => {
  if (msg.type === "jazz:dataUpdated") {
    updateUI(msg.data);
  }
});

// Cleanup
port.postMessage({ type: "jazz:unsubscribe", subscriptionId: "sub_123" });
port.disconnect();
```

## Request ID Format

```typescript
export function generateRequestId(): string {
  return `jazz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
// Example: jazz_1704123456789_a1b2c3d4e
```
