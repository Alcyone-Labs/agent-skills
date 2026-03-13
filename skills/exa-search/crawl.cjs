#!/usr/bin/env node
/**
 * Exa URL crawling via CLI
 * Usage: node crawl.cjs "https://example.com" [--subpages 5] [--json]
 */

const { loadApiKey, exaPostJson } = require("./exa-utils.cjs");

function parseArgs(argv) {
  const options = {
    json: false,
    maxChars: 5000,
  };

  let url = null;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--subpages" || value === "-s") {
      options.subpages = Number.parseInt(argv[index + 1], 10) || 0;
      index += 1;
      continue;
    }

    if (value === "--max-chars" || value === "-m") {
      options.maxChars = Number.parseInt(argv[index + 1], 10) || 5000;
      index += 1;
      continue;
    }

    if (value === "--json" || value === "-j") {
      options.json = true;
      continue;
    }

    if (!value.startsWith("-") && value.startsWith("http") && !url) {
      url = value;
    }
  }

  return { url, options };
}

function formatResults(results, asJson = false) {
  if (asJson) {
    return JSON.stringify(results, null, 2);
  }

  if (!results.results || results.results.length === 0) {
    return "No content extracted.";
  }

  return results.results
    .map((result, index) => {
      let output = `## ${index + 1}. ${result.title || result.url}\n`;
      output += `**URL:** ${result.url}\n`;
      if (result.text) {
        output += `\n${result.text}\n`;
      }
      return `${output}\n---\n`;
    })
    .join("\n");
}

function printUsage() {
  console.error('Usage: exa-crawl "https://example.com" [options]');
  console.error("");
  console.error("Options:");
  console.error("  --subpages, -s N   Crawl N subpages (default: 0)");
  console.error("  --max-chars, -m N  Max characters per page (default: 5000)");
  console.error("  --json, -j         Output as JSON");
}

async function main() {
  const { url, options } = parseArgs(process.argv.slice(2));
  if (!url) {
    printUsage();
    process.exit(1);
  }

  const apiKey = loadApiKey();
  const results = await exaPostJson(
    "/contents",
    {
      urls: [url],
      text: { maxCharacters: options.maxChars },
      ...(options.subpages ? { subpages: options.subpages } : {}),
    },
    apiKey,
  );

  console.log(formatResults(results, options.json));
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
