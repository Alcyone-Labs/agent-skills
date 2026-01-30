# Aquaria Documentation Overview

Reference guide for Aquaria documentation principles, structure, and quality standards.

## When to Use

- Creating new documentation for Aquaria features or workflows
- Validating existing documentation against quality gates
- Setting up documentation structure for a new project
- Understanding Aquaria-specific documentation conventions

## Decision Tree

```
Request: Work with Aquaria documentation
│
├─ Create new documentation?
│  ├─ Identify doc type:
│  │   ├─ Feature guide → Read: templates/sections/ + templates.md
│  │   ├─ API reference → Read: templates/sections/ + folder-structure.md
│  │   ├─ CLI docs → Read: templates/sections/ + gotchas.md
│  │   └─ Troubleshooting → Read: templates/sections/ + quality-gates.md
│  └─ Apply: Copy template → Fill 5 sections → Validate
│
├─ Validate existing docs?
│  ├─ Read: quality-gates.md + gotchas.md
│  └─ Apply: Run quality checklist → Fix issues → Re-validate
│
├─ Scaffold doc structure?
│  ├─ Read: folder-structure.md
│  └─ Apply: Create topic dir → Add README.md → Add templates
│
└─ Understand conventions?
   └─ Read: This file + templates.md
```

## Documentation Principles

### Hierarchy Principle

Every documentation file mirrors a decision tree:
- **Root**: Overview (What is this? Why does it matter?)
- **Branches**: Sections (How do I use it? What are the options?)
- **Leaves**: Examples/References (Show me the code, point me to more)

No loose ends; every element serves the "What? Why? How?" flow.

### Atomicity

- Docs update in isolation (one file per topic)
- Files link bidirectionally for cohesion
- Changes to one topic don't cascade across unrelated files

### Enforceability

- Templates, linters, and checklists gate commits
- AI agents generate from `/docs/.templates/base.md`
- Validate before proposing changes

## Golden Rules Summary

| Rule Category | Do | Don't |
|--------------|-----|-------|
| **File Structure** | H1=Title, H2 core sections, H3 subpoints | Ad-hoc sections, prose dumps |
| **Naming & Paths** | Kebab-case, max 3 levels deep | Vague names, flat structures |
| **Visual Consistency** | Badges, fenced code blocks only | Inconsistent styling, unlabeled images |

## Mandatory Section Order

1. Overview (1 paragraph + prerequisites)
2. Quickstart (copy-pasteable code <5 min)
3. Deep Dive (numbered steps + edge cases)
4. Examples (2-3 runnable snippets)
5. References (internal links + vetted externals)

## Related References

- [Templates Guide](templates.md)
- [Quality Gates](quality-gates.md)
- [Folder Structure](folder-structure.md)
