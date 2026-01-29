# Flags - Gotchas

## Common Pitfalls

### Type vs type

```typescript
// WRONG - Using type as property name
{ name: "input", type: String } // TypeScript reserved word issues

// CORRECT - Using type property
{ name: "input", type: String } // Actually works fine
```

### Boolean Flag Behavior

```typescript
// WARNING: Boolean flags are presence-based
{ name: "verbose", options: ["--verbose"], type: Boolean }

// Command: my-cli --verbose false
// Result: verbose = true (flag presence matters, not value)

// For value-based booleans, use String with enum
{ name: "verbose", options: ["--verbose"], type: String, enum: ["true", "false"] }
```

### Default vs defaultValue

```typescript
// Both work but defaultValue is preferred
{ name: "port", type: Number, defaultValue: 8080 }
{ name: "port", type: Number, default: 8080 } // Legacy alias
```

### Required vs mandatory

```typescript
// Both work but mandatory is preferred
{ name: "input", type: String, mandatory: true }
{ name: "input", type: String, required: true } // Legacy alias
```

### allowMultiple Without Array Type

```typescript
// WRONG - allowMultiple needs proper type handling
{ name: "files", type: String, allowMultiple: true }

// CORRECT - Result will be string[] when multiple provided
{ name: "files", type: String, allowMultiple: true } // Actually correct
```

## Validation Edge Cases

- Validation function returning `void` = success
- Validation returning `true` = success
- Validation returning `string` = error message
- Validation throwing = caught and reported

## Priority Confusion

```
Priority order (highest to lowest):
1. CLI flag value
2. Environment variable
3. Default value
4. undefined / not set
```
