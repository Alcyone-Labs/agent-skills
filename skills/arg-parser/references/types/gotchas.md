# Types - Gotchas

## Common Type Issues

### Zod Schema Inference

```typescript
import { z } from "zod";

const schema = z.object({ name: z.string() });

// WRONG - Expecting inferred type to work directly
type MyType = z.infer<typeof schema>;
parser.addFlag({
  name: "data",
  type: schema,
  handler: (ctx) => {
    // ctx.args.data might not be fully typed
  }
});

// CORRECT - Use explicit typing when needed
interface MyData {
  name: string;
}

parser.addFlag<MyData>({
  name: "data",
  type: schema,
  // handler will have proper types
});
```

### Boolean Type Confusion

```typescript
// TypeScript Boolean constructor vs boolean primitive
{
  type: Boolean // Constructor - correct for arg-parser
  type: boolean // Primitive - won't work as expected
}

// The library expects constructors for native types
{
  type: String  // ✓ Correct
  type: Number  // ✓ Correct
  type: Boolean // ✓ Correct
}
```

### Array Type Variance

```typescript
// When allowMultiple is true, type becomes array automatically
{
  name: "files",
  type: String,
  allowMultiple: true
}
// Result type: string[]

// But you can't type it as Array constructor
{
  name: "files",
  type: Array // Wrong - use String with allowMultiple
}
```

### Optional vs Undefined

```typescript
// Flag result is undefined if not provided
interface Args {
  input?: string; // Optional (undefined if not set)
  output: string; // Required (has default or mandatory)
}

// In handler
const input = ctx.args.input; // string | undefined
const output = ctx.args.output; // string
```

### Generic Constraints

```typescript
// Handler return type is generic
new ArgParser<ReturnType>({
  handler: async (ctx): Promise<ReturnType> => {
    return { success: true };
  }
});

// But parse result doesn't strongly type data
const result = await parser.parse(process.argv);
// result.data is any, not ReturnType
```

## TypeScript Strict Mode Issues

- `strictNullChecks`: May require explicit null checks on optional flags
- `noImplicitAny`: Handler context may need explicit typing
- `strictFunctionTypes`: Validation functions need precise signatures
