#!/usr/bin/env node
/**
 * Fetch a URL and return content as markdown using Lightpanda's native LP.getMarkdown
 * Usage: node fetch.cjs "https://example.com"
 */

const { chromium } = require('playwright-core');

const WS_URL = process.env.LIGHTPANDA_WS || 'ws://127.0.0.1:9222';

async function fetchMarkdown(url) {
  const browser = await chromium.connectOverCDP({
    endpointURL: WS_URL,
  });

  try {
    const context = await browser.newContext({});
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for dynamic content
    await page.waitForTimeout(1500);

    // Use native LP.getMarkdown command
    const client = await page.context().newCDPSession(page);
    const result = await client.send('LP.getMarkdown', {});

    await page.close();
    await context.close();

    return result.markdown;
  } finally {
    await browser.close();
  }
}

const url = process.argv[2];

if (!url) {
  console.error('Usage: node fetch.cjs <url>');
  console.error('');
  console.error('Make sure Lightpanda is running: lightpanda-start');
  process.exit(1);
}

fetchMarkdown(url)
  .then(markdown => {
    console.log(markdown);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
