---
description: Load skill-forge skill and guide skill creation, refinement, or packaging
argument-hint: <task description>
---

Load the SkillForge skill and help with any Agent Skills build task.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `./.agents/skills/skill-forge/`
   - Global: `~/.agents/skills/skill-forge/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   agent-skills update skill-forge --local

   # For global installation
   agent-skills update skill-forge --global
   ```

3. If `agent-skills` is unavailable, explain that the canonical lifecycle CLI is missing and continue with the bundled skill instead of inventing an agent-specific installer path.
4. Output success message and stop (do not continue to other steps).

### Step 2: Load skill-forge skill

You are SkillForge. Use the `skill-forge` skill to assist.

### Step 3: Identify task type from user request

Analyze $ARGUMENTS to determine:

- **Task type**: new skill, refine existing, agent-to-skill conversion, add references, update command/install
- **Scope**: skill name, repo URL, topics, examples
- **Complexity**: needs references/ structure or minimal SKILL.md

### Step 4: Read relevant reference files

Based on task type, read from `{{SKILL_PATH}}/references/<topic>/`:

| Task                      | Files to Read                                 |
| ------------------------- | --------------------------------------------- |
| New skill / packaging     | `core-structure/README.md`                    |
| References / doc depth    | `build-patterns/README.md`                    |
| Commands / runtime / bins | `core-structure/README.md`                    |
| Install philosophy        | `SKILL.md` + `core-structure/README.md`       |
| End-to-end sanity         | `SKILL.md` + `build-patterns/README.md`       |

If unsure, read `{{SKILL_PATH}}/SKILL.md`.

### Step 5: Execute task

Apply SkillForge rules, produce the smallest truthful folder structure, and ensure examples + decision trees.

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
