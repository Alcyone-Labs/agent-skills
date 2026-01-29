# Core API - API Reference

## ArgParser Class

```typescript
class ArgParser<THandlerReturn = any> extends ArgParserBase
```

### Constructor

```typescript
new ArgParser(
  params: IArgParserParams<THandlerReturn>,
  flags?: readonly IFlag[],
  flagInheritance?: TFlagInheritance
)
```

**IArgParserParams:**

```typescript
{
  appName: string
  appCommandName?: string
  description?: string
  handler?: MainHandler
  autoExit?: boolean
  handleErrors?: boolean
}
```

### Flag Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `addFlag` | `(flag: IFlag) => this` | Add single flag |
| `addFlags` | `(flags: readonly IFlag[]) => this` | Add multiple flags |
| `hasFlag` | `(name: string) => boolean` | Check if flag exists |
| `getFlagDefinition` | `(name: string) => ProcessedFlag \| undefined` | Get processed flag |

### Subcommand Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `addSubCommand` | `(config: ISubCommand) => this` | Register subcommand |
| `getSubCommand` | `(name: string) => ArgParser \| undefined` | Get subcommand |
| `getSubCommands` | `() => Map<string, ArgParser>` | Get all subcommands |

### Parsing Methods

```typescript
parse(
  processArgs?: string[],
  options?: IParseOptions
): Promise<ParseResult>
```

**IParseOptions:**

```typescript
{
  skipHandlerExecution?: boolean
  isMcp?: boolean
}
```

### MCP Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `withMcp` | `(options: WithMcpOptions) => this` | Configure MCP server |
| `addTool` | `(config: ToolConfig) => this` | Add unified CLI/MCP tool |
| `addMcpTool` | `(config: McpToolConfig) => this` | Add MCP-only tool (deprecated) |
| `toMcpTools` | `(options?) => McpToolStructure[]` | Generate MCP tool structures |
| `createMcpServer` | `(...) => McpServer` | Create MCP server instance |
| `startMcpServerWithTransport` | `(...) => Promise<void>` | Start with single transport |
| `startMcpServerWithMultipleTransports` | `(...) => Promise<void>` | Start with multiple transports |

### Utility Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAppName` | `() => string` | Get app name |
| `getAppCommandName` | `() => string \| undefined` | Get command name |
| `getDescription` | `() => string \| undefined` | Get description |
| `helpText` | `() => string` | Generate help text |
| `printAll` | `(filePath?: string) => void` | Print help to file |

## ArgParserBase Class

Base class with core parsing functionality. Use `ArgParser` for full features.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Missing mandatory flag |
| 4 | Validation failed |
