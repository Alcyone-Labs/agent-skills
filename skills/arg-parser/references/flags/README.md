# Flag Definitions Reference

## Overview

Comprehensive flag definition system with type validation inheritance and dynamic registration.

## Decision Tree

```
What flag type?
├── Simple string → type: String
├── Number → type: Number with optional validate
├── Boolean → type: Boolean or flagOnly
├── Multiple values → type: String + allowMultiple
├── Structured data → Zod schema
└── Complex validation → validate function

Need environment fallback?
└── Add env property

Conditional requirement?
└── mandatory: (args) => boolean
```

## Topics

- `api.md` - IFlag interface and type definitions
- `patterns.md` - Common flag patterns
- `gotchas.md` - Flag pitfalls
