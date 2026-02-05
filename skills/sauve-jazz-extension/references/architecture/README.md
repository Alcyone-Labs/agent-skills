# Jazz Extension Architecture

## Overview

Sauve Chrome Extension uses a **service-worker-centric architecture** for Jazz E2E encrypted storage. This design enables persistent sync state, background processing, and MV3 compatibility.

## Core Principle

**Service Worker = Sole Jazz Client**

- Only the service worker creates/owns the Jazz `startWorker()` instance
- Popup/UI is a thin client - no direct Jazz access
- All data flows through typed message protocol
- IndexedDB provides persistence across service worker restarts

## Proxy Mode (`isProxyMode`)

- Proxy mode is the default for users
- When `isProxyMode()` is true, popup code must NOT touch Jazz directly
- All reads/mutations go through service worker message protocol

## Service Worker Responsibilities

- Jazz worker lifecycle + schema versioning
- Runtime message routing (query/mutate/subscribe)
- Background alarms (RSS fetch, maintenance)
- Context menus and side panel wiring
- Metadata realtime WebSocket
- Aquaria sync controls + summarization
- Notifications/badge sync

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        POPUP (UI)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Preact UI  │  │ Proxy Context│  │ Optimistic Update Mgr   │  │
│  │  Components │◄─┤  (cached)   │◄─┤                         │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
│                          │                                       │
│                          │ chrome.runtime.sendMessage            │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Port Connection (subscriptions)               │   │
│  │     chrome.runtime.connect({ name: 'jazz-subscription' })  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE WORKER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Jazz Worker (startWorker)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │  Account    │  │   AppRoot   │  │  CoValues       │   │   │
│  │  │  (profile)  │  │  (root)     │  │  (contentStore) │   │   │
│  │  └─────────────┘  └──────┬──────┘  └─────────────────┘   │   │
│  │                          │                                │   │
│  │              ┌───────────┼───────────┐                    │   │
│  │              ▼           ▼           ▼                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │ collections │  │contentStore │  │readingList  │       │   │
│  │  │ (co.record) │  │ (co.record) │  │   Index     │       │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────┼──────────────────────────────┐   │
│  │       Message Handlers    │                              │   │
│  │  ┌─────────┐ ┌─────────┐ │ ┌─────────────────────────┐   │   │
│  │  │  Query  │ │ Mutate  │◄┘ │  Subscription Manager   │   │   │
│  │  │ Handler │ │ Handler │   │  (broadcast updates)    │   │   │
│  │  └─────────┘ └─────────┘   └─────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              IndexedDB (cojson-storage-indexeddb)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                    JAZZ CLOUD SYNC                               │
│              wss://cloud.jazz.tools                              │
└─────────────────────────────────────────────────────────────────┘
```

## File Organization

```
src/
├── background/                    # Service Worker - SOLE JAZZ CLIENT
│   ├── jazz-worker.ts            # Jazz initialization & lifecycle
│   ├── jazz-message-handler.ts   # Query/mutation handlers
│   ├── jazz-subscription-manager.ts  # Real-time broadcast
│   ├── jazz-serialization.ts     # CoValue → plain object
│   ├── jazz-indexes.ts           # Application indexes
│   ├── service-worker.ts         # Main SW entry point (wires modules)
│   └── service-worker/           # Modular SW responsibilities
│       ├── message-router.ts     # Runtime message routing
│       ├── jazz-router.ts        # Jazz query/mutation routing
│       ├── context-menu.ts       # Context menu wiring
│       ├── alarms.ts             # Alarm scheduling/handlers
│       ├── commands.ts           # Keyboard/command handlers
│       ├── ports.ts              # Port connection handling
│       ├── metadata-realtime.ts  # WebSocket metadata updates
│       ├── aquaria-handlers.ts   # Aquaria sync handlers
│       ├── rss-menu.ts           # RSS context menus
│       ├── badge-sync.ts         # Badge sync updates
│       ├── lifecycle.ts          # Install/startup lifecycle hooks
│       ├── logger.ts             # Simple-logger setup
│       ├── constants.ts          # Shared SW constants
│       └── account.ts            # Account setup helpers
│
├── popup/jazz/                   # Popup - PROXY CLIENT
│   ├── proxy/
│   │   ├── context-proxy.ts      # Main proxy API
│   │   ├── subscription-manager.ts  # Popup-side subscriptions
│   │   └── optimistic-update-manager.ts  # Optimistic UI
│   ├── schemas/                  # CoValue definitions
│   │   ├── root.ts               # AppRoot schema
│   │   ├── page-content.ts       # PageContent schema
│   │   ├── collection.ts         # Collection schema
│   │   └── ...
│   ├── features/                 # Feature operations
│   │   ├── bookmarks.ts
│   │   ├── feeds.ts
│   │   └── collections.ts
│   └── types/                    # TypeScript types
│
├── lib/jazz/                     # Shared utilities
│   ├── reading-list.ts           # Derived view logic
│   ├── collection-operations.ts  # Bidirectional links
│   └── namespaces/               # Namespace handlers
│
└── protocol/
    └── jazz.ts                   # Message type definitions
```

## UI ↔ Service Worker Integration (Labels)

- Popup collects label input (normalized to `labels:/...`) and sends
  a reading list collection update via runtime messages.
- Service worker applies `addCollectionToContent`, which calls
  `ensureLabelPath` to create missing parents and update children.
- Broadcasts refresh both `contentStore` and `collections` so UI
  refreshes and label hierarchy stays consistent.

## Key Components

### 1. Jazz Worker (Service Worker)

```typescript
// background/jazz-worker.ts
import "jazz-tools/load-edge-wasm"; // Required for MV3
import { startWorker } from "jazz-tools/worker";
import { getIndexedDBStorage } from "cojson-storage-indexeddb";

export async function initializeJazzWorker(accountID, accountSecret) {
  const storage = await getIndexedDBStorage("jazz-storage");

  workerInstance = await startWorker({
    accountID,
    accountSecret,
    syncServer: "wss://cloud.jazz.tools/?key=...",
    AccountSchema: createAccountSchema(),
    storage,
    asActiveAccount: true,
  });

  // Set up live subscriptions
  setupJazzSubscriptions();
}
```

### 2. Proxy Context (Popup)

```typescript
// popup/jazz/proxy/context-proxy.ts
export interface ProxyContext {
  me: {
    root: ProxyRoot;
    profile: { name: string };
    id: string;
  };
}

export interface ProxyRoot {
  collections: Record<string, Collection>; // co.record
  contentStore: Record<string, PageContent>; // co.record
  readingListIndex: string[]; // co.list
  settings: Settings;
  schemaVersion: number;
}

// Mimics JazzBrowserContextManager API
export function createProxyContextManager(): ProxyContextManager {
  return {
    getCurrentValue: () => cachedContext,
    subscribe: (callback) => {
      subscribers.add(callback);
      if (cachedContext) callback(cachedContext);
      return () => subscribers.delete(callback);
    },
  };
}
```

### 3. Message Protocol

```typescript
// protocol/jazz.ts
export interface JazzQueryRequest {
  type: 'jazz:query';
  requestId: string;
  clientId?: string;
  path: string[];           // e.g., ['root', 'contentStore', urlHash]
  resolve?: any;            // Jazz resolve spec
}

export interface JazzMutateRequest {
  type: 'jazz:mutate';
  requestId: string;
  clientId?: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'bookmark' | 'collection' | 'contentStore' | ...;
  entityId?: string;
  data?: any;
}

export interface JazzDataUpdate {
  type: 'jazz:dataUpdated';
  subscriptionId: string;
  data: any;
  indexes?: Partial<ApplicationIndexes>;
  changedPaths: string[][];
}
```

## Decision Tree

```
Building Jazz Extension Feature
│
├─ Where does Jazz live?
│  ├─ Service Worker ONLY
│  │  └─ Use startWorker() in background/jazz-worker.ts
│  │
│  └─ Popup needs data?
│     └─ Use proxy context + message protocol
│
├─ What data structure?
│  ├─ Key-value lookup (urlHash, name)
│  │  └─ Use co.record(z.string(), Schema)
│  │
│  ├─ Ordered list (timeline, index)
│  │  └─ Use co.list(Schema)
│  │
│  └─ Complex object
│     └─ Use co.map({...})
│
├─ How to read data?
│  ├─ One-time query
│  │  └─ sendRuntimeMessage({ type: 'jazz:query', ... })
│  │
│  └─ Real-time updates
│     └─ Port connection + subscription
│
└─ How to write data?
   ├─ Service Worker: Direct Jazz API
   │  └─ entity.$jazz.set('field', value)
   │
   └─ Popup: Mutation message
      └─ sendRuntimeMessage({ type: 'jazz:mutate', ... })
```

## Anti-Patterns

❌ **Never create Jazz context in popup**

```typescript
// WRONG - popup should never do this
import { createJazzContext } from 'jazz-react';
const context = createJazzContext(...);  // ❌ Breaks MV3
```

❌ **Never store CoValues in chrome.storage**

```typescript
// WRONG - CoValues must live in Jazz
chrome.storage.local.set({ data: coValue }); // ❌ Loses sync
```

❌ **Never mutate without tracking**

```typescript
// WRONG - causes sync issues
entity.$jazz.set("field", value); // ❌ Missing trackLocalMutation()
```

✅ **Correct patterns**

```typescript
// Service worker only
import { startWorker } from 'jazz-tools/worker';

// Use message protocol
const response = await sendRuntimeMessage({ type: 'jazz:mutate', ... });

// Always track mutations
trackLocalMutation(entityType, operation, entityId, { requestId, clientId });
```
