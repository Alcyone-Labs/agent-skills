# Playwright Testing Gotchas

Common pitfalls, limitations, and workarounds for Chrome extension testing with Playwright.

## Headless Mode Limitations

### Chrome Version Requirement

**Issue**: Extensions don't load in old headless mode (`--headless` without `=new`).

**Solution**: Use Chrome 128+ with new headless mode:

```typescript
const context = await chromium.launchPersistentContext('', {
  headless: true,
  args: [
    `--load-extension=${EXTENSION_PATH}`,
    '--headless=new',  // Required for extensions in headless
  ],
});
```

**Verification**:

```bash
# Check Chrome version
google-chrome --version

# Must be 128 or higher for headless extension support
```

### Permission Dialogs in Headless

**Issue**: Permission dialogs (notifications, camera, etc.) cannot be interacted with in headless mode.

**Workarounds**:

1. **Pre-grant permissions**:

```typescript
const context = await browser.newContext({
  permissions: ['notifications', 'geolocation'],
});
```

2. **Use CLI flags to auto-accept**:

```typescript
const args = [
  `--load-extension=${EXTENSION_PATH}`,
  '--auto-accept-interactive',  // Auto-accept permission prompts
];
```

3. **Mock permission API**:

```typescript
await page.evaluate(() => {
  // Override permission query
  const originalQuery = navigator.permissions.query;
  navigator.permissions.query = async (parameters) => {
    if (parameters.name === 'notifications') {
      return { state: 'granted', onchange: null } as any;
    }
    return originalQuery(parameters);
  };
});
```

## Extension ID Instability

### Dynamic Extension IDs

**Issue**: Extension ID changes between test runs when using `--load-extension`.

**Solutions**:

1. **Pin extension ID with manifest key**:

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  // ... rest of manifest
}
```

Generate key:

```bash
# Use openssl to generate consistent key
openssl genrsa 2048 | openssl rsa -pubout
```

2. **Extract ID from service worker at runtime**:

```typescript
const getExtensionId = async (context: BrowserContext): Promise<string> => {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  return serviceWorker.url().split('/')[2];
};
```

3. **Use chrome.runtime.id in evaluate**:

```typescript
const extensionId = await page.evaluate(() => chrome.runtime.id);
```

## Service Worker Lifecycle Issues

### Service Worker Not Ready

**Issue**: Tests fail because service worker hasn't started yet.

**Symptoms**:

```
Error: No service workers found
Error: Cannot read properties of undefined (reading 'evaluate')
```

**Solution**: Always wait for service worker:

```typescript
const getServiceWorker = async (context: BrowserContext) => {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }
  return serviceWorker;
};
```

### Service Worker Terminates During Test

**Issue**: Service worker terminates mid-test due to inactivity.

**Symptoms**: Messages timeout, storage operations fail intermittently.

**Workarounds**:

1. **Keep service worker alive with periodic messages**:

```typescript
test.beforeEach(async ({ context }) => {
  const keepAlive = setInterval(async () => {
    const sw = await getServiceWorker(context);
    await sw.evaluate(() => true);  // Ping
  }, 20000);  // Every 20 seconds
  
  test.afterEach(() => clearInterval(keepAlive));
});
```

2. **Use alarms API to keep alive** (in extension code):

```typescript
// background.js
chrome.alarms.create('keep-alive', { periodInMinutes: 0.5 });
```

## Storage Isolation Issues

### Storage Persists Between Tests

**Issue**: `chrome.storage.local` data persists across test runs in persistent context.

**Solution**: Clear storage before each test:

```typescript
test.beforeEach(async ({ context }) => {
  const page = await context.newPage();
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.session?.clear();
    await chrome.storage.sync.clear();
  });
  await page.close();
});
```

### Storage Not Available in Some Contexts

**Issue**: `chrome.storage` is undefined in certain page contexts.

**Cause**: Trying to access storage from non-extension pages.

**Solution**: Only access storage from extension pages or service worker:

```typescript
// ✅ Correct: From extension page
await popupPage.evaluate(async () => {
  return await chrome.storage.local.get(['key']);
});

// ❌ Wrong: From regular page
await regularPage.evaluate(async () => {
  return await chrome.storage.local.get(['key']);  // chrome is undefined
});
```

## Content Script Timing Issues

### Content Script Not Injected

**Issue**: Content script hasn't injected by the time test checks for it.

**Symptoms**: Element not found errors.

**Solutions**:

1. **Wait for element with timeout**:

```typescript
await page.waitForSelector('#injected-element', { timeout: 10000 });
```

2. **Wait for custom event from content script**:

```typescript
// In content script
window.dispatchEvent(new CustomEvent('extension-ready'));

// In test
await page.waitForEvent('console', msg => 
  msg.text().includes('Extension content script loaded')
);
```

3. **Poll for element**:

```typescript
await expect.poll(async () => {
  return page.locator('#injected-element').isVisible();
}).toBe(true);
```

### Content Script Inject Race Condition

**Issue**: Content script injects before page fully loads, missing dynamic content.

**Solution**: Use `run_at: "document_idle"` in manifest:

```json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}
```

Or manually trigger re-injection in test:

```typescript
await page.evaluate(() => {
  // Force content script re-run
  chrome.runtime.sendMessage({ type: 'REINJECT' });
});
```

## Message Passing Pitfalls

### Message Timeouts

**Issue**: `chrome.runtime.sendMessage` times out in tests.

**Common Causes**:

1. **Service worker not listening**:

```typescript
// ❌ Wrong: Listener registered asynchronously
setTimeout(() => {
  chrome.runtime.onMessage.addListener(handler);
}, 100);

// ✅ Correct: Listener at top level
chrome.runtime.onMessage.addListener(handler);
```

2. **Async response without return true**:

```typescript
// ❌ Wrong: Async without return true
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  fetchData().then(data => sendResponse(data));
  // Missing return true!
});

// ✅ Correct: Return true for async
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  fetchData().then(data => sendResponse(data));
  return true;  // Keep channel open
});
```

### Cross-Origin Messaging Restrictions

**Issue**: Cannot send messages between http:// and chrome-extension:// pages directly.

**Solution**: Use service worker as relay:

```typescript
// content script -> background -> popup
// All communication goes through service worker
```

## Popup/Panel URL Access

### Cannot Open Popup via Action Click

**Issue**: `chrome.action.openPopup()` is not available in MV3.

**Workaround**: Navigate directly to popup URL:

```typescript
const popupPage = await context.newPage();
await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
```

### Side Panel Cannot Be Programmatically Opened

**Issue**: `chrome.sidePanel.open()` requires user gesture.

**Workaround**: Test side panel by navigating directly:

```typescript
const sidePanelPage = await context.newPage();
await sidePanelPage.goto(`chrome-extension://${extensionId}/panel.html`);
```

Note: This tests the panel UI but not the open behavior.

## File Path Issues

### Extension Path Resolution

**Issue**: Relative paths don't work correctly in CI.

**Solution**: Always use absolute paths:

```typescript
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../../dist');

const context = await chromium.launchPersistentContext('', {
  args: [
    `--load-extension=${EXTENSION_PATH}`,
  ],
});
```

### Extension Not Found

**Issue**: `Failed to load extension` error.

**Checklist**:

1. Extension is built before tests run
2. Path points to directory with `manifest.json`
3. Manifest is valid JSON
4. All referenced files exist

```typescript
// Add to global setup
import fs from 'fs';
import { execSync } from 'child_process';

if (!fs.existsSync('./dist/manifest.json')) {
  console.log('Building extension...');
  execSync('npm run build', { stdio: 'inherit' });
}
```

## CI/CD Specific Issues

### Tests Pass Locally but Fail in CI

**Common Causes**:

1. **Different Chrome versions**:

```yaml
# GitHub Actions - Pin Chrome version
- uses: browser-actions/setup-chrome@v1
  with:
    chrome-version: 128
```

2. **Missing display (Linux)**:

```yaml
# Use xvfb for headed mode in CI
- run: xvfb-run npx playwright test
```

3. **Timing differences**:

```typescript
// Increase timeouts in CI
const timeout = process.env.CI ? 30000 : 10000;
await page.waitForSelector('#element', { timeout });
```

### Screenshot Differences in CI

**Issue**: Visual regression tests fail due to font rendering differences.

**Solutions**:

1. **Use consistent Docker image**:

```yaml
# GitHub Actions
runs-on: ubuntu-latest
container:
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
```

2. **Mask dynamic content**:

```typescript
await expect(page).toHaveScreenshot({
  mask: [page.locator('.timestamp'), page.locator('.random-id')],
});
```

## Debugging Techniques

### Enable Verbose Logging

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    launchOptions: {
      args: [
        `--load-extension=${EXTENSION_PATH}`,
        '--enable-logging=stderr',
        '--v=1',  // Verbose logging
      ],
    },
  },
});
```

### Capture Extension Console Output

```typescript
// Listen to all console messages
page.on('console', (msg) => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});

// Listen to service worker console
serviceWorker.on('console', (msg) => {
  console.log(`[SW ${msg.type()}] ${msg.text()}`);
});
```

### Screenshot on Failure

```typescript
// playwright.config.ts - Already enabled by default
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
```

### Pause for Manual Inspection

```typescript
test('debug test', async ({ page }) => {
  // ... test steps
  
  // Pause execution - opens Playwright Inspector
  await page.pause();
  
  // Or use debug mode
  await test.step('inspect state', async () => {
    console.log(await page.content());
  });
});
```

## Known Limitations

### Cannot Test Native Messaging

Native messaging requires external host application that cannot be automated in Playwright.

**Workaround**: Mock native messaging in tests:

```typescript
await page.evaluate(() => {
  // Override native messaging API
  chrome.runtime.connectNative = () => {
    return {
      postMessage: (msg: any) => {
        // Mock response
      },
      onMessage: {
        addListener: (cb: any) => {
          cb({ response: 'mocked' });
        },
      },
    };
  };
});
```

### Cannot Test Chrome Web Store APIs

Web store APIs (`chrome.webstore`) are not available in loaded extensions.

### Limited Offscreen Document Testing

Offscreen documents may not be accessible in headless mode.

**Workaround**: Test in headed mode or mock offscreen functionality.

### Service Worker Inspector Limitations

Cannot directly inspect service worker network requests in Playwright.

**Workaround**: Log requests in service worker code:

```typescript
// background.js
self.addEventListener('fetch', (event) => {
  console.log('[SW Fetch]', event.request.url);
});
```

## Best Practices Summary

1. **Always wait for service worker** before interacting with extension
2. **Clear storage between tests** to avoid state leakage
3. **Use absolute paths** for extension loading
4. **Handle permission dialogs** with CLI flags or pre-grants
5. **Pin extension ID** for consistent URLs
6. **Add delays** after page navigation for content script injection
7. **Return true** from async message listeners
8. **Use fixtures** to encapsulate setup/teardown
9. **Enable tracing** for debugging CI failures
10. **Test in both headed and headless** modes locally
