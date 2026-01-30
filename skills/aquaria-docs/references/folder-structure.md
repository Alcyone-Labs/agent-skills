# Folder Structure & Naming

Reference for Aquaria documentation organization, naming conventions, and file structure.

## Root Structure

```
docs/
  .templates/              # Template library (source of truth)
  {topic}/                 # Documentation by topic (max 3 levels)
  README.md                # Documentation index
  DOCUMENTATION_GUIDELINES.md  # Master rules
  CHANGELOG.md             # Documentation changes log
```

## Topic Directory Structure

```
docs/
  {topic}/
    {sub-topic}/
      {file-name}.md       # Kebab-case naming
```

### Max Depth Rule

Documentation must NOT exceed 3 levels:
- ✅ `docs/building/steps/templating.md` (3 levels - OK)
- ✅ `docs/platform/edge/operations.md` (3 levels - OK)
- ❌ `docs/building/steps/templating/advanced/tricks.md` (4 levels - FAIL)

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| General docs | kebab-case | `user-auth-guide.md` |
| API references | kebab-case | `workflow-engine-api.md` |
| Troubleshooting | kebab-case | `common-errors.md` |
| Design docs | kebab-case | `autonomous-agents-design.md` |

### Forbidden Patterns

- ❌ `notes.md` (too vague)
- ❌ `My Doc File.md` (spaces, title case)
- ❌ `design_v2_FINAL.md` (underscores, version in name)

## Visual Assets

Place visual assets in:
```
docs/assets/
  images/
  diagrams/
  badges/
```

Reference with:
```markdown
![Status](assets/badges/stable.png)
```

## Template Files Location

```
docs/.templates/
  base.md              # Universal template
  guide.md             # Feature guides
  api-reference.md     # API docs
  design-doc.md        # Technical specs
  cli-reference.md     # CLI tools
  troubleshooting.md   # Error guides
  README.md            # Template documentation
```

## Documentation Root Files

| File | Purpose |
|------|---------|
| `README.md` | Entry point, navigation index |
| `DOCUMENTATION_GUIDELINES.md` | Master rules and standards |
| `CHANGELOG.md` | Track all documentation changes |

## Related References

- [Templates Guide](templates.md)
- [Quality Gates](quality-gates.md)
