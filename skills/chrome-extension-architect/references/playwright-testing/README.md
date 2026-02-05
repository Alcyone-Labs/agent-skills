# Playwright Testing Reference

Headless Chrome extension testing with Playwright. Test MV3 extensions in real browser environment without manual UI interaction.

## Overview / When to Apply

Use this reference when:

- Testing Chrome MV3 extensions end-to-end
- Automating extension UI interactions (popup, side panel, options page)
- Testing content script injection and page modifications
- Testing service worker behavior and messaging
- CI/CD pipeline integration for extension testing
- Regression testing extension functionality

## What is Headless Extension Testing

Playwright can launch Chrome with extensions loaded in **headless mode** (new in Chrome 128+). This enables:

- Automated testing without visible browser window
- CI/CD integration (GitHub Actions, etc.)
- Fast test execution
- Parallel test runs
- Screenshot/video capture on failure

## Decision Tree

```
Need to test extension functionality?
├─ Unit tests for isolated logic -> Jest/Vitest (not Playwright)
├─ Integration tests for Chrome APIs -> Mock APIs or manual testing
└─ End-to-end extension behavior -> Playwright (this reference)
   ├─ Test popup UI? -> Load extension, open popup page
   ├─ Test side panel? -> Open sidepanel URL directly
   ├─ Test content scripts? -> Navigate to page, verify injection
   ├─ Test service worker? -> Send messages, check storage
   └─ Test full user flows? -> Multi-step scenarios

Running in CI/CD?
├─ Use headless mode with --headless=new
└─ Use xvfb-run for headed mode if needed

Need to test across Chrome versions?
├─ Use Playwright's browser version pinning
└─ Test stable, beta, dev channels
```

## Testing Architecture

```
Test File
    ↓
Playwright Fixture (extension-loaded context)
    ↓
Launch Chrome with --load-extension
    ↓
Extension loaded in browser
    ↓
Test interacts with:
    ├─ Popup (extension page)
    ├─ Side panel (extension page)
    ├─ Content script (page context)
    ├─ Service worker (background context)
    └─ Options page (extension page)
```

## Key Concepts

### Extension Contexts

Playwright can interact with different extension contexts:

| Context | Access Method | Use Case |
|---------|--------------|----------|
| Popup | `browserContext.newPage()` with popup URL | Test popup UI |
| Side Panel | `page.goto()` with sidepanel URL | Test side panel |
| Content Script | `page.evaluate()` in page context | Test DOM modifications |
| Service Worker | `browserContext.serviceWorkers()` | Test background logic |
| Options Page | `page.goto()` with options URL | Test settings UI |

### Extension IDs

Extensions loaded via `--load-extension` get a **consistent ID** based on the extension path. You can:

1. Pin the ID using `key` in manifest.json
2. Extract ID from `chrome://extensions` page
3. Use `chrome.runtime.id` from extension context

### Headless vs Headed

| Mode | Use Case | Command |
|------|----------|---------|
| Headless | CI/CD, fast tests | `--headless=new` |
| Headed | Debugging, visual verification | `--headless=false` |

## Testing Strategy Matrix

| Component | Test Approach | Playwright API |
|-----------|--------------|----------------|
| Popup | Open popup URL, interact with elements | `page.goto()`, `page.click()` |
| Side Panel | Navigate to sidepanel path | `page.goto('chrome-extension://.../panel.html')` |
| Content Script | Inject into test page, verify DOM changes | `page.evaluate()` |
| Service Worker | Send runtime messages | `browserContext.evaluate()` |
| Storage | Read/write via extension APIs | `page.evaluate(() => chrome.storage...)` |
| Messaging | Send messages between contexts | `page.evaluate()` with `chrome.runtime.sendMessage` |

## Prerequisites

- Playwright 1.40+ (for latest Chrome support)
- Chrome 128+ (for headless extension support)
- Extension built and ready to load

## Installation

```bash
# Install Playwright
npm init -y
npm install @playwright/test
npx playwright install chromium

# TypeScript support
npm install -D @types/node
```

## Quick Start

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

// Path to your built extension
const EXTENSION_PATH = path.join(__dirname, '../dist');

test('extension loads successfully', async ({ browser }) => {
  // Launch browser with extension
  const context = await browser.newContext({
    args: [
      `--load-extension=${EXTENSION_PATH}`,
      `--disable-extensions-except=${EXTENSION_PATH}`,
    ],
  });

  // Test your extension
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Verify extension is working
  // ... your test code

  await context.close();
});
```

## File Structure

```
my-extension/
├── src/                      # Extension source
├── dist/                     # Built extension (load this)
├── e2e/
│   ├── fixtures/
│   │   └── extension.ts      # Extension test fixtures
│   ├── tests/
│   │   ├── popup.spec.ts     # Popup tests
│   │   ├── sidepanel.spec.ts # Side panel tests
│   │   └── content.spec.ts   # Content script tests
│   └── playwright.config.ts  # Playwright configuration
└── package.json
```

## Next Steps

- **API Reference**: See `api.md` for complete Playwright API signatures
- **Configuration**: See `configuration.md` for setup and fixtures
- **Patterns**: See `patterns.md` for common testing scenarios
- **Gotchas**: See `gotchas.md` for pitfalls and workarounds

## Resources

- [Playwright Docs](https://playwright.dev/)
- [Chrome Extension Testing Guide](https://playwright.dev/docs/chrome-extensions)
- [Playwright Release Notes](https://playwright.dev/docs/release-notes)
