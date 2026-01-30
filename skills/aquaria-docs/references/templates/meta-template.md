# Meta-Template: Creating Documentation Templates

This template provides a standardized structure for creating new documentation templates. Use this when you need to extend the template library or create project-specific templates.

## Template Metadata

| Property | Value |
|----------|-------|
| **Purpose** | Provide a standardized structure for creating new templates |
| **Sections** | Metadata, Variables, Section Structure, Examples, Quality Checklist |
| **Complexity** | Intermediate |
| **Time to Complete** | 30-60 minutes |

## When to Use This Template

- Creating a new template for an undocumented content type
- Extending the template library with specialized templates
- Customizing templates for project-specific needs

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{template-name}}` | Filename of the template | api-reference.md |
| `{{purpose}}` | What the template is for | API documentation |
| `{{sections}}` | Comma-separated section list | Overview, API, Examples |
| `{{complexity}}` | Difficulty level | Beginner, Intermediate, Advanced |
| `{{time-estimate}}` | Time to fill out | 20 minutes |
| `{{audience}}` | Target readers | Developers, End Users, Architects |

## Section Structure

### 1. Purpose and Scope

Describe what this template is for and when to use it. Include a decision matrix if there are similar templates.

### 2. Template Metadata

Provide a table with template properties for easy reference.

### 3. Variables Reference

Document all template variables with descriptions and examples.

### 4. Section Templates

Provide the markdown structure for each section, with placeholders clearly marked.

### 5. Examples

Show completed examples of the template in use.

### 6. Quality Checklist

Define what makes a good instance of this template.

## Template Example

```markdown
# {{Template Name}}

{{Brief 1-paragraph description of what this template covers.}}

## Template Metadata

| Property | Value |
|----------|-------|
| **Purpose** | {{What this template is for}} |
| **Sections** | {{Section 1, Section 2, Section 3}} |
| **Complexity** | {{Beginner|Intermediate|Advanced}} |
| **Time to Complete** | {{X minutes}} |

## When to Use

Use this template when:
- {{Scenario 1}}
- {{Scenario 2}}
- {{Scenario 3}}

Do NOT use this template when:
- {{Scenario 1}}
- {{Scenario 2}}

## Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{var1}}` | Description | value |
| `{{var2}}` | Description | value |

## Section Templates

### Section 1: {{Name}}

```markdown
## {{Section Title}}

{{Content description and structure}}
```

### Section 2: {{Name}}

```markdown
## {{Section Title}}

{{Content description and structure}}
```

## Examples

### Example 1: {{Title}}

```markdown
# {{Actual Title}}

## Overview

{{Filled content}}
```

## Quality Checklist

- [ ] Purpose clearly stated
- [ ] All variables replaced
- [ ] Examples are runnable
- [ ] Cross-references included
- [ ] Valid markdown syntax

## Related Templates

- [Template A](template-a.md) - {{Relationship}}
- [Template B](template-b.md) - {{Relationship}}
```

## Quality Checklist

- [ ] Purpose clearly stated in first paragraph
- [ ] Metadata table complete
- [ ] All variables documented with examples
- [ ] Section templates provide clear structure
- [ ] At least one complete example provided
- [ ] Quality checklist defined for template users
- [ ] Related templates cross-referenced
- [ ] Valid markdown syntax throughout

## Common Extensions

### Extending for API Documentation

```markdown
## Classes

### ClassName

{{Description}}

#### Constructor

```typescript
new ClassName(config: Config)
```

#### Methods

##### methodName()

```typescript
returnType methodName(params: ParamType)
```
```

### Extending for CLI Tools

```markdown
## Commands

### command-name

{{Description}}

```bash
command-name [options] <args>
```

**Options:**

| Option | Description |
|--------|-------------|
| `-h` | Show help |
| `-v` | Show version |
```
