# ArgParser Skill

Type-safe CLI argument parser with MCP integration Zod validation and auto-generated tools.

## Overview

This skill provides comprehensive guidance for building CLI tools using the @alcyone-labs/arg-parser library with features including:

- Type-safe argument parsing with Zod schemas
- MCP (Model Context Protocol) server integration
- Unified CLI/MCP tool definitions
- Flag inheritance and subcommand support
- DXT (Distributed Extension) generation

## When to Use

- Building new CLI tools with TypeScript
- Adding MCP capabilities to existing CLIs
- Creating tools that work both as CLI and MCP servers
- Implementing complex flag validation with Zod

## Structure

- `SKILL.md` - Main skill manifest with rules and workflow
- `references/core-api/` - ArgParser class API reference
- `references/flags/` - Flag definitions and options
- `references/mcp-integration/` - MCP server configuration
- `references/types/` - TypeScript interfaces and types
- `commands/opencode/arg-parser.md` - OpenCode slash command
- `commands/gemini/arg-parser.toml` - Gemini CLI command

## Quick Start

```typescript
import { ArgParser } from "@alcyone-labs/arg-parser";

const parser = new ArgParser({
  appName: "My CLI",
  appCommandName: "my-cli",
  handler: async (ctx) => {
    console.log("Running with:", ctx.args);
  },
}).addFlags([
  { name: "input", options: ["--input", "-i"], type: String },
]);

parser.parse(process.argv);
```
