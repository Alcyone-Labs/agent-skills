# Core API Reference

## Overview

Core ArgParser class API with constructor methods and lifecycle.

## Decision Tree

```
Need CLI parsing?
├── Simple CLI → ArgParser with flags
├── Subcommands → addSubCommand()
├── MCP support → withMcp()
└── Complex validation → Zod schemas in flags
```

## Topics

- `api.md` - Class signatures and method references
- `patterns.md` - Common implementation patterns
- `gotchas.md` - Pitfalls and edge cases
