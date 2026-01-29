---
description: Load Git Commit Writer skill for generating conventional commit messages
argument-hint: <task description>
---

Load the Git Commit Writer skill and help write consistent, high-quality Git commit messages.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `.factory/skills/git-commit-writer/`
   - Global: `~/.factory/skills/git-commit-writer/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local --droid

   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --droid
   ```

3. Output success message and stop (do not continue to other steps).

### Step 2: Load skill

Load the git-commit-writer skill.

### Step 3: Analyze staged changes

1. Check what files are staged: `git diff --cached --name-only`
2. Analyze the diff: `git diff --cached --stat`
3. Read project conventions from AGENTS.md if it exists
4. Review recent commit history for project patterns

### Step 4: Read relevant reference files

| Task | Read from references/ |
|------|----------------------|
| Conventional commits | `conventional-commits/` |
| Style guide | `style-guide/` |
| Context analysis | `context-analysis/` |
| Examples | `examples/` |

### Step 5: Generate commit message

Based on analysis:
1. **Classify change type** - feat, fix, refactor, docs, style, test, chore, perf, security
2. **Determine scope** - affected domain/module
3. **Write subject** - max 50 chars, imperative mood, no trailing period
4. **Add body if needed** - wrap at 72 chars, explain what and why

### Step 6: Output

Provide the generated commit message:

```
=== Generated Commit Message ===

<type>[(scope)]: <subject>

[body if needed]

=== Usage ===
git commit -m "<type>[(scope)]: <subject>"
```

<user-request>
$ARGUMENTS
</user-request>
