---
name: aquaria-docs
description: Expert Aquaria documentation architect. Enforce documentation principles, golden rules, templates, folder structure, and quality gates. Creates compliant docs from templates, validates against Golden Rules checklist.
references:
  - docs/DOCUMENTATION_GUIDELINES.md
  - docs/.templates/
  - AGENTS.md
  - examples/**/README.md
---

# Aquaria Documentation Skill

Expert architect for Aquaria project documentation. Enforces documentation principles, golden rules, folder structure, template compliance, and quality gates across all documentation files.

## When to Apply

- User: "create documentation for X" "write docs following project standards" "validate documentation quality"
- Task: New feature docs, API reference, troubleshooting guides, or any documentation task
- Validation: Check if docs follow Aquaria standards before submitting
- Context: Always check AGENTS.md for current framework version and operational context

## Non-Negotiable Golden Rules

### Documentation Structure

- **Hierarchy Principle**: Every doc mirrors decision tree: Root (Overview) → Branches (Sections) → Leaves (Examples/Refs)
- **Atomicity**: Docs update in isolation (one file per topic) but link bidirectionally
- **Template Enforcement**: ALWAYS copy from `/docs/.templates/` before writing

### Mandatory Sections (Exact Order)

1. **Overview**: 1-paragraph purpose + prerequisites + learning outcomes
2. **Quickstart**: Single copy-pasteable code block (<5 min setup)
3. **Deep Dive**: Numbered steps + 1-2 edge cases per flow
4. **Examples**: 2-3 runnable snippets (basic, advanced, real-world)
5. **References**: Internal links + vetted externals

### File Organization

- **Naming**: Kebab-case files (e.g., `user-auth-guide.md`)
- **Path**: `/docs/{topic}/{file}` (max 3 levels deep)
- **TOC**: Auto-generate for >500 words via `<!-- TOC -->`
- **Extensions**: Local imports MUST include `.js` extension

### Quality Gates (Pre-Commit)

- [ ] `pnpm run spellcheck` passes
- [ ] `pnpm run linkcheck` passes
- [ ] Template used correctly
- [ ] All 5 mandatory sections present
- [ ] Quickstart code is runnable
- [ ] Examples have verified outputs

## Workflow Decision Tree

```
Request: Create documentation for [topic]
A. Identify doc type
   - Feature guide → use guide.md template
   - API reference → use api-reference.md template
   - CLI command → use cli-reference.md template
   - Troubleshooting → use troubleshooting.md template
   - Design spec → use design-doc.md template
   - General → use base.md template

B. Copy template
   cp docs/.templates/{template}.md docs/{topic}/{filename}.md

C. Fill mandatory sections
   - Overview: purpose + prerequisites + learning outcomes
   - Quickstart: copy-pasteable code + expected output
   - Deep Dive: numbered steps + edge cases
   - Examples: 2-3 runnable snippets
   - References: internal + external links

D. Validate structure
   - H1 = Title matches filename
   - TOC present for >500 words
   - Heading hierarchy: H1 → H2 → H3
   - All placeholders replaced

E. Quality gates
   - spellcheck passes
   - linkcheck passes
   - Examples verified
   - Internal links resolve

Result: Compliant documentation file
```

## Available Templates

| Template | Use Case | Location |
|----------|----------|----------|
| `base.md` | Universal template | `docs/.templates/base.md` |
| `guide.md` | Feature guides, tutorials | `docs/.templates/guide.md` |
| `api-reference.md` | API documentation | `docs/.templates/api-reference.md` |
| `design-doc.md` | Technical specs, ADRs | `docs/.templates/design-doc.md` |
| `cli-reference.md` | CLI tools | `docs/.templates/cli-reference.md` |
| `troubleshooting.md` | Error guides, FAQ | `docs/.templates/troubleshooting.md` |

## Folder Structure

```
docs/
  .templates/                    # Source of truth for all docs
    base.md
    guide.md
    api-reference.md
    design-doc.md
    cli-reference.md
    troubleshooting.md
    README.md                    # Template documentation
  {topic}/                       # Max 3 levels deep
    {file-name}.md               # Kebab-case naming
  README.md                      # Docs index
  DOCUMENTATION_GUIDELINES.md    # Master rules
```

## Code Conventions Integration

### TypeScript/Code Style

- **Files**: kebab-case.ts (e.g., `agentic-orchestrator.ts`)
- **Classes**: PascalCase
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Imports**: MUST include `.js` extension

### Path Aliases

- `#/*` alias prefix maps to `packages/aquaria-workflows/src/`
- Examples: `#/capabilities/*`, `#/tools/*`, `#/orchestrator/*`

### Zod Integration

- Define schemas alongside types: `PlanNodeSchema` and `PlanNode` interface
- Use `z.infer<typeof Schema>` for type inference
- Runtime validation for all inputs

### JSDoc Mandatory

All exported symbols require:
- Description
- @param tags
- @returns tags
- @example tags (highly encouraged)

## Live Service Context

> **Critical**: Aquaria is now in live production service territory (added 2025-12-30).

Production documentation MUST include:
- Deployment considerations
- Cost implications
- Operational discipline notes
- Safety gates for production changes

## Generated Files

**DO NOT EDIT** - Regenerate with `pnpm aquaria codegen`:
- Tool Catalogs: `packages/aquaria-workflows/src/tools/catalog.{node,browser,edge}.ts`
- Capability Catalogs: `packages/aquaria-workflows/src/capabilities/capability-catalog.generated.ts`
- JSON Schemas: `packages/aquaria-schemas/schemas/*.schema.json`

## Examples

**Input:** Create documentation for new workflow feature  
**Output:**

1. Copy template: `cp docs/.templates/guide.md docs/workflows/new-feature.md`
2. Fill sections following Golden Rules
3. Add runnable code examples from `examples/workflows/`
4. Validate with: `pnpm run spellcheck && pnpm run linkcheck`

**Input:** Validate existing documentation  
**Output:** Run quality checklist:
- [ ] Template used
- [ ] All 5 sections present
- [ ] TOC generated for >500 words
- [ ] Quickstart is copy-pasteable
- [ ] Examples have expected output
- [ ] Internal links resolve
- [ ] External links vetted
- [ ] Spellcheck passes
- [ ] Linkcheck passes

**Input:** Update docs after code change  
**Output:**
1. grep for related terms in codebase
2. Append to `docs/CHANGELOG.md` in format: `## YYYY-MM-DD - [File]: [1-sentence summary]`
3. Update affected documentation sections
4. Validate all quality gates

## Quality Gate Commands

```bash
# Spell check
pnpm run spellcheck

# Link check
pnpm run linkcheck

# Generate TOC
pnpm run toc

# Validate structure
pnpm run docs:validate
```

## References

- [Documentation Guidelines](../../docs/DOCUMENTATION_GUIDELINES.md)
- [Template Library](../../docs/.templates/README.md)
- [Reusable Template Architecture](references/templates/)
- [Agent Development Rules](../../AGENTS.md)
