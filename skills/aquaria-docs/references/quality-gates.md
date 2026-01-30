# Quality Gates & Validation

Complete reference for documentation quality enforcement in Aquaria.

## Pre-Commit Checklist

Run this binary checklist before any documentation commit:

### Structure Validation

- [ ] Template used correctly
- [ ] TOC present (`<!-- TOC -->`) for >500 words
- [ ] Heading hierarchy maintained (H1 → H2 → H3)
- [ ] H1 title matches filename

### Content Validation

- [ ] All 5 sections filled (Overview, Quickstart, Deep Dive, Examples, References)
- [ ] Quickstart code is copy-pasteable
- [ ] Examples have verified expected outputs
- [ ] Internal links resolve correctly
- [ ] External links are vetted sources

### Consistency Check

- [ ] Naming follows kebab-case convention
- [ ] Path structure follows max 3 levels rule
- [ ] Code blocks use fenced format (```typescript)
- [ ] No trailing notes or empty lines >2

### Link & Spell Validation

- [ ] `pnpm run spellcheck` passes
- [ ] `pnpm run linkcheck` passes
- [ ] 0 broken links
- [ ] <5% redundancy

## Validation Commands

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

## Accessibility Requirements

- Semantic Markdown only
- Descriptive alt text for images
- No color-only cues
- Test exports with axe-core

## Update Protocol

On code changes:
1. grep for related terms across codebase
2. Append to `docs/CHANGELOG.md`:
   ```markdown
   ## YYYY-MM-DD - [File]: [1-sentence summary]
   ```
3. Update affected documentation sections
