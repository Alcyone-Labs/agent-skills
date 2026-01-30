# Aquaria Documentation Templates API

Complete reference for all documentation templates available in Aquaria. This section also documents the **reusable template architecture** that can be exported and shared across projects.

## Template Selection Matrix

| Template | Use Case | Sections |
|----------|----------|----------|
| `base.md` | Universal, general docs | Overview, Quickstart, Deep Dive, Examples, References |
| `guide.md` | Feature guides, tutorials | Overview, When to Use, API Reference, Best Practices, Migration, Examples |
| `api-reference.md` | API documentation | Overview, Installation, Classes/Interfaces, Configuration, Usage Examples |
| `design-doc.md` | Technical specs, ADRs | Overview, Architecture, Implementation, Configuration, Testing, Migration |
| `cli-reference.md` | CLI tools | Installation, Commands, Configuration, Examples, Troubleshooting |
| `troubleshooting.md` | Error guides | Quick Fixes, Error Reference, Diagnostic Commands, Platform-Specific Issues |

---

## Reusable Template Architecture

The Aquaria documentation system is designed to be **portable and reusable** across projects. The templates follow a layered architecture:

```
references/templates/
├── meta-template.md              # Template for creating templates
├── sections/                     # Reusable section patterns
│   ├── overview.md
│   ├── quickstart.md
│   ├── deep-dive.md
│   ├── examples.md
│   └── references.md
├── patterns/                     # Documentation patterns
│   ├── decision-tree.md
│   ├── troubleshooting.md
│   └── api-signature.md
└── generic/                      # Project-agnostic templates
    ├── base.md
    ├── guide.md
    └── api.md
```

### Why Reusable Templates?

- **Portability**: Copy the entire `references/templates/` folder to any project
- **Consistency**: Apply the same documentation principles across teams
- **Customization**: Adapt generic templates to specific project needs
- **Learning Curve**: Team members learn one documentation system

### Using Reusable Templates

**Option 1: Copy for Aquaria-specific docs**
```bash
cp docs/.templates/{template}.md docs/{topic}/{filename}.md
```

**Option 2: Export for another project**
```bash
# Copy reusable templates to another project
cp -r skill-forge/skill/aquaria-docs/references/templates/ /path/to/other-project/docs/.templates/
```

---

## Meta-Template: Creating New Templates

When creating a new template, follow this information architecture:

```markdown
# {{Document Title}}

Brief 1-paragraph description of what this template covers and when to use it.

## Template Metadata

| Property | Value |
|----------|-------|
| **Purpose** | {{What this template is for}} |
| **Sections** | {{Comma-separated list of sections}} |
| **Complexity** | {{Beginner|Intermediate|Advanced}} |
| **Time to Complete** | {{Estimated fill time}} |

## Section Structure

### 1. Overview Section
- 1 paragraph describing purpose
- Prerequisites as bullet list
- What users will achieve

### 2. [Section Name]
- Content structure for this section
- Required elements
- Optional elements

### 3. [Section Name]
- Content structure
- Examples of good content

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{title}}` | Document title | User Authentication Guide |
| `{{description}}` | Brief purpose | Complete guide to implementing user auth |
| `{{prerequisites}}` | Required knowledge | Node.js, JWT basics |
| `{{time-estimate}}` | How long it takes | 15 minutes |
| `{{complexity}}` | Difficulty level | Intermediate |

## Examples

### Example 1: Basic Usage
```markdown
# Getting Started

## Overview

This guide covers {{topic}} for {{audience}}.
```

### Example 2: Advanced Usage
```markdown
# {{Advanced Topic}}

## Overview

Advanced users will learn {{outcomes}}.
```

## Quality Checklist

- [ ] Purpose clearly stated
- [ ] All placeholders documented
- [ ] Examples provided
- [ ] Cross-references included
- [ ] Valid markdown syntax

## Related Templates

- [Base Template](base.md)
- [Guide Template](guide.md)
- [API Template](api.md)
```

---

## Section Templates

### Overview Section Template

```markdown
## Overview

{{1-paragraph purpose statement explaining what this document covers and why it matters.}}

### Prerequisites

- {{Prerequisite 1}}
- {{Prerequisite 2}}
- {{Prerequisite 3}}

### What You'll Learn

By the end of this guide, you will:

- {{Learning outcome 1}}
- {{Learning outcome 2}}
- {{Learning outcome 3}}
```

### Quickstart Section Template

```markdown
## Quickstart

{{Single sentence describing what you'll accomplish in under 5 minutes.}}

```bash
# Installation or setup command
{{command}}

# Configuration (if needed)
{{config}}
```

```typescript
// {{Language}}: Minimal working example
{{code}}
```

### Expected Output

```
{{Console or expected result}}
```

**Time to complete:** {{X minutes}}
```

### Deep Dive Section Template

```markdown
## Deep Dive

{{Introductory paragraph about the detailed content.}}

### Step 1: {{Action Name}}

{{Detailed explanation of Step 1.}}

**Key Points:**

- {{Point 1}}
- {{Point 2}}

### Step 2: {{Action Name}}

{{Detailed explanation of Step 2.}}

**Edge Case:** {{Description of edge case and how to handle it}}

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `{{option}}` | `{{type}}` | `{{default}}` | {{Description}} |
| `{{option}}` | `{{type}}` | `{{default}}` | {{Description}} |
```

### Examples Section Template

```markdown
## Examples

{{Introductory sentence about examples.}}

### Basic Example

```typescript
// Basic usage
{{code}}
```

**Input:** {{Input description}}
**Output:** {{Expected output}}

### Advanced Example

```typescript
// Advanced usage with {{feature}}
{{code}}
```

**Input:** {{Input description}}
**Output:** {{Expected output}}
**Notes:** {{Important considerations}}

### Real-World Example

```typescript
// Production-ready code
{{code}}
```

**Use Case:** {{When to use this pattern}}
**Considerations:** {{Production concerns}}
```

### References Section Template

```markdown
## References

### Internal Links

- [{{Topic 1}}]({{path/to/file1.md}})
- [{{Topic 2}}]({{path/to/file2.md}})
- [{{Related Feature}}]({{path/to/file3.md}})

### External Resources

- [{{Resource Title}}]({{https://example.com}}) - {{Brief description}}
- [{{Official Documentation}}]({{https://docs.example.com}}) - {{What this covers}}

### Code Examples

- `{{path/to/example1.ts}}` - {{Description}}
- `{{path/to/example2.ts}}` - {{Description}}
- `{{path/to/test.test.ts}}` - {{Test patterns}}
```

---

## Generic Templates (Project-Agnostic)

These templates can be copied to any project without modification:

### Generic Base Template

```markdown
# {{Document Title}}

{{Brief 1-paragraph description.}}

<!-- TOC -->

- [Overview](#overview)
- [Quickstart](#quickstart)
- [Deep Dive](#deep-dive)
- [Examples](#examples)
- [References](#references)
<!-- /TOC -->

## Overview

{{Purpose statement.}}

### Prerequisites

- {{Prerequisite 1}}
- {{Prerequisite 2}}

### What You'll Learn

- {{Outcome 1}}
- {{Outcome 2}}

## Quickstart

```bash
# Setup command
{{command}}
```

```{{language}}
// Minimal example
{{code}}
```

### Expected Output

```
{{Output}}
```

## Deep Dive

### Step 1: {{Action}}

{{Explanation.}}

### Step 2: {{Action}}

{{Explanation.}}

## Examples

### Basic

```{{language}}
{{code}}
```

### Advanced

```{{language}}
{{code}}
```

## References

- [Related]({{link}})
- [External]({{https://example.com}})
```

### Generic Guide Template

```markdown
# {{Guide Title}}

{{1-paragraph overview.}}

## When to Use

Use this guide when:

- {{Scenario 1}}
- {{Scenario 2}}
- {{Scenario 3}}

## Prerequisites

- {{Requirement 1}}
- {{Requirement 2}}

## Step-by-Step

### 1. {{First Step}}

{{Explanation with context.}}

```{{language}}
{{code}}
```

### 2. {{Second Step}}

{{Explanation.}}

### 3. {{Third Step}}

{{Explanation.}}

## Best Practices

- {{Practice 1}}
- {{Practice 2}}

## Common Mistakes

- {{Mistake 1}} → {{Solution}}
- {{Mistake 2}} → {{Solution}}

## Examples

### Example 1: {{Title}}

```{{language}}
{{code}}
```

### Example 2: {{Title}}

```{{language}}
{{code}}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| {{Issue}} | {{Fix}} |
| {{Issue}} | {{Fix}} |

## Next Steps

- [{{Related Topic}}]({{link}})
- [{{Advanced Guide}}]({{link}})
```

### Generic API Template

```markdown
# {{API Name}}

{{Brief description of what this API provides.}}

## Installation

```bash
{{install-command}}
```

## Overview

{{Detailed description of the API's purpose and capabilities.}}

### Key Concepts

- {{Concept 1}}: {{Explanation}}
- {{Concept 2}}: {{Explanation}}

## Classes

### {{ClassName}}

{{Description of the class.}}

#### Constructor

```typescript
new {{ClassName}}(config: {{ConfigType}})
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `{{Type}}` | Yes | {{Description}} |

#### Methods

##### `{{methodName}}()`

{{Description of method.}}

```typescript
{{returnType}}
{{methodName}}(params: {{ParamsType}})
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param` | `{{Type}}` | Yes | {{Description}} |

**Returns:** `{{ReturnType}}`

**Example:**

```typescript
{{example}}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `option` | `{{Type}}` | `{{Default}}` | {{Description}} |

## Examples

### Basic Usage

```typescript
{{basic-example}}
```

### Advanced Usage

```typescript
{{advanced-example}}
```

## Error Handling

```typescript
try {
  await api.call();
} catch (error) {
  // Handle {{ErrorType}}
}
```

## Related

- [{{Related API}}]({{link}})
- [{{Guide}}]({{link}})
```

---

## Template Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{title}}` | Document title | User Authentication Guide |
| `{{description}}` | Brief purpose statement | Complete guide to implementing auth |
| `{{prerequisites}}` | Required knowledge | Node.js, JWT basics |
| `{{time-estimate}}` | How long it takes | 15 minutes |
| `{{complexity}}` | Difficulty level | Beginner/Intermediate/Advanced |
| `{{audience}}` | Target readers | Frontend developers |
| `{{language}}` | Programming language | typescript, python, bash |
| `{{command}}` | CLI command | npm install @package |
| `{{code}}` | Code example | See actual code |
| `{{path/to/file}}` | File path | src/orchestrator/index.ts |
| `{{link}}` | URL or relative path | ../topic/file.md |
| `{{option}}` | Configuration option | timeout |
| `{{type}}` | TypeScript/Python type | string, number, boolean |
| `{{default}}` | Default value | "30s", 1000, true |
| `{{outcome}}` | Learning outcome | Configure authentication |

---

## Exporting Templates for Other Projects

To share templates with other projects:

```bash
# 1. Navigate to your skill-forge templates
cd skill-forge/skill/aquaria-docs/references/templates/

# 2. Copy to target project
cp -r /path/to/templates /path/to/other-project/docs/.templates/

# 3. In the target project, use templates:
cp docs/.templates/base.md docs/new-topic/new-doc.md
```

### What Gets Exported

The `references/templates/` directory contains everything needed for portable documentation:

- `meta-template.md` - How to create and customize templates
- `sections/` - Reusable section patterns
- `patterns/` - Documentation patterns for common use cases
- `generic/` - Project-agnostic templates ready to use

### Customization for Other Projects

To adapt templates for a different project:

1. Replace `{{title}}` with project-specific naming conventions
2. Update `{{language}}` placeholders to match project language
3. Adjust `{{command}}` placeholders for project's package manager
4. Modify section order if project has different standards
5. Add project-specific configuration options to configuration tables

---

## Related References

- [Quality Gates](quality-gates.md) - Validation checklist
- [Folder Structure](folder-structure.md) - File organization
- [Gotchas](gotchas.md) - Common mistakes to avoid |
```
default"` | Description