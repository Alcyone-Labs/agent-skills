# Documentation Gotchas & Pitfalls

Common mistakes and edge cases when creating Aquaria documentation.

## Section Order Mistakes

### Wrong: Missing Mandatory Sections

```markdown
# My Feature

## Introduction

This feature does X.

## Code Example
// ❌ Missing Overview, Quickstart, Deep Dive, Examples, References
```

### Right: Complete Section Order

```markdown
# My Feature

## Overview

This feature provides X functionality for Y use cases.

### Prerequisites

- Node.js 18+
- Aquaria CLI installed
- API key configured

### What You'll Learn

- How to configure X
- Common patterns
- Edge case handling

## Quickstart

```typescript
// Copy-pasteable code
```

## Deep Dive

### Step 1: Configuration
### Step 2: Usage
### Edge Case: Timeout handling

## Examples

### Basic Example
### Advanced Example
### Production Example

## References

- [Related doc](related.md)
- [External resource](https://example.com)
```

## Template Usage Errors

### Wrong: Writing from Scratch

```typescript
// ❌ Creating documentation without template
```

### Right: Using Template

```bash
# ✅ Always copy template first
cp docs/.templates/guide.md docs/building/my-feature.md
```

## Import Extension Rules

### Wrong: Missing .js Extension

```typescript
import { foo } from "./utils";  // ❌
```

### Right: With .js Extension

```typescript
import { foo } from "./utils.js";  // ✅
```

## TOC Generation

### Wrong: Manual TOC for >500 words

```markdown
- [Section 1](#section-1)
- [Section 2](#section-2)
// ❌ Manual TOC for long document
```

### Right: Auto TOC Marker

```markdown
<!-- TOC -->

- [Overview](#overview)
- [Quickstart](#quickstart)
- [Deep Dive](#deep-dive)
- [Examples](#examples)
- [References](#references)
<!-- /TOC -->
```

## Code Block Mistakes

### Wrong: Inline Code for Examples

```markdown
To use the feature, call `library.function({ option: true })` and handle the result.  // ❌
```

### Right: Fenced Code Blocks

```markdown
## Quickstart

```typescript
import { library } from "@alcyone-labs/aquaria";

const result = library.function({
  option: true,
});

console.log(result);
// Expected: { success: true }
```
```

## Link Mistakes

### Wrong: Vague Links

```markdown
- [Click Here](https://example.com)  // ❌
- [Documentation](docs/something.md) // ❌ Vague
```

### Right: Descriptive Links

```markdown
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)  // ✅ Descriptive
- [Workflow Engine API](workflow-engine.md)  // ✅ Specific
```

## Naming Mistakes

### Wrong: Inconsistent Naming

```markdown
❌ myFeatureGuide.md      # camelCase
❌ MyFeatureGuide.md      # Title Case
❌ my_feature_guide.md    # snake_case
```

### Right: Kebab-case

```markdown
✅ workflow-engine-guide.md  # kebab-case
```

## File Path Mistakes

### Wrong: Too Deep

```markdown
docs/building/steps/templating/advanced/patterns/real-world/examples.md  // ❌ 6 levels
```

### Right: Max 3 Levels

```markdown
docs/building/steps/templating.md  // ✅ 3 levels
```

## Quickstart Pitfalls

### Wrong: Multi-Step Setup

```markdown
## Quickstart

1. Install dependencies: `npm install`
2. Configure config.yaml
3. Set up environment variables
4. Run database migrations
5. Now you can use the feature...

// ❌ Takes more than 5 minutes
```

### Right: Single Copy-Paste Block

```markdown
## Quickstart

```bash
npm install @alcyone-labs/aquaria
```

```typescript
import { feature } from "@alcyone-labs/aquaria";

const result = feature.quickStart();
console.log(result);
```

// ✅ Under 5 minutes
```

## Related Pitfalls

- [Templates Guide](templates.md)
- [Quality Gates](quality-gates.md)
- [Folder Structure](folder-structure.md)
