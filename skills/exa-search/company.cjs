#!/usr/bin/env node
/**
 * Exa company research via CLI
 * Usage: node company.cjs "company" [--num 10] [--json]
 */

const { loadApiKey, exaPostJson } = require("./exa-utils.cjs");

function parseArgs(argv) {
  const options = {
    json: false,
    num: 10,
  };

  let query = null;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--num" || value === "-n") {
      options.num = Number.parseInt(argv[index + 1], 10) || 10;
      index += 1;
      continue;
    }

    if (value === "--json" || value === "-j") {
      options.json = true;
      continue;
    }

    if (!value.startsWith("-") && !query) {
      query = value;
    }
  }

  return { query, options };
}

function formatResults(results, asJson = false) {
  if (asJson) {
    return JSON.stringify(results, null, 2);
  }

  if (!results.results || results.results.length === 0) {
    return "No results found.";
  }

  return results.results
    .map((result, index) => {
      let output = `## ${index + 1}. ${result.title || "Company"}\n`;
      output += `**URL:** ${result.url}\n`;
      if (result.publishedDate) {
        output += `**Date:** ${result.publishedDate}\n`;
      }
      if (result.author) {
        output += `**Author:** ${result.author}\n`;
      }
      if (result.text) {
        const snippet =
          result.text.length > 1000
            ? `${result.text.slice(0, 1000)}...`
            : result.text;
        output += `\n${snippet}\n`;
      }
      return `${output}\n---\n`;
    })
    .join("\n");
}

function printUsage() {
  console.error('Usage: exa-company "company name" [options]');
  console.error("");
  console.error("Options:");
  console.error("  --num, -n N   Number of results (default: 10)");
  console.error("  --json, -j    Output as JSON");
}

async function main() {
  const { query, options } = parseArgs(process.argv.slice(2));
  if (!query) {
    printUsage();
    process.exit(1);
  }

  const apiKey = loadApiKey();
  const results = await exaPostJson(
    "/search",
    {
      query,
      numResults: options.num,
      type: "auto",
      category: "company",
      contents: {
        text: { maxCharacters: 3000 },
      },
    },
    apiKey,
  );

  console.log(formatResults(results, options.json));
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
