# MCP Integration - Patterns

## Pattern 1: Basic MCP Server

```typescript
const parser = new ArgParser({
  appName: "Search CLI",
  appCommandName: "search",
  handler: async (ctx) => ({ query: ctx.args.query }),
})
  .addFlags([
    { name: "query", options: ["--query", "-q"], type: String, mandatory: true },
  ])
  .withMcp({
    serverInfo: { name: "search-cli", version: "1.0.0" },
    defaultTransport: { type: "stdio" },
  });

await parser.parse(process.argv);
```

## Pattern 2: MCP with HTTP Transport

```typescript
.withMcp({
  serverInfo: { name: "api-server", version: "1.0.0" },
  defaultTransport: {
    type: "streamable-http",
    host: "localhost",
    port: 3000,
    cors: { origins: "*" }
  }
})
```

## Pattern 3: Unified Tool (CLI + MCP)

```typescript
parser.addTool({
  name: "process",
  description: "Process data",
  flags: [
    { name: "input", options: ["--input"], type: String, mandatory: true },
    { name: "output", options: ["--output"], type: String },
  ],
  handler: async (ctx) => ({ processed: true, input: ctx.args.input }),
  outputSchema: "successWithData",
});
```

## Pattern 4: Multiple Tools

```typescript
parser
  .addTool({
    name: "search",
    description: "Search items",
    flags: [{ name: "query", type: String, mandatory: true }],
    handler: async (ctx) => ({ results: [] }),
    outputSchema: "list",
  })
  .addTool({
    name: "create",
    description: "Create item",
    flags: [{ name: "name", type: String, mandatory: true }],
    handler: async (ctx) => ({ success: true }),
    outputSchema: "successError",
  });
```

## Pattern 5: DXT Bundling

```typescript
.withMcp({
  serverInfo: { name: "bundled-cli", version: "1.0.0" },
  dxt: {
    include: [
      "config/",
      "assets/",
      { from: "src/templates", to: "templates" }
    ]
  }
});
```
