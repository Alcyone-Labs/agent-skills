---
description: Load ArgParser skill for building type-safe CLI tools with MCP integration
argument-hint: <task description>
---

Load the ArgParser skill and help build CLI tools with type-safe argument parsing and MCP integration.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `.factory/skills/arg-parser/`
   - Global: `~/.factory/skills/arg-parser/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local --droid

   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --droid
   ```

3. Output success message and stop (do not continue to other steps).

### Step 2: Load skill

Load the arg-parser skill.

### Step 3: Identify task type

Analyze $ARGUMENTS to determine:

| Task | Read from references/ |
|------|----------------------|
| New CLI tool | `core-api/` + `flags/` |
| MCP integration | `mcp-integration/` |
| Type definitions | `types/` |
| Complex flags | `flags/` + `core-api/` |

### Step 4: Execute

Apply SKILL.md rules and reference docs. Provide code examples.

### Step 5: Summarize

```
=== Task Complete ===
Action: <what was done>
Files created: <list>
Key features: <list>
```

<user-request>
$ARGUMENTS
</user-request>
