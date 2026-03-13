#!/usr/bin/env node
/**
 * Exa web search via CLI
 * Usage: node search.cjs "query" [--num 10] [--category company] [--json]
 */

const { loadApiKey, exaPostJson } = require("./exa-utils.cjs");

function parseArgs(argv) {
  const options = {
    num: 10,
    type: "auto",
    includeContent: true,
    json: false,
  };

  let query = null;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--")) {
      if (value === "--num") {
        options.num = Number.parseInt(argv[index + 1], 10) || 10;
        index += 1;
      } else if (value === "--category") {
        options.category = argv[index + 1];
        index += 1;
      } else if (value === "--type") {
        options.type = argv[index + 1] ?? "auto";
        index += 1;
      } else if (value === "--json") {
        options.json = true;
      } else if (value === "--no-content") {
        options.includeContent = false;
      }
      continue;
    }

    if (value.startsWith("-") && value.length === 2) {
      if (value === "-n") {
        options.num = Number.parseInt(argv[index + 1], 10) || 10;
        index += 1;
      } else if (value === "-c") {
        options.category = argv[index + 1];
        index += 1;
      } else if (value === "-t") {
        options.type = argv[index + 1] ?? "auto";
        index += 1;
      } else if (value === "-j") {
        options.json = true;
      }
      continue;
    }

    if (!query) {
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
      let output = `## ${index + 1}. ${result.title || "Untitled"}\n`;
      output += `**URL:** ${result.url}\n`;
      if (result.publishedDate) {
        output += `**Date:** ${result.publishedDate}\n`;
      }
      if (result.author) {
        output += `**Author:** ${result.author}\n`;
      }
      if (result.text) {
        const summary =
          result.text.length > 500
            ? `${result.text.slice(0, 500)}...`
            : result.text;
        output += `\n${summary}\n`;
      }
      return `${output}\n---\n`;
    })
    .join("\n");
}

function printUsage() {
  console.error('Usage: exa-search "query" [options]');
  console.error("");
  console.error("Options:");
  console.error("  --num, -n N       Number of results (default: 10)");
  console.error("  --category, -c C  Category: company, news, tweet, people, etc.");
  console.error("  --type, -t T      Search type: auto, keyword, neural");
  console.error("  --json, -j        Output as JSON");
  console.error("  --no-content      Skip content extraction");
}

async function main() {
  const { query, options } = parseArgs(process.argv.slice(2));
  if (!query) {
    printUsage();
    process.exit(1);
  }

  const apiKey = loadApiKey();
  const payload = {
    query,
    numResults: options.num,
    useAutoprompt: true,
    type: options.type,
    ...(options.category ? { category: options.category } : {}),
    ...(options.includeContent
      ? {
          contents: {
            text: { maxCharacters: 2000 },
          },
        }
      : {}),
  };

  const results = await exaPostJson("/search", payload, apiKey);
  console.log(formatResults(results, options.json));
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
