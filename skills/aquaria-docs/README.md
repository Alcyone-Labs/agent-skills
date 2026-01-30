# Aquaria Documentation Skill

Expert documentation architect for the Aquaria project. Enforces documentation principles, golden rules, templates, folder structure, and quality gates across all documentation files.

## What This Skill Does

Creates, validates, and maintains Aquaria project documentation following strict structural and quality standards. Ensures every documentation file meets the project's Golden Rules for Documentation Structure.

## When to Use This Skill

Use this skill when you need to:

- Create new documentation for features, APIs, or workflows
- Validate existing documentation against project standards
- Enforce template compliance
- Set up documentation structure for new topics
- Review and improve documentation quality

## Quick Decision Tree

| Your Goal | Template to Use |
|-----------|----------------|
| Feature guide/tutorial | `guide.md` |
| API/class documentation | `api-reference.md` |
| CLI tool documentation | `cli-reference.md` |
| Troubleshooting/FAQ | `troubleshooting.md` |
| Technical specification | `design-doc.md` |
| General documentation | `base.md` |

## Core Principles

### 1. Documentation Hierarchy

Every document follows this exact structure:

```
# H1 = Document Title

## Overview
   └── Purpose, prerequisites, learning outcomes

## Quickstart
   └── Copy-pasteable code + expected output

## Deep Dive
   └── Numbered steps + edge cases

## Examples
   └── 2-3 runnable snippets

## References
   └── Internal links + vetted externals
```

### 2. Template First Approach

NEVER write documentation from scratch. ALWAYS:

1. Copy the appropriate template
2. Replace placeholders with actual content
3. Validate against Golden Rules checklist

### 3. Quality Gates

Before any documentation commit, verify:

- [ ] Template used correctly
- [ ] All 5 mandatory sections present
- [ ] TOC auto-generated for >500 words
- [ ] Quickstart code is runnable (<5 min setup)
- [ ] Examples have verified expected outputs
- [ ] Internal links resolve correctly
- [ ] External links are vetted sources
- [ ] `pnpm run spellcheck` passes
- [ ] `pnpm run linkcheck` passes

## Live Service Context

Aquaria operates as a live production service (since 2025-12-30). Documentation for production features MUST include:

- Deployment considerations
- Cost and SLO implications
- Operational safety gates
- Emergency response protocols

## Integration with Codebase

This skill integrates with Aquaria's:

- **Code Conventions**: Enforces kebab-case files, PascalCase classes, camelCase functions
- **Path Aliases**: Uses `#/*` prefix for internal imports (`#/capabilities/*`, `#/tools/*`, etc.)
- **Zod Schemas**: Validates configuration and types in documentation
- **JSDoc Standards**: Ensures all exported APIs have proper documentation
- **Generated Files**: Regenerate catalogs/schemas with `pnpm aquaria codegen`

## Related Skills

- `aquaria-cloudflare-ops`: Cloudflare-specific documentation patterns
- `skill-forge`: General skill creation and packaging
