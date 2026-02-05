# Playwright Configuration Reference

Complete setup guide for Playwright Chrome extension testing.

## Project Structure

```
my-extension/
├── src/                          # Extension source code
├── dist/                         # Built extension (target for tests)
├── e2e/                          # Playwright tests
│   ├── fixtures/
│   │   └── extension.ts          # Extension test fixtures
│   ├── tests/
│   │   ├── popup.spec.ts         # Popup tests
│   │   ├── sidepanel.spec.ts     # Side panel tests
│   │   ├── content.spec.ts       # Content script tests
│   │   └── background.spec.ts    # Service worker tests
│   ├── utils/
│   │   └── helpers.ts            # Test utilities
│   └── playwright.config.ts      # Playwright configuration
├── playwright.config.ts          # Alternative: root config
└── package.json
```

## Installation

```bash
# Initialize project
npm init -y

# Install Playwright
npm install -D @playwright/test
npx playwright install chromium

# TypeScript (optional but recommended)
npm install -D typescript @types/node

# Add scripts to package.json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Playwright Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Path to built extension
const EXTENSION_PATH = path.join(__dirname, 'dist');

export default defineConfig({
  testDir: './e2e/tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on first retry
    video: 'on-first-retry',
    
    // Trace on first retry
    trace: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Launch options for extension testing
        launchOptions: {
          args: [
            `--load-extension=${EXTENSION_PATH}`,
            `--disable-extensions-except=${EXTENSION_PATH}`,
          ],
        },
      },
    },
  ],
});
```

### Headless Configuration (CI/CD)

```typescript
// playwright.config.ts - Headless mode for CI
export default defineConfig({
  // ... other config
  
  projects: [
    {
      name: 'chromium-headless',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          headless: true,  // Requires Chrome 128+
          args: [
            `--load-extension=${EXTENSION_PATH}`,
            `--disable-extensions-except=${EXTENSION_PATH}`,
            '--headless=new',  // New headless mode
          ],
        },
      },
    },
  ],
});
```

### Multiple Environment Configuration

```typescript
// playwright.config.ts - Multiple environments
export default defineConfig({
  // ... base config
  
  projects: [
    // Development: headed mode for debugging
    {
      name: 'dev',
      use: {
        headless: false,
        launchOptions: {
          args: [
            `--load-extension=${EXTENSION_PATH}`,
            `--disable-extensions-except=${EXTENSION_PATH}`,
          ],
          slowMo: 100,  // Slow down for visibility
        },
      },
    },
    
    // CI: headless mode
    {
      name: 'ci',
      use: {
        headless: true,
        launchOptions: {
          args: [
            `--load-extension=${EXTENSION_PATH}`,
            `--disable-extensions-except=${EXTENSION_PATH}`,
            '--headless=new',
          ],
        },
      },
    },
    
    // Debug: with DevTools open
    {
      name: 'debug',
      use: {
        headless: false,
        launchOptions: {
          args: [
            `--load-extension=${EXTENSION_PATH}`,
            `--disable-extensions-except=${EXTENSION_PATH}`,
            '--auto-open-devtools-for-tabs',
          ],
          devtools: true,
        },
      },
    },
  ],
});
```

## Extension Fixtures

### e2e/fixtures/extension.ts

```typescript
import { test as base, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../dist');

// Define fixture types
export interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  popupPage: Page;
  sidePanelPage: Page;
  optionsPage: Page;
  serviceWorker: Page;
}

/**
 * Extended test with extension fixtures
 * 
 * Usage:
 * import { test, expect } from '../fixtures/extension';
 * 
 * test('popup works', async ({ popupPage }) => {
 *   await expect(popupPage.locator('h1')).toBeVisible();
 * });
 */
export const test = base.extend<ExtensionFixtures>({
  // Create context with extension loaded
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--load-extension=${EXTENSION_PATH}`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });
    
    await use(context);
    await context.close();
  },

  // Extract extension ID from service worker
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be ready
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    
    // Extract ID from URL: chrome-extension://ID/background.js
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },

  // Popup page fixture
  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await use(page);
    await page.close();
  },

  // Side panel page fixture
  sidePanelPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/panel.html`);
    await use(page);
    await page.close();
  },

  // Options page fixture
  optionsPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await use(page);
    await page.close();
  },

  // Service worker page fixture
  serviceWorker: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    await use(serviceWorker);
  },
});

export { expect };
```

### Alternative: Minimal Fixture

```typescript
// e2e/fixtures/extension-minimal.ts
import { test as base, expect, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../dist');

export const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      args: [
        `--load-extension=${EXTENSION_PATH}`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
      ],
    });
    await use(context);
    await context.close();
  },
});

export { expect };
```

## Test Utilities

### e2e/utils/helpers.ts

```typescript
import { Page, BrowserContext } from '@playwright/test';

/**
 * Get extension ID from service worker
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  return serviceWorker.url().split('/')[2];
}

/**
 * Open popup page
 */
export async function openPopup(
  context: BrowserContext,
  extensionId: string
): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}

/**
 * Open side panel
 */
export async function openSidePanel(
  context: BrowserContext,
  extensionId: string
): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/panel.html`);
  return page;
}

/**
 * Send message to service worker
 */
export async function sendMessageToBackground(
  context: BrowserContext,
  message: unknown
): Promise<unknown> {
  const [serviceWorker] = context.serviceWorkers();
  return serviceWorker.evaluate(async (msg) => {
    return await chrome.runtime.sendMessage(msg);
  }, message);
}

/**
 * Get storage data
 */
export async function getStorage(
  page: Page,
  keys: string | string[]
): Promise<Record<string, unknown>> {
  return page.evaluate(async (storageKeys) => {
    return await chrome.storage.local.get(storageKeys);
  }, keys);
}

/**
 * Set storage data
 */
export async function setStorage(
  page: Page,
  data: Record<string, unknown>
): Promise<void> {
  await page.evaluate(async (storageData) => {
    await chrome.storage.local.set(storageData);
  }, data);
}

/**
 * Clear storage
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
  });
}

/**
 * Wait for element to have specific text
 */
export async function waitForText(
  page: Page,
  selector: string,
  text: string,
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (sel, expectedText) => {
      const element = document.querySelector(sel);
      return element?.textContent?.includes(expectedText);
    },
    selector,
    text,
    { timeout }
  );
}

/**
 * Check if content script is injected
 */
export async function isContentScriptInjected(
  page: Page,
  markerId: string
): Promise<boolean> {
  return page.evaluate((id) => {
    return !!document.getElementById(id);
  }, markerId);
}
```

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["@playwright/test", "node"]
  },
  "include": ["e2e/**/*", "src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Environment Variables

### .env.example

```bash
# Playwright configuration
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOW_MO=0
PLAYWRIGHT_TIMEOUT=30000

# Extension paths
EXTENSION_PATH=./dist
EXTENSION_BUILD_COMMAND=npm run build

# Test configuration
CI=false
DEBUG=false
```

### Loading Environment Variables

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const EXTENSION_PATH = process.env.EXTENSION_PATH || path.join(__dirname, 'dist');
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS === 'true';
const SLOW_MO = parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0');

export default defineConfig({
  // ... config using environment variables
});
```

## CI/CD Configuration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build extension
        run: npm run build
      
      - name: Install Playwright
        run: npx playwright install chromium
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          PLAYWRIGHT_HEADLESS: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
```

### GitLab CI

```yaml
# .gitlab-ci.yml
e2e_tests:
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  
  stages:
    - test
  
  script:
    - npm ci
    - npm run build
    - npx playwright test
  
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 7 days
```

## Build Integration

### Pre-test Build

```typescript
// e2e/global-setup.ts
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

async function globalSetup() {
  const distPath = path.join(__dirname, '../dist');
  
  // Build extension if dist doesn't exist or is outdated
  if (!fs.existsSync(distPath) || isSourceNewer(distPath)) {
    console.log('Building extension...');
    execSync('npm run build', { stdio: 'inherit' });
  }
}

function isSourceNewer(distPath: string): boolean {
  const srcPath = path.join(__dirname, '../src');
  const distMtime = fs.statSync(distPath).mtime;
  
  // Check if any source file is newer than dist
  const checkDir = (dir: string): boolean => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (checkDir(fullPath)) return true;
      } else {
        if (fs.statSync(fullPath).mtime > distMtime) return true;
      }
    }
    return false;
  };
  
  return checkDir(srcPath);
}

export default globalSetup;
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  // ... rest of config
});
```

## Debugging Configuration

### Debug Mode

```typescript
// playwright.config.ts - Debug configuration
export default defineConfig({
  // ... base config
  
  // Debug options
  timeout: 0,  // No timeout in debug
  workers: 1,  // Single worker for debugging
  
  use: {
    headless: false,
    launchOptions: {
      slowMo: 500,  // Slow down for visibility
      devtools: true,  // Open DevTools
    },
    // Don't close browser on failure
    // (manual inspection possible)
  },
});
```

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Playwright Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "--headed", "--debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```
