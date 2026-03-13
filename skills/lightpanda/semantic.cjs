#!/usr/bin/env node
/**
 * Get semantic tree from a URL using Lightpanda's native LP.getSemanticTree
 * Usage: node semantic.cjs "https://example.com" [--json]
 *
 * Returns pruned DOM with: nodeIds, XPaths, ARIA roles, computed names, interactivity
 *
 * Options:
 *   --json  Output as JSON (default is text format, more token-efficient)
 */

const { chromium } = require('playwright-core');

const WS_URL = process.env.LIGHTPANDA_WS || 'ws://127.0.0.1:9222';

async function getSemanticTree(url, format = 'text') {
  const browser = await chromium.connectOverCDP({
    endpointURL: WS_URL,
  });

  try {
    const context = await browser.newContext({});
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Use native LP.getSemanticTree command
    const client = await page.context().newCDPSession(page);
    const result = await client.send('LP.getSemanticTree', {
      format: format,
      prune: true
    });

    await page.close();
    await context.close();

    return result;
  } finally {
    await browser.close();
  }
}

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
const format = args.includes('--json') ? 'json' : 'text';

if (!url) {
  console.error('Usage: node semantic.cjs <url> [--json]');
  console.error('');
  console.error('Options:');
  console.error('  --json  Output as JSON (default: text format)');
  console.error('');
  console.error('Make sure Lightpanda is running: lightpanda-start');
  process.exit(1);
}

getSemanticTree(url, format)
  .then(data => {
    if (format === 'json') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data.semanticTree);
    }
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
