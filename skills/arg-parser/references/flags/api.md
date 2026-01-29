# Flags - API Reference

## IFlag Interface

```typescript
interface IFlag {
  name: string
  options: string[]
  type?: TParsedArgsTypeFromFlagDef
  description?: string | string[]
  valueHint?: string
  defaultValue?: any
  mandatory?: boolean | ((parsedArgs: TParsedArgs) => boolean)
  allowMultiple?: boolean
  allowLigature?: boolean
  flagOnly?: boolean
  validate?: (value, parsedArgs?) => boolean | string | void
  enum?: any[]
  env?: string | string[]
  dxtOptions?: IDxtOptions
  dynamicRegister?: DynamicRegisterFn
  setWorkingDirectory?: boolean
  positional?: number
}
```

## Flag Types

| Type | Description | Example |
|------|-------------|---------|
| `String` | String value | `type: String` |
| `Number` | Numeric value | `type: Number` |
| `Boolean` | True/false | `type: Boolean` |
| `Array` | Array of strings | `type: Array` |
| `Object` | Key-value pairs | `type: Object` |
| `"string"` | String literal | `type: "string"` |
| `"number"` | Number literal | `type: "number"` |
| `"boolean"` | Boolean literal | `type: "boolean"` |
| `"array"` | Array literal | `type: "array"` |
| `"object"` | Object literal | `type: "object"` |
| `Zod schema` | Custom validation | `type: z.object({...})` |
| `function` | Custom parser | `type: (v) => parseInt(v)` |

## Flag Options Syntax

```typescript
// Short and long options
{ name: "input", options: ["--input", "-i"], ... }

// Multiple long options
{ name: "verbose", options: ["--verbose", "--debug", "-v"], ... }
```

## Flag Inheritance

```typescript
import { FlagInheritance } from "@alcyone-labs/arg-parser";

FlagInheritance.NONE              // No inheritance
FlagInheritance.DirectParentOnly  // Direct parent only
FlagInheritance.AllParents        // All parent flags
```

Usage: `new ArgParser(params, flags, FlagInheritance.AllParents)`
