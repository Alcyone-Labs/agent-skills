---
description: Load ArgParser skill guide for building type-safe CLI tools with MCP integration
---

## Workflow

### Step 1: Check for --update-skill flag

If `$ARGUMENTS` contains `--update-skill`:
1. Determine install location (local `.opencode/` or global `~/.config/opencode/`)
2. Run: `curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash` (add `-s -- --global` for global)
3. Output success and stop

### Step 2: Load skill

```javascript
skill({ name: 'arg-parser' });
```

### Step 3: Identify task type

Analyze `$ARGUMENTS` to determine:
- **Task type**: new CLI, add MCP, add flags, complex validation
- **Scope**: single command, multi-command CLI, library usage

### Step 4: Read relevant reference files

Based on task type, read from `references/<topic>/`:

| Task | Files to Read |
|------|---------------|
| New CLI tool | `core-api/` + `flags/` |
| MCP integration | `mcp-integration/` |
| Type definitions | `types/` |
| Complex flags | `flags/` + `core-api/` |

### Step 5: Execute

Apply SKILL.md rules and reference docs. Provide code examples.

### Step 6: Summarize

```
=== ArgParser Task Complete ===
Action: <what was done>
Files created: <list>
Key features: <list>
```

<user-request>
$ARGUMENTS
</user-request>
