# Playwright API Reference

Complete API signatures for testing Chrome extensions with Playwright.

## Browser Launch Options

### chromium.launch()

```typescript
interface LaunchOptions {
  // Extension loading
  args?: string[];                    // Chrome CLI arguments
  
  // Headless mode (Chrome 128+)
  headless?: boolean;                 // true for headless, false for headed
  
  // Other options
  slowMo?: number;                    // Slow down operations by ms (for debugging)
  devtools?: boolean;                 // Auto-open DevTools
  downloadsPath?: string;             // Default download directory
}
```

### Extension Loading Arguments

```typescript
// Required arguments for extension testing
const args = [
  `--load-extension=/path/to/extension`,
  `--disable-extensions-except=/path/to/extension`,
];

// Optional arguments
const optionalArgs = [
  `--headless=new`,                  // New headless mode (Chrome 128+)
  `--no-first-run`,                  // Skip first run experience
  `--no-default-browser-check`,      // Skip default browser check
  `--disable-web-security`,          // Disable CORS (use with caution)
  `--allow-insecure-localhost`,      // Allow insecure localhost
];
```

## BrowserContext

### Creating Context with Extension

```typescript
const context = await chromium.launchPersistentContext('', {
  args: [
    `--load-extension=${EXTENSION_PATH}`,
    `--disable-extensions-except=${EXTENSION_PATH}`,
  ],
});
```

### Service Worker Access

```typescript
// Get all service workers
const serviceWorkers = context.serviceWorkers();

// Wait for service worker
const serviceWorker = await context.waitForEvent('serviceworker');

// Evaluate in service worker context
await serviceWorker.evaluate(() => {
  // Code runs in service worker context
  return chrome.runtime.id;
});
```

### Background Page Access (MV2 only)

```typescript
// Get background pages (MV2 persistent background pages)
const backgroundPages = context.backgroundPages();

// Wait for background page
const backgroundPage = await context.waitForEvent('backgroundpage');
```

## Page APIs for Extension Testing

### Navigation

```typescript
// Navigate to extension page
await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);

// Navigate to side panel
await page.goto(`chrome-extension://${EXTENSION_ID}/panel.html`);

// Navigate to options page
await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
```

### Element Interaction

```typescript
// Click element
await page.click('selector');
await page.locator('selector').click();

// Fill input
await page.fill('input[name="email"]', 'test@example.com');
await page.locator('input[name="email"]').fill('test@example.com');

// Get text content
const text = await page.locator('selector').textContent();

// Get input value
const value = await page.locator('input').inputValue();

// Check visibility
await expect(page.locator('selector')).toBeVisible();
await expect(page.locator('selector')).toBeHidden();
```

### Page Evaluation

```typescript
// Evaluate in page context (content script context)
const result = await page.evaluate(() => {
  // Access DOM
  return document.title;
});

// Evaluate with arguments
const result = await page.evaluate((selector) => {
  return document.querySelector(selector)?.textContent;
}, 'my-selector');

// Evaluate with chrome APIs (if in extension page context)
const storage = await page.evaluate(async () => {
  return await chrome.storage.local.get(['key']);
});
```

## Chrome Extension APIs in Tests

### Runtime API

```typescript
// Get extension ID
const extensionId = await page.evaluate(() => {
  return chrome.runtime.id;
});

// Send message to background
const response = await page.evaluate(async () => {
  return await chrome.runtime.sendMessage({ type: 'GET_DATA' });
});

// Get manifest
const manifest = await page.evaluate(() => {
  return chrome.runtime.getManifest();
});
```

### Storage API

```typescript
// Read from storage
const data = await page.evaluate(async () => {
  return await chrome.storage.local.get(['key1', 'key2']);
});

// Write to storage
await page.evaluate(async (data) => {
  await chrome.storage.local.set(data);
}, { key: 'value' });

// Clear storage
await page.evaluate(async () => {
  await chrome.storage.local.clear();
});

// Listen to storage changes
await page.evaluate(() => {
  chrome.storage.onChanged.addListener((changes, area) => {
    console.log('Storage changed:', changes);
  });
});
```

### Tabs API

```typescript
// Get current tab
const tab = await page.evaluate(async () => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return activeTab;
});

// Create new tab
await page.evaluate(async (url) => {
  await chrome.tabs.create({ url });
}, 'https://example.com');
```

### Scripting API

```typescript
// Execute script in tab (from background)
await serviceWorker.evaluate(async (tabId) => {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      // Runs in page context
      return document.title;
    },
  });
}, page.target()._pageId);
```

## Test Fixtures

### Custom Fixture Pattern

```typescript
import { test as base, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../dist');

// Define fixtures type
interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  popupPage: Page;
  backgroundPage: Page;
}

// Extend test with fixtures
export const test = base.extend<ExtensionFixtures>({
  // Context with extension loaded
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--load-extension=${EXTENSION_PATH}`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
      ],
    });
    await use(context);
    await context.close();
  },

  // Extract extension ID
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },

  // Popup page fixture
  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await use(page);
    await page.close();
  },

  // Background page fixture (for MV2)
  backgroundPage: async ({ context }, use) => {
    const [background] = context.backgroundPages();
    if (background) {
      await use(background);
    }
  },
});

export { expect };
```

## Assertions

### Custom Extension Assertions

```typescript
// Assert extension is loaded
await expect.poll(async () => {
  return page.evaluate(() => typeof chrome !== 'undefined');
}).toBe(true);

// Assert storage has value
await expect.poll(async () => {
  const data = await page.evaluate(async () => {
    return await chrome.storage.local.get(['key']);
  });
  return data.key;
}).toBe('expected-value');

// Assert content script injected element
await expect(page.locator('#injected-by-extension')).toBeVisible();

// Assert popup has correct title
await expect(page.locator('h1')).toHaveText('Extension Title');
```

## Screenshots and Tracing

### Screenshots

```typescript
// Screenshot on failure (in config)
use: {
  screenshot: 'only-on-failure',
}

// Manual screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Screenshot specific element
await page.locator('.popup').screenshot({ path: 'popup.png' });
```

### Video Recording

```typescript
// Enable video in config
use: {
  video: 'on-first-retry',  // or 'on', 'retain-on-failure'
}

// Video saved to test-results/
```

### Tracing

```typescript
// Start tracing
await context.tracing.start({ screenshots: true, snapshots: true });

// Stop tracing
await context.tracing.stop({ path: 'trace.zip' });

// View trace: npx playwright show-trace trace.zip
```

## Network Interception

### Mocking API Calls

```typescript
// Intercept and mock API calls
test.beforeEach(async ({ context }) => {
  await context.route('https://api.example.com/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ mock: 'data' }),
    });
  });
});
```

### Monitoring Extension Requests

```typescript
// Log all network requests
page.on('request', (request) => {
  console.log('>>', request.method(), request.url());
});

// Log responses
page.on('response', (response) => {
  console.log('<<', response.status(), response.url());
});
```

## Mobile Emulation

### Testing Responsive Extension UI

```typescript
// Emulate mobile device
const context = await chromium.launchPersistentContext('', {
  args: [
    `--load-extension=${EXTENSION_PATH}`,
    `--disable-extensions-except=${EXTENSION_PATH}`,
  ],
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)...',
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
```

## Permissions

### Granting Permissions

```typescript
// Grant permissions in context
const context = await browser.newContext({
  permissions: ['notifications', 'geolocation'],
});

// Grant origin permissions
await context.grantPermissions(['clipboard-read'], {
  origin: 'https://example.com',
});
```

## Console and Error Handling

### Listening to Console

```typescript
// Listen to console messages
page.on('console', (msg) => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});

// Listen to page errors
page.on('pageerror', (error) => {
  console.error('Page error:', error.message);
});
```

## File Uploads

### Testing File Upload in Extension

```typescript
// Upload file to input
await page.locator('input[type="file"]').setInputFiles({
  name: 'test.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('test content'),
});

// Upload multiple files
await page.locator('input[type="file"]').setInputFiles([
  'path/to/file1.txt',
  'path/to/file2.txt',
]);
```

## Keyboard and Mouse

### Keyboard Interactions

```typescript
// Type text
await page.keyboard.type('Hello World');

// Press keys
await page.keyboard.press('Control+a');
await page.keyboard.press('Enter');

// Press shortcut
await page.keyboard.press('Control+Shift+P');
```

### Mouse Interactions

```typescript
// Click at coordinates
await page.mouse.click(100, 200);

// Drag and drop
await page.mouse.move(100, 100);
await page.mouse.down();
await page.mouse.move(200, 200);
await page.mouse.up();
```
