---
description: Load skill-forge skill and guide skill creation, refinement, or packaging
---

Load the SkillForge skill and help with any Agent Skills build task.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `.opencode/skill/skill-forge/`
   - Global: `~/.config/opencode/skill/skill-forge/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/skill-forge/main/install.sh | bash

   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/skill-forge/main/install.sh | bash -s -- --global
   ```

3. Output success message and stop (do not continue to other steps). If the URL is wrong, ask for the correct repo.

### Step 2: Load skill-forge skill

```
skill({ name: 'skill-forge' })
```

### Step 3: Identify task type from user request

Analyze $ARGUMENTS to determine:

- **Task type**: new skill, refine existing, agent-to-skill conversion, add references, update command/install
- **Scope**: skill name, repo URL, topics, examples
- **Complexity**: needs references/ structure or minimal SKILL.md

### Step 4: Read relevant reference files

Based on task type, read from `references/<topic>/`:

| Task           | Files to Read                                                       |
| -------------- | ------------------------------------------------------------------- |
| New skill      | `folder-structure/README.md` + `skill-manifest/README.md`           |
| Add references | `references-strategy/README.md` + `references-strategy/patterns.md` |
| Command format | `command-format/README.md`                                          |
| Install script | `install-script/README.md`                                          |
| End-to-end     | `workflow/README.md` + `best-practices/README.md`                   |

If unsure, read `SKILL.md`.

### Step 5: Execute task

Apply SkillForge rules, produce full folder structure, and ensure examples + decision trees.

### Step 6: Summarize

```
=== SkillForge Task Complete ===

Skill name: <name>
Files referenced: <reference files consulted>

<brief summary of what was done>
```

<user-request>
$ARGUMENTS
</user-request>
