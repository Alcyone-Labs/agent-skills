# Types - Patterns

## Pattern 1: Typed Handler Context

```typescript
import { ArgParser, IHandlerContext } from "@alcyone-labs/arg-parser";

interface MyArgs {
  input: string;
  verbose: boolean;
}

const parser = new ArgParser({
  appName: "Typed CLI",
  handler: async (ctx: IHandlerContext<MyArgs>) => {
    // ctx.args is typed as MyArgs
    console.log(ctx.args.input); // string
    console.log(ctx.args.verbose); // boolean
  },
});
```

## Pattern 2: Custom Flag Types

```typescript
// Using Zod for complex validation
import { z } from "zod";

const ConfigSchema = z.object({
  host: z.string(),
  port: z.number().min(1).max(65535),
  ssl: z.boolean().optional()
});

type Config = z.infer<typeof ConfigSchema>;

parser.addFlag({
  name: "config",
  options: ["--config"],
  type: ConfigSchema,
  description: "Server configuration"
});
```

## Pattern 3: Subcommand Parent Args Access

```typescript
// Parent parser
const parentParser = new ArgParser({
  appName: "Git CLI",
  handler: async (ctx) => { /* ... */ }
}).addFlags([
  { name: "verbose", options: ["-v"], type: Boolean }
]);

// Subcommand accessing parent args
const subParser = new ArgParser({
  appName: "Git Clone",
  handler: async (ctx) => {
    // Access parent flag
    const isVerbose = ctx.parentArgs?.verbose;
    console.log("Parent verbose:", isVerbose);
  }
});
```

## Pattern 4: ParseResult Type Guards

```typescript
const result = await parser.parse(process.argv);

if (result.success) {
  // result.data is available
  console.log("Success:", result.data);
} else {
  // result.message and result.exitCode available
  console.error("Failed:", result.message);
  process.exit(result.exitCode);
}
```

## Pattern 5: Tool Config Typing

```typescript
import { ToolConfig } from "@alcyone-labs/arg-parser";

const myTool: ToolConfig = {
  name: "process-file",
  description: "Process a file",
  flags: [
    { name: "input", options: ["--input"], type: String, mandatory: true }
  ],
  handler: async (ctx) => {
    return { success: true, data: { processed: ctx.args.input } };
  },
  outputSchema: "successWithData"
};

parser.addTool(myTool);
```
