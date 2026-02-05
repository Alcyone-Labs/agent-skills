# Jazz Extension Testing

## Test Architecture

```
tests/
├── unit/                        # Unit tests (fast, isolated)
│   ├── background/             # Service worker tests
│   │   ├── jazz-worker.test.ts
│   │   ├── jazz-message-handler.test.ts
│   │   └── jazz-subscription-manager.test.ts
│   └── popup/                  # Popup tests
│       └── jazz/proxy/
│           └── context-proxy.test.ts
├── integration/                 # Integration tests
│   ├── service-worker/
│   │   └── request-access.integration.test.ts
│   └── popup/
│       └── jazz/proxy/
│           └── multi-window-sync.test.ts
├── contract/                    # Contract tests
│   └── jazz-indexeddb-contract.test.ts
└── e2e/                        # E2E tests (Playwright)
    └── smoke.spec.ts
```

## Unit Testing Service Worker

### Mock Jazz Worker

```typescript
// tests/unit/background/jazz-worker.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock jazz-tools/worker
vi.mock("jazz-tools/worker", () => ({
  startWorker: vi.fn(),
}));

// Mock cojson-storage-indexeddb
vi.mock("cojson-storage-indexeddb", () => ({
  getIndexedDBStorage: vi.fn(() => Promise.resolve({})),
}));

describe("Jazz Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetJazzWorker();
  });

  it("should initialize with account credentials", async () => {
    const { startWorker } = await import("jazz-tools/worker");

    await initializeJazzWorker("account_123", "secret_456");

    expect(startWorker).toHaveBeenCalledWith(
      expect.objectContaining({
        accountID: "account_123",
        accountSecret: "secret_456",
      }),
    );
  });
});
```

### Mock Chrome APIs

```typescript
// test/setup.ts
import "fake-indexeddb/auto";

// Mock chrome.runtime
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
    onConnect: {
      addListener: vi.fn(),
    },
    connect: vi.fn(() => ({
      postMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
      },
      onDisconnect: {
        addListener: vi.fn(),
      },
      disconnect: vi.fn(),
    })),
  },
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    },
  },
};
```

### Test Message Handlers

```typescript
// tests/unit/background/jazz-message-handler.test.ts
describe("handleJazzQuery", () => {
  it("should return serialized data for valid path", async () => {
    // Setup mock Jazz context
    const mockRoot = {
      contentStore: {
        abc123: {
          $jazz: { id: "co_123" },
          urlHash: "abc123",
          title: "Test",
        },
      },
    };

    vi.mocked(getJazzContext).mockReturnValue({
      me: { root: mockRoot },
    });

    const request: JazzQueryRequest = {
      type: "jazz:query",
      requestId: "req_123",
      path: ["root", "contentStore", "abc123"],
    };

    const response = await handleJazzQuery(request);

    expect(response.success).toBe(true);
    expect(response.data).toEqual({
      _jazzId: "co_123",
      urlHash: "abc123",
      title: "Test",
    });
  });
});
```

## Integration Testing

### Full Flow Test

```typescript
// tests/integration/popup/jazz/proxy/full-flow.test.ts
describe("Popup → Service Worker → Popup", () => {
  it("should create content and sync to all popups", async () => {
    // Mock service worker responses
    const mockData = new Map();

    vi.mocked(chrome.runtime.sendMessage).mockImplementation(
      async (message: any) => {
        if (message.type === "jazz:mutate") {
          // Simulate service worker mutation
          const { entityType, entityId, data } = message;
          mockData.set(entityId, data);

          return {
            type: "jazz:mutateResponse",
            requestId: message.requestId,
            success: true,
            entityId,
            data,
          };
        }

        if (message.type === "jazz:query") {
          return {
            type: "jazz:queryResponse",
            requestId: message.requestId,
            success: true,
            data: mockData.get(message.path[2]),
          };
        }
      },
    );

    // Test: Create content
    const response = await sendMutation("create", "contentStore", undefined, {
      urlHash: "abc123",
      title: "Test",
    });

    expect(response.success).toBe(true);
    expect(mockData.get("abc123").title).toBe("Test");
  });
});
```

### Multi-Window Sync Test

```typescript
// tests/integration/popup/jazz/proxy/multi-window-sync.test.ts
describe("Multi-window sync", () => {
  it("should sync updates across popup instances", async () => {
    // Setup two popup contexts
    const popupA = createProxyContextManager();
    const popupB = createProxyContextManager();

    // Subscribe both to collections
    const updatesA: any[] = [];
    const updatesB: any[] = [];

    popupA.subscribe((ctx) => updatesA.push(ctx));
    popupB.subscribe((ctx) => updatesB.push(ctx));

    // Simulate: Popup A makes change
    await sendMutation("update", "collection", "col_1", {
      displayName: "Updated",
    });

    // Simulate: Broadcast received by both
    simulateBroadcast({
      type: "jazz:dataUpdated",
      data: { name: "col_1", displayName: "Updated" },
    });

    // Both popups should have update
    expect(
      updatesA[updatesA.length - 1].me.root.collections.col_1.displayName,
    ).toBe("Updated");
    expect(
      updatesB[updatesB.length - 1].me.root.collections.col_1.displayName,
    ).toBe("Updated");
  });
});
```

## E2E Testing with Playwright

```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("Jazz sync across popup instances", async ({ context }) => {
  // Open two side panel instances
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  // Load extension in both
  await page1.goto("chrome-extension://.../popup.html");
  await page2.goto("chrome-extension://.../popup.html");

  // Page 1: Add bookmark
  await page1.fill('[data-testid="url-input"]', "https://example.com");
  await page1.fill('[data-testid="title-input"]', "Example");
  await page1.click('[data-testid="save-button"]');

  // Wait for sync
  await page1.waitForTimeout(1000);

  // Page 2: Should see the bookmark
  await expect(page2.locator('[data-testid="bookmark-title"]')).toHaveText(
    "Example",
  );
});
```

## Test Best Practices

### 1. Clean State Between Tests

```typescript
afterEach(async () => {
  // Reset Jazz worker
  resetJazzWorker();

  // Clear fake IndexedDB
  const dbs = await window.indexedDB.databases();
  for (const db of dbs) {
    if (db.name) {
      await new Promise((resolve, reject) => {
        const req = window.indexedDB.deleteDatabase(db.name);
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    }
  }

  // Clear mocks
  vi.clearAllMocks();
});
```

### 2. Test Error Cases

```typescript
it("should handle mutation failure", async () => {
  vi.mocked(handleJazzMutate).mockRejectedValue(new Error("Network error"));

  const response = await sendMutation("create", "bookmark", undefined, {
    url: "https://example.com",
  });

  expect(response.success).toBe(false);
  expect(response.error).toBe("Network error");
});
```

### 3. Test Optimistic Updates

```typescript
it("should rollback on mutation failure", async () => {
  const originalTitle = cachedContext.me.root.contentStore.abc123.title;

  // Apply optimistic update
  optimisticUpdateManager.applyUpdate("req_123", "contentStore", "abc123", {
    title: "New Title",
  });

  expect(cachedContext.me.root.contentStore.abc123.title).toBe("New Title");

  // Simulate failure
  optimisticUpdateManager.handleResponse("req_123", false);

  // Should rollback
  expect(cachedContext.me.root.contentStore.abc123.title).toBe(originalTitle);
});
```

## Running Tests

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# Contract tests
pnpm test:contract

# E2E tests
pnpm test:e2e

# All tests
pnpm test:run

# Watch mode
pnpm test
```
