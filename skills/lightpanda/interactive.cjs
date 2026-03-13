#!/usr/bin/env node
/**
 * Get interactive elements from a URL using Lightpanda's native LP.getInteractiveElements
 * Usage: node interactive.cjs "https://example.com"
 *
 * Returns: buttons, inputs, links, and other interactive elements with:
 *   tagName, role, name, type, listeners, tabIndex, id, class
 */

const { chromium } = require('playwright-core');

const WS_URL = process.env.LIGHTPANDA_WS || 'ws://127.0.0.1:9222';

async function getInteractiveElements(url) {
  const browser = await chromium.connectOverCDP({
    endpointURL: WS_URL,
  });

  try {
    const context = await browser.newContext({});
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Use native LP.getInteractiveElements command
    const client = await page.context().newCDPSession(page);
    const result = await client.send('LP.getInteractiveElements', {});

    await page.close();
    await context.close();

    return result;
  } finally {
    await browser.close();
  }
}

const url = process.argv[2];

if (!url) {
  console.error('Usage: node interactive.cjs <url>');
  console.error('');
  console.error('Make sure Lightpanda is running: lightpanda-start');
  process.exit(1);
}

getInteractiveElements(url)
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
