# Flags - Patterns

## Pattern 1: String Flag with Default

```typescript
{
  name: "output",
  options: ["--output", "-o"],
  type: String,
  defaultValue: "output.txt"
}
```

## Pattern 2: Number Flag with Validation

```typescript
{
  name: "port",
  options: ["--port", "-p"],
  type: Number,
  validate: (value) => value > 0 && value <= 65535 ? true : "Port must be 1-65535"
}
```

## Pattern 3: Enum Flag

```typescript
{
  name: "level",
  options: ["--level", "-l"],
  type: String,
  enum: ["debug", "info", "warn", "error"]
}
```

## Pattern 4: Mandatory Flag with Conditional

```typescript
{
  name: "config",
  options: ["--config", "-c"],
  type: String,
  mandatory: (args) => !args.useDefault
}
```

## Pattern 5: Array Flag (Multiple Values)

```typescript
{
  name: "files",
  options: ["--files", "-f"],
  type: String,
  allowMultiple: true
}
// Usage: -f file1.txt -f file2.txt -> ["file1.txt", "file2.txt"]
```

## Pattern 6: Flag-only (Presence)

```typescript
{
  name: "verbose",
  options: ["--verbose", "-v"],
  type: Boolean,
  flagOnly: true
}
// Any value after -v is NOT consumed
```

## Pattern 7: Zod Schema for Structured Input

```typescript
{
  name: "config",
  options: ["--config"],
  type: z.object({
    host: z.string(),
    port: z.number(),
    ssl: z.boolean().optional()
  })
}
```

## Pattern 8: Environment Variable Fallback

```typescript
{
  name: "token",
  options: ["--token", "-t"],
  type: String,
  env: "API_TOKEN"
}
// Priority: CLI flag > env var > default
```

## Pattern 9: Dynamic Flag Registration

```typescript
{
  name: "mode",
  options: ["--mode", "-m"],
  type: String,
  dynamicRegister: async (ctx) => {
    if (ctx.value === "advanced") {
      return [
        { name: "debug", options: ["--debug"], type: Boolean },
        { name: "trace", options: ["--trace"], type: Boolean }
      ]
    }
    return []
  }
}
```

## Pattern 10: Positional Argument Capture

```typescript
{
  name: "file",
  options: ["--file", "-f"],
  type: String,
  positional: 1
}
// Captures first positional after flags
// Usage: cmd --file input.txt other.txt -> file = "input.txt"
```

## Pattern 11: Set Working Directory

```typescript
{
  name: "workspace",
  options: ["--workspace", "-w"],
  type: String,
  setWorkingDirectory: true
}
// Changes cwd for file operations in this flag's handler
```
