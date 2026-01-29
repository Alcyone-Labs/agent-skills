# MCP Integration - Gotchas

## Common Pitfalls

### Console Output in MCP Mode

```typescript
// WRONG - console.log contaminates STDOUT in MCP mode
.withMcp({ ... })
// Later in handler:
console.log("Processing..."); // Breaks MCP protocol!

// CORRECT - Use MCP logger
import { createMcpLogger } from "@alcyone-labs/arg-parser";
const mcpLogger = createMcpLogger("MyServer", "./logs/mcp.log");

// In handler:
mcpLogger.info("Processing..."); // Safe for MCP
```

### Tool Name Sanitization

```typescript
// WARNING: Tool names are auto-sanitized
parser.addTool({
  name: "My Tool",        // Will become "My_Tool"
  name: "my-tool-v2.0",   // Will become "my-tool-v2_0"
  name: "my_tool",        // Stays "my_tool" (valid)
});

// Valid pattern: ^[a-zA-Z0-9_-]{1,64}$
```

### Output Schema Version

```typescript
// WARNING: Output schemas require MCP >= 2025-06-18
.withMcp({ ... })

// For older protocols, don't use outputSchema
parser.addTool({
  name: "legacy",
  flags: [...],
  handler: async (ctx) => result,
  // outputSchema: "successWithData" // Only for new protocols!
});
```

### Multiple Transports

```typescript
// Use defaultTransports (plural) for multiple
.withMcp({
  serverInfo: { ... },
  defaultTransports: [
    { type: "stdio" },
    { type: "sse", port: 3000 }
  ]
});
```

### Handler Return Values

```typescript
// Return values are serialized as JSON
.addTool({
  name: "example",
  handler: async (ctx) => {
    return {
      data: bigIntValue,  // WARNING: BigInt not JSON serializable!
      date: new Date()    // WARNING: Date becomes string
    };
  }
});

// CORRECT - Ensure JSON-serializable returns
return {
  data: Number(bigIntValue),
  date: new Date().toISOString()
};
```

## STDIO Transport Specifics

- Only one STDIO transport per process
- Must handle process.stdin/process.stdout carefully
- No other STDIO operations while MCP active
