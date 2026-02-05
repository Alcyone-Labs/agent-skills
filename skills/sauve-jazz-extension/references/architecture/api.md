# Jazz Extension API Reference

## Service Worker API

### Jazz Worker Lifecycle

```typescript
// background/jazz-worker.ts

/**
 * Initialize Jazz worker with account credentials
 * Called once on extension install/startup or after account creation
 */
export async function initializeJazzWorker(
  accountID: string,
  accountSecret: string,
  displayName?: string,
): Promise<void>;

/**
 * Check if Jazz worker is initialized
 */
export function isJazzWorkerInitialized(): boolean;

/**
 * Get current worker state
 */
export function getWorkerState(): Readonly<{
  schemaVersion: number;
  isInitialized: boolean;
  dataLoaded: boolean;
  accountID: string | null;
}>;

/**
 * Get Jazz context for direct access (service worker only)
 */
export function getJazzContext(): {
  me: { root: AppRootType; $jazz: any };
  node: any;
};

/**
 * Ensure Jazz is initialized (auto-restore from storage)
 */
export async function ensureJazzInitialized(): Promise<void>;

/**
 * Reset Jazz worker (logout/cleanup)
 */
export function resetJazzWorker(): void;
```

### Message Handlers

```typescript
// background/jazz-message-handler.ts

/**
 * Handle query request from popup
 */
export async function handleJazzQuery(
  request: JazzQueryRequest,
): Promise<JazzQueryResponse>;

/**
 * Handle mutation request from popup
 */
export async function handleJazzMutate(
  request: JazzMutateRequest,
): Promise<JazzMutateResponse>;

/**
 * Handle subscription request (port-based)
 */
export function handleJazzSubscribe(
  request: JazzSubscribeRequest,
  port: chrome.runtime.Port,
): void;

/**
 * Handle unsubscribe request
 */
export function handleJazzUnsubscribe(request: JazzUnsubscribeRequest): void;
```

### Subscription Manager

```typescript
// background/jazz-subscription-manager.ts

/**
 * Register a new subscription
 */
export function registerSubscription(
  id: string,
  path: string[],
  resolve: any,
  port: chrome.runtime.Port,
  clientId?: string,
): void;

/**
 * Unregister a subscription
 */
export function unregisterSubscription(id: string): void;

/**
 * Broadcast update to all matching subscriptions
 */
export function broadcastUpdate(
  changedPath: string[],
  data: any,
  options?: { excludeClientId?: string },
): void;

/**
 * Get active subscription count
 */
export function getSubscriptionCount(): number;
```

### Serialization

```typescript
// background/jazz-serialization.ts

/**
 * Serialize Jazz CoValue to plain object
 * Strips $jazz internals, preserves _jazzId
 */
export function serializeCoValue(coValue: unknown): any;

/**
 * Serialize array of CoValues
 */
export function serializeCoValueArray(coValues: unknown[]): any[];

/**
 * Extract Jazz ID from CoValue
 */
export function getJazzId(coValue: unknown): string | null;

/**
 * Check if value is a Jazz CoValue
 */
export function isCoValue(value: unknown): boolean;
```

## Popup API

### Proxy Context

```typescript
// popup/jazz/proxy/context-proxy.ts

/**
 * Create proxy context manager
 * Mimics JazzBrowserContextManager API
 */
export function createProxyContextManager(): ProxyContextManager;

/**
 * Initialize proxy and connect to service worker
 */
export async function initializeProxy(): Promise<boolean>;

/**
 * Query service worker for data
 */
export async function queryServiceWorker(
  path: string[],
  resolve?: any,
): Promise<JazzQueryResponse>;

/**
 * Send mutation to service worker
 */
export async function sendMutation(
  operation: MutationType,
  entityType: string,
  entityId?: string,
  data?: any,
): Promise<JazzMutateResponse>;
```

### Extension Messaging

```typescript
// lib/extension-messaging.ts

/**
 * Send message to service worker
 */
export async function sendRuntimeMessage<T>(message: any): Promise<T>;

/**
 * Connect port for subscriptions
 */
export function connectRuntimePort(
  name: string,
  onMessage: (msg: any) => void,
  onDisconnect?: () => void,
): chrome.runtime.Port;

/**
 * Get unique client ID for this popup instance
 */
export function getExtensionClientId(): string;
```

## Schema API

### CoValue Types

```typescript
// From 'jazz-tools'
import { co, z } from 'jazz-tools';

// CoMap - object with predefined keys
const MyMap = co.map({
  name: z.string(),
  count: z.number(),
  nested: co.map({ ... }),  // Nested CoMap
});

// CoRecord - dictionary with arbitrary string keys
const MyRecord = co.record(z.string(), MyMap);
// Result: Record<string, MyMap>

// CoList - ordered array
const MyList = co.list(MyMap);
// Result: MyMap[]

// CoList of primitives
const StringList = co.list(z.string());
```

### Schema Patterns

```typescript
// popup/jazz/schemas/root.ts

export const AppRoot = co.map({
  // Primitive fields
  displayName: z.string(),
  schemaVersion: z.number(),

  // Nested CoValues
  settings: SettingsSchema.optional(),

  // Records for O(1) lookup
  collections: CollectionRecord.optional(),
  contentStore: ContentStoreRecord.optional(),

  // Lists for ordered data
  readingListIndex: UrlHashList.optional(),
});

// Type helper
export type AppRootType = co.loaded<typeof AppRoot>;
```

### Account Schema with Migration

```typescript
// Service worker account schema
function createAccountSchema(displayName?: string) {
  return co
    .account({
      profile: co.profile({
        name: z.string(),
      }),
      root: AppRoot,
    })
    .withMigration(async (account, creationProps) => {
      if (!account.$jazz.has("root")) {
        // Create new root
        const root = AppRoot.create(
          {
            displayName: displayName || creationProps?.name,
            collections: CollectionRecord.create({}, account),
            contentStore: ContentStoreRecord.create({}, account),
            readingListIndex: UrlHashList.create([], account),
            schemaVersion: CURRENT_SCHEMA_VERSION,
          },
          account,
        );

        account.$jazz.set("root", root);
      } else {
        // Run migrations for existing accounts
        const { root } = await account.$jazz.ensureLoaded({
          resolve: { root: true },
        });

        await runMigrations(
          account,
          root,
          root.schemaVersion || 0,
          CURRENT_SCHEMA_VERSION,
        );
      }
    });
}
```

## Message Protocol Types

```typescript
// protocol/jazz.ts

// Base interface
interface BaseMessage {
  type: string;
  requestId?: string;
}

// Query
interface JazzQueryRequest extends BaseMessage {
  type: "jazz:query";
  requestId: string;
  clientId?: string;
  path: string[];
  resolve?: any;
  includeIndexes?: boolean;
}

interface JazzQueryResponse extends BaseMessage {
  type: "jazz:queryResponse";
  requestId: string;
  success: boolean;
  data?: any;
  indexes?: Partial<ApplicationIndexes>;
  error?: string;
}

// Mutation
interface JazzMutateRequest extends BaseMessage {
  type: "jazz:mutate";
  requestId: string;
  clientId?: string;
  operation: "create" | "update" | "delete";
  entityType:
    | "bookmark"
    | "collection"
    | "rssFeed"
    | "contentStore"
    | "rootSettings";
  entityId?: string;
  data?: any;
}

interface JazzMutateResponse extends BaseMessage {
  type: "jazz:mutateResponse";
  requestId: string;
  success: boolean;
  entityId?: string;
  data?: any;
  indexes?: Partial<ApplicationIndexes>;
  error?: string;
}

// Subscription
interface JazzSubscribeRequest extends BaseMessage {
  type: "jazz:subscribe";
  clientId?: string;
  subscriptionId: string;
  path: string[];
  resolve?: any;
}

interface JazzDataUpdate extends BaseMessage {
  type: "jazz:dataUpdated";
  subscriptionId: string;
  data: any;
  indexes?: Partial<ApplicationIndexes>;
  changedPaths: string[][];
}
```

## Type Guards

```typescript
// protocol/jazz.ts

export function isJazzMessage(message: any): message is JazzMessage {
  return (
    message !== null &&
    message !== undefined &&
    typeof message === 'object' &&
    typeof message.type === 'string' &&
    message.type.startsWith('jazz:')
  );
}

export function isJazzRequest(message: any): message is JazzRequest {
  return (
    isJazzMessage(message) &&
    (
      message.type === 'jazz:query' ||
      message.type === 'jazz:mutate' ||
      message.type === 'jazz:subscribe' ||
      message.type === 'jazz:unsubscribe' ||
      // ... other request types
    )
  );
}
```
