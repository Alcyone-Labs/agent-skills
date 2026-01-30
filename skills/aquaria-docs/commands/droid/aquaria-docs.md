---
description: Load aquaria-docs skill for creating or validating Aquaria project documentation
description: <task description>
argument-hint: <task description>
---

Load the AquariaDocs skill and help with documentation creation, validation, and scaffolding following strict Aquaria documentation standards.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `.factory/skills/aquaria-docs/`
   - Global: `~/.factory/skills/aquaria-docs/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local --droid --skill aquaria-docs

   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --droid --skill aquaria-docs
   ```

3. Output success message and stop (do not continue to other steps).

### Step 2: Load skill

Load the aquaria-docs skill from `{{SKILL_PATH}}/SKILL.md`.

### Step 3: Identify task type

Analyze $ARGUMENTS to determine:

| Task | Read from references/ |
|------|----------------------|
| Create new docs | `templates/` + `folder-structure.md` |
| Validate docs | `quality-gates.md` + `gotchas.md` |
| Template usage | `templates/meta-template.md` |
| Folder structure | `folder-structure.md` |

### Step 4: Execute

Apply SKILL.md rules and reference docs:

1. **If creating documentation**:
   - Identify doc type from $ARGUMENTS (guide, api-reference, cli-reference, troubleshooting, design-doc)
   - Copy appropriate template from `{{SKILL_PATH}}/references/templates/sections/`
   - Fill all 5 mandatory sections: Overview, Quickstart, Deep Dive, Examples, References
   - Apply kebab-case naming convention
   - Ensure max 3 levels deep path structure

2. **If validating documentation**:
   - Check all quality gates from `quality-gates.md`
   - Verify template compliance
   - Ensure mandatory sections present
   - Validate code examples are runnable
   - Check internal/external links resolve

3. **If scaffolding structure**:
   - Create topic directory with README.md
   - Add appropriate template files
   - Follow folder structure conventions

### Step 5: Quality Gates

Before completing, verify:

- [ ] Template used correctly (copied from templates/, not recreated)
- [ ] All 5 mandatory sections present (Overview, Quickstart, Deep Dive, Examples, References)
- [ ] TOC generated for docs >500 words
- [ ] Quickstart code is copy-pasteable and runnable
- [ ] Examples have expected outputs documented
- [ ] File naming is kebab-case
- [ ] Path depth is max 3 levels
- [ ] Internal links resolve correctly

### Step 6: Summarize

```
=== AquariaDocs Task Complete ===

Action: <what was done>
Files created/modified: <list>
Templates used: <list>
Quality gates passed: <count>/8

<brief summary of documentation work>
```

<user-request>
$ARGUMENTS
</user-request>
