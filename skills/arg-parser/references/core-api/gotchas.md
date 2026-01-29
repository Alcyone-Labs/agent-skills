# Core API - Gotchas

## Common Pitfalls

### Handler Not Awaiting

```typescript
// WRONG - async handler not awaited
const parser = new ArgParser({
  handler: async (ctx) => {
    await doSomething(); // May not complete before exit
  },
});

// CORRECT - Use autoExit: false and await parse
const parser = new ArgParser({
  handler: async (ctx) => {
    await doSomething();
  },
  autoExit: false,
});

await parser.parse(process.argv);
process.exit(0);
```

### Flag Name Conflicts

```typescript
// WRONG - Duplicate flag names
parser.addFlags([
  { name: "input", options: ["--input"], type: String },
  { name: "input", options: ["--in"], type: String }, // Error!
]);

// CORRECT - Unique names
parser.addFlags([
  { name: "input", options: ["--input", "--in"], type: String },
]);
```

### Missing Mandatory Flags

```typescript
// This will throw with exit code 3 if --input not provided
parser.addFlag({
  name: "input",
  options: ["--input"],
  type: String,
  mandatory: true,
});
```

### Process Args Format

```typescript
// WRONG - Pass raw args
parser.parse(process.argv); // Includes node path and script path

// CORRECT - ArgParser handles this internally
parser.parse(process.argv); // Actually correct - library handles it
```

## Edge Cases

- Empty string flags: Treated as valid empty values
- Boolean flags with values: `--verbose false` sets verbose to true (presence check)
- Array flags without allowMultiple: Last value wins
