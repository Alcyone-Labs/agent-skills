# Core API - Patterns

## Pattern 1: Basic CLI Setup

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

## Pattern 2: Error Handling Wrapper

```typescript
async function main() {
  try {
    const result = await parser.parse(process.argv);
    if (!result.success) {
      process.exit(result.exitCode);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
```

## Pattern 3: Conditional Handler

```typescript
const parser = new ArgParser({
  appName: "Git Helper",
  handler: async (ctx) => {
    if (ctx.args.verbose) {
      console.log("Verbose mode enabled");
    }
    // Main logic
  },
});
```

## Pattern 4: Multiple Flag Groups

```typescript
parser
  .addFlags([
    { name: "config", options: ["--config", "-c"], type: String },
  ])
  .addFlags([
    { name: "verbose", options: ["--verbose", "-v"], type: Boolean },
  ]);
```
