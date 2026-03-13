#!/usr/bin/env node
/**
 * Extract structured data from a URL using Lightpanda's native LP.getStructuredData
 * Usage: node structured.cjs "https://example.com"
 *
 * Returns: JSON-LD, OpenGraph, Twitter Cards, HTML meta, link elements
 */

const { chromium } = require('playwright-core');

const WS_URL = process.env.LIGHTPANDA_WS || 'ws://127.0.0.1:9222';

async function getStructuredData(url) {
  const browser = await chromium.connectOverCDP({
    endpointURL: WS_URL,
  });

  try {
    const context = await browser.newContext({});
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Use native LP.getStructuredData command
    const client = await page.context().newCDPSession(page);
    const result = await client.send('LP.getStructuredData', {});

    await page.close();
    await context.close();

    return result;
  } finally {
    await browser.close();
  }
}

const url = process.argv[2];

if (!url) {
  console.error('Usage: node structured.cjs <url>');
  console.error('');
  console.error('Make sure Lightpanda is running: lightpanda-start');
  process.exit(1);
}

getStructuredData(url)
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
