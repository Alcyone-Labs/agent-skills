#!/usr/bin/env node
/**
 * Exa code search via CLI
 * Usage: node code.cjs "query" [--tokens 5000]
 */

const { loadApiKey, exaPostJson } = require("./exa-utils.cjs");

function parseArgs(argv) {
  let query = null;
  let tokensNum = 5000;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--tokens" || value === "-t") {
      tokensNum = Number.parseInt(argv[index + 1], 10) || 5000;
      index += 1;
      continue;
    }

    if (!value.startsWith("-") && !query) {
      query = value;
    }
  }

  return { query, tokensNum };
}

function printUsage() {
  console.error('Usage: exa-code "query" [--tokens N]');
  console.error("");
  console.error("Options:");
  console.error("  --tokens, -t N   Max characters to extract (default: 5000)");
}

async function main() {
  const { query, tokensNum } = parseArgs(process.argv.slice(2));
  if (!query) {
    printUsage();
    process.exit(1);
  }

  const apiKey = loadApiKey();
  const results = await exaPostJson(
    "/search",
    {
      query,
      numResults: 10,
      type: "auto",
      contents: {
        text: { maxCharacters: tokensNum },
      },
    },
    apiKey,
  );

  if (!results.results || results.results.length === 0) {
    console.log("No results found.");
    return;
  }

  results.results.forEach((result, index) => {
    console.log(`## ${index + 1}. ${result.title || "Code Example"}`);
    console.log(`**URL:** ${result.url}\n`);
    if (result.text) {
      console.log(result.text);
    }
    console.log("\n---\n");
  });
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
