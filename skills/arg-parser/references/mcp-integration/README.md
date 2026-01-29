# MCP Integration Reference

## Overview

Add MCP (Model Context Protocol) server capabilities to CLI tools. Expose CLI functionality as MCP tools with auto-generated schemas.

## Decision Tree

```
Need MCP support?
├── Simple MCP → withMcp() with stdio transport
├── Multiple transports → defaultTransports array
├── HTTP server → streamable-http transport
├── Tools → addTool() for CLI+MCP unified tools
└── Custom logging → createMcpLogger()

Output schema needed?
├── Standard pattern → "successWithData" | "successError" | "list"
└── Custom → Zod schema or Record
```

## Topics

- `api.md` - withMcp configuration and transport types
- `patterns.md` - MCP server patterns
- `gotchas.md` - MCP pitfalls
