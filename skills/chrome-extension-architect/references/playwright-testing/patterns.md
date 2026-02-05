# Playwright Testing Patterns

Common testing scenarios and multi-step flows for Chrome extension testing.

## Pattern 1: Testing Popup UI

### Basic Popup Test

```typescript
// e2e/tests/popup.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Popup UI', () => {
  test('popup loads and displays correctly', async ({ popupPage }) => {
    // Verify popup title
    await expect(popupPage.locator('h1')).toHaveText('My Extension');
    
    // Verify main elements are visible
    await expect(popupPage.locator('[data-testid="main-button"]')).toBeVisible();
    await expect(popupPage.locator('[data-testid="settings-link"]')).toBeVisible();
  });

  test('popup button triggers action', async ({ popupPage }) => {
    // Click button
    await popupPage.click('[data-testid="action-button"]');
    
    // Verify feedback
    await expect(popupPage.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(popupPage.locator('[data-testid="success-message"]')).toHaveText('Action completed!');
  });

  test('popup form submission', async ({ popupPage }) => {
    // Fill form
    await popupPage.fill('[data-testid="input-field"]', 'test value');
    
    // Submit
    await popupPage.click('[data-testid="submit-button"]');
    
    // Verify result
    await expect(popupPage.locator('[data-testid="result"]')).toContainText('test value');
  });
});
```

### Popup with Storage Integration

```typescript
// e2e/tests/popup-storage.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Popup with Storage', () => {
  test('popup displays stored data', async ({ popupPage }) => {
    // Pre-populate storage via evaluate
    await popupPage.evaluate(async () => {
      await chrome.storage.local.set({ 
        userName: 'John Doe',
        settings: { theme: 'dark' }
      });
    });
    
    // Reload popup to pick up storage changes
    await popupPage.reload();
    
    // Verify stored data is displayed
    await expect(popupPage.locator('[data-testid="user-name"]')).toHaveText('John Doe');
    await expect(popupPage.locator('[data-testid="theme-indicator"]')).toHaveText('dark');
  });

  test('popup saves data to storage', async ({ popupPage }) => {
    // Fill and submit form
    await popupPage.fill('[data-testid="api-key-input"]', 'secret-key-123');
    await popupPage.click('[data-testid="save-button"]');
    
    // Verify storage was updated
    const storage = await popupPage.evaluate(async () => {
      return await chrome.storage.local.get(['apiKey']);
    });
    
    expect(storage.apiKey).toBe('secret-key-123');
  });
});
```

## Pattern 2: Testing Side Panel

### Side Panel Basic Test

```typescript
// e2e/tests/sidepanel.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Side Panel', () => {
  test('side panel loads correctly', async ({ sidePanelPage }) => {
    await expect(sidePanelPage.locator('h1')).toHaveText('Side Panel');
    await expect(sidePanelPage.locator('[data-testid="content-area"]')).toBeVisible();
  });

  test('side panel navigation', async ({ sidePanelPage }) => {
    // Click nav item
    await sidePanelPage.click('[data-testid="nav-settings"]');
    
    // Verify settings view is shown
    await expect(sidePanelPage.locator('[data-testid="settings-view"]')).toBeVisible();
    await expect(sidePanelPage.locator('[data-testid="main-view"]')).toBeHidden();
  });

  test('side panel per-tab context', async ({ context, extensionId }) => {
    // Open two tabs
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();
    
    await tab1.goto('https://example.com/page1');
    await tab2.goto('https://example.com/page2');
    
    // Open side panel for tab1
    const sidePanel1 = await context.newPage();
    await sidePanel1.goto(`chrome-extension://${extensionId}/panel.html?tabId=${tab1.target()._pageId}`);
    
    // Verify context is for page1
    await expect(sidePanel1.locator('[data-testid="page-url"]')).toContainText('page1');
  });
});
```

## Pattern 3: Testing Content Scripts

### Content Script Injection Test

```typescript
// e2e/tests/content.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Content Script', () => {
  test('content script injects on matching page', async ({ context }) => {
    // Navigate to page that matches content script pattern
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Wait for content script to inject
    await page.waitForSelector('#extension-injected-element', { timeout: 5000 });
    
    // Verify injected element
    const injectedElement = page.locator('#extension-injected-element');
    await expect(injectedElement).toBeVisible();
    await expect(injectedElement).toHaveText('Extension Active');
  });

  test('content script does not inject on non-matching page', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://other-site.com');
    
    // Wait a bit to ensure no injection
    await page.waitForTimeout(1000);
    
    // Verify element was not injected
    const injectedElement = page.locator('#extension-injected-element');
    await expect(injectedElement).not.toBeVisible();
  });

  test('content script modifies page content', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Wait for modification
    await page.waitForFunction(() => {
      const headings = document.querySelectorAll('h1.modified-by-extension');
      return headings.length > 0;
    });
    
    // Verify modification
    const modifiedHeading = page.locator('h1.modified-by-extension').first();
    await expect(modifiedHeading).toHaveCSS('background-color', 'rgb(255, 255, 0)');
  });
});
```

### Content Script to Background Communication

```typescript
// e2e/tests/content-messaging.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Content Script Messaging', () => {
  test('content script sends message to background', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Trigger action that sends message
    await page.click('#page-button');
    
    // Verify storage was updated by background
    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(`chrome-extension://${extensionId}/panel.html`);
    
    await expect(sidePanelPage.locator('[data-testid="message-count"]')).toHaveText('1');
  });

  test('content script receives response from background', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Execute content script function that sends message
    const response = await page.evaluate(async () => {
      return await chrome.runtime.sendMessage({ type: 'GET_USER_DATA' });
    });
    
    expect(response).toEqual({ userName: 'Test User', id: 123 });
  });
});
```

## Pattern 4: Testing Service Worker

### Service Worker Lifecycle Test

```typescript
// e2e/tests/background.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Service Worker', () => {
  test('service worker responds to messages', async ({ serviceWorker }) => {
    // Send message to service worker
    const response = await serviceWorker.evaluate(async () => {
      // Simulate receiving a message (in real scenario, this would come from content script)
      return await chrome.runtime.sendMessage({ type: 'PING' });
    });
    
    expect(response).toBe('pong');
  });

  test('service worker handles storage operations', async ({ serviceWorker }) => {
    // Set data via service worker
    await serviceWorker.evaluate(async () => {
      await chrome.storage.local.set({ testKey: 'testValue' });
    });
    
    // Read data back
    const data = await serviceWorker.evaluate(async () => {
      return await chrome.storage.local.get(['testKey']);
    });
    
    expect(data.testKey).toBe('testValue');
  });

  test('service worker alarm triggers', async ({ serviceWorker }) => {
    // Create alarm
    await serviceWorker.evaluate(async () => {
      await chrome.alarms.create('test-alarm', { delayInMinutes: 0.1 });
    });
    
    // Wait for alarm to trigger
    await serviceWorker.waitForTimeout(7000); // 0.1 min = 6 seconds
    
    // Verify alarm triggered (check storage or some side effect)
    const alarmTriggered = await serviceWorker.evaluate(async () => {
      return await chrome.storage.local.get(['alarmTriggered']);
    });
    
    expect(alarmTriggered.alarmTriggered).toBe(true);
  });
});
```

### Service Worker Event Handling

```typescript
// e2e/tests/background-events.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Service Worker Events', () => {
  test('onInstalled event fires', async ({ context }) => {
    // This test requires fresh extension install
    // You may need to launch new context for this
    
    const serviceWorker = await context.waitForEvent('serviceworker');
    
    // Check if install data was set
    const installData = await serviceWorker.evaluate(async () => {
      return await chrome.storage.local.get(['installDate']);
    });
    
    expect(installData.installDate).toBeDefined();
  });

  test('tab activation triggers background logic', async ({ context, extensionId }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto('https://site1.com');
    await page2.goto('https://site2.com');
    
    // Activate page2
    await page2.bringToFront();
    
    // Verify background tracked the activation
    const sidePanel = await context.newPage();
    await sidePanel.goto(`chrome-extension://${extensionId}/panel.html`);
    
    await expect(sidePanel.locator('[data-testid="active-tab-url"]')).toContainText('site2.com');
  });
});
```

## Pattern 5: End-to-End User Flows

### Complete User Journey

```typescript
// e2e/tests/user-flow.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Complete User Flows', () => {
  test('user saves note from popup and views in side panel', async ({ 
    context, 
    extensionId,
    popupPage 
  }) => {
    // Step 1: Open popup and add note
    await popupPage.fill('[data-testid="note-input"]', 'My important note');
    await popupPage.click('[data-testid="save-note-button"]');
    
    // Step 2: Verify success in popup
    await expect(popupPage.locator('[data-testid="save-success"]')).toBeVisible();
    
    // Step 3: Open side panel and verify note appears
    const sidePanel = await context.newPage();
    await sidePanel.goto(`chrome-extension://${extensionId}/panel.html`);
    
    await expect(sidePanel.locator('[data-testid="note-list"]')).toContainText('My important note');
  });

  test('user extracts data from page via content script', async ({ 
    context, 
    extensionId,
    popupPage 
  }) => {
    // Step 1: Navigate to target page
    const targetPage = await context.newPage();
    await targetPage.goto('https://example.com/article');
    
    // Step 2: Open popup and trigger extraction
    await popupPage.click('[data-testid="extract-button"]');
    
    // Step 3: Verify extraction success
    await expect(popupPage.locator('[data-testid="extracted-count"]')).toHaveText(/\d+ items extracted/);
    
    // Step 4: Verify data in side panel
    const sidePanel = await context.newPage();
    await sidePanel.goto(`chrome-extension://${extensionId}/panel.html`);
    
    await expect(sidePanel.locator('[data-testid="extracted-list"] .item')).toHaveCount(3);
  });

  test('full authentication flow', async ({ 
    context, 
    extensionId,
    popupPage,
    serviceWorker 
  }) => {
    // Step 1: Open popup, click login
    await popupPage.click('[data-testid="login-button"]');
    
    // Step 2: Handle OAuth popup
    const [authPage] = await Promise.all([
      context.waitForEvent('page'),
      popupPage.click('[data-testid="login-button"]'),
    ]);
    
    // Step 3: Fill OAuth form
    await authPage.fill('#email', 'test@example.com');
    await authPage.fill('#password', 'password123');
    await authPage.click('#submit');
    
    // Step 4: Wait for redirect back to extension
    await authPage.waitForURL(/chrome-extension:\/\/.*/);
    
    // Step 5: Verify auth state in service worker
    const authState = await serviceWorker.evaluate(async () => {
      return await chrome.storage.local.get(['authToken', 'user']);
    });
    
    expect(authState.authToken).toBeDefined();
    expect(authState.user).toBeDefined();
    
    // Step 6: Verify UI reflects logged-in state
    await popupPage.reload();
    await expect(popupPage.locator('[data-testid="user-name"]')).toHaveText('Test User');
  });
});
```

## Pattern 6: Cross-Context Communication

### Message Passing Between Contexts

```typescript
// e2e/tests/messaging.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Cross-Context Messaging', () => {
  test('popup sends message to content script', async ({ context, extensionId }) => {
    // Open target page
    const contentPage = await context.newPage();
    await contentPage.goto('https://example.com');
    
    // Wait for content script to be ready
    await contentPage.waitForTimeout(500);
    
    // Open popup
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Click button that sends message to content script
    await popup.click('[data-testid="highlight-button"]');
    
    // Verify content script received message
    const highlightCount = await contentPage.evaluate(() => {
      return document.querySelectorAll('.extension-highlight').length;
    });
    
    expect(highlightCount).toBeGreaterThan(0);
  });

  test('long-lived port communication', async ({ context, extensionId }) => {
    // Open content page
    const contentPage = await context.newPage();
    await contentPage.goto('https://example.com');
    
    // Open side panel (establishes port)
    const sidePanel = await context.newPage();
    await sidePanel.goto(`chrome-extension://${extensionId}/panel.html`);
    
    // Trigger action in content page
    await contentPage.click('#some-button');
    
    // Verify side panel received update via port
    await expect(sidePanel.locator('[data-testid="status"]')).toHaveText('Connected');
    await expect(sidePanel.locator('[data-testid="event-count"]')).toHaveText('1');
  });
});
```

## Pattern 7: Storage Synchronization

### Multi-Context Storage Tests

```typescript
// e2e/tests/storage-sync.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Storage Synchronization', () => {
  test('storage changes sync across contexts', async ({ 
    context, 
    extensionId,
    popupPage 
  }) => {
    // Open side panel
    const sidePanel = await context.newPage();
    await sidePanel.goto(`chrome-extension://${extensionId}/panel.html`);
    
    // Change setting in popup
    await popupPage.click('[data-testid="theme-toggle"]');
    
    // Verify side panel received the change
    await expect(sidePanel.locator('[data-testid="current-theme"]')).toHaveText('dark');
  });

  test('storage persists across page reloads', async ({ popupPage }) => {
    // Set value
    await popupPage.fill('[data-testid="api-key"]', 'my-api-key');
    await popupPage.click('[data-testid="save"]');
    
    // Reload popup
    await popupPage.reload();
    
    // Verify value persisted
    await expect(popupPage.locator('[data-testid="api-key"]')).toHaveValue('my-api-key');
  });

  test('storage.clear removes all data', async ({ popupPage }) => {
    // Add data
    await popupPage.evaluate(async () => {
      await chrome.storage.local.set({ key1: 'value1', key2: 'value2' });
    });
    
    // Clear storage
    await popupPage.click('[data-testid="clear-data"]');
    
    // Verify storage is empty
    const storage = await popupPage.evaluate(async () => {
      return await chrome.storage.local.get(null);
    });
    
    expect(Object.keys(storage)).toHaveLength(0);
  });
});
```

## Pattern 8: Permission Testing

### Permission Request Flows

```typescript
// e2e/tests/permissions.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Permission Handling', () => {
  test('optional permission request', async ({ context, extensionId }) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Click button that requests permission
    await popup.click('[data-testid="request-host-permission"]');
    
    // Handle permission dialog (if shown)
    // Note: Permission dialogs may not be interactable in headless mode
    // Consider mocking or using --auto-accept-interactive
    
    // Verify permission was granted
    const hasPermission = await popup.evaluate(async () => {
      return await chrome.permissions.contains({
        origins: ['https://example.com/*'],
      });
    });
    
    expect(hasPermission).toBe(true);
  });

  test('feature disabled without permission', async ({ context, extensionId }) => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Verify feature is disabled
    const featureButton = popup.locator('[data-testid="premium-feature"]');
    await expect(featureButton).toBeDisabled();
    await expect(popup.locator('[data-testid="permission-warning"]')).toBeVisible();
  });
});
```

## Pattern 9: Error Handling

### Testing Error Scenarios

```typescript
// e2e/tests/errors.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Error Handling', () => {
  test('network error handling', async ({ context, extensionId }) => {
    // Mock failed API call
    await context.route('https://api.example.com/*', async (route) => {
      await route.abort('failed');
    });
    
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Trigger API call
    await popup.click('[data-testid="fetch-data"]');
    
    // Verify error message shown
    await expect(popup.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(popup.locator('[data-testid="error-message"]')).toContainText('Failed to fetch');
  });

  test('invalid input handling', async ({ popupPage }) => {
    // Submit empty form
    await popupPage.click('[data-testid="submit"]');
    
    // Verify validation error
    await expect(popupPage.locator('[data-testid="input-error"]')).toBeVisible();
    await expect(popupPage.locator('[data-testid="input-error"]')).toHaveText('This field is required');
  });

  test('service worker error recovery', async ({ serviceWorker }) => {
    // Trigger error in service worker
    const result = await serviceWorker.evaluate(async () => {
      try {
        await chrome.storage.local.get(null);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(result.success).toBe(true);
  });
});
```

## Pattern 10: Performance Testing

### Load and Performance Tests

```typescript
// e2e/tests/performance.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Performance', () => {
  test('popup loads within acceptable time', async ({ context, extensionId }) => {
    const startTime = Date.now();
    
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Wait for main content
    await popup.waitForSelector('[data-testid="main-content"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
  });

  test('large dataset rendering performance', async ({ sidePanelPage }) => {
    // Populate with large dataset
    await sidePanelPage.evaluate(async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(100),
      }));
      await chrome.storage.local.set({ items: largeDataset });
    });
    
    // Measure render time
    const startTime = Date.now();
    await sidePanelPage.reload();
    await sidePanelPage.waitForSelector('[data-testid="item-999"]');
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(3000); // Should render in under 3 seconds
  });

  test('memory usage stays within bounds', async ({ context, extensionId }) => {
    const sidePanel = await context.newPage();
    await sidePanel.goto(`chrome-extension://${extensionId}/panel.html`);
    
    // Get initial memory
    const initialMetrics = await sidePanel.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform operations
    for (let i = 0; i < 100; i++) {
      await sidePanel.click('[data-testid="add-item"]');
    }
    
    // Force garbage collection if available
    await sidePanel.evaluate(() => {
      if (window.gc) window.gc();
    });
    
    // Get final memory
    const finalMetrics = await sidePanel.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory should not grow unbounded
    const growth = finalMetrics - initialMetrics;
    expect(growth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
  });
});
```

## Pattern 11: Visual Regression

### Screenshot Comparison Tests

```typescript
// e2e/tests/visual.spec.ts
import { test, expect } from '../fixtures/extension';

test.describe('Visual Regression', () => {
  test('popup visual appearance', async ({ popupPage }) => {
    // Wait for fonts and styles to load
    await popupPage.waitForLoadState('networkidle');
    
    // Compare screenshot
    await expect(popupPage.locator('body')).toHaveScreenshot('popup.png');
  });

  test('side panel responsive layout', async ({ sidePanelPage }) => {
    // Test at different widths
    const widths = [300, 400, 500];
    
    for (const width of widths) {
      await sidePanelPage.setViewportSize({ width, height: 800 });
      await sidePanelPage.waitForTimeout(100); // Allow layout to settle
      
      await expect(sidePanelPage.locator('body')).toHaveScreenshot(`sidepanel-${width}.png`);
    }
  });

  test('dark mode appearance', async ({ popupPage }) => {
    // Enable dark mode
    await popupPage.evaluate(async () => {
      await chrome.storage.local.set({ theme: 'dark' });
    });
    
    await popupPage.reload();
    await popupPage.waitForSelector('[data-theme="dark"]');
    
    await expect(popupPage.locator('body')).toHaveScreenshot('popup-dark.png');
  });
});
```
