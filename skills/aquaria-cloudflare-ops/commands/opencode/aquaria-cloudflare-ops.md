---
description: Load Aquaria Cloudflare Ops skill guide
---

## Workflow

### Step 1: Check for --update-skill flag

If request contains `--update-skill`:
1. Determine install location (local `.opencode/` or global `~/.config/opencode/`)
2. Run: `curl -fsSL <repo>/install.sh | bash` (add `-s -- --global` for global)
3. Output success and stop

### Step 2: Load skill

```
skill({ name: 'aquaria-cloudflare-ops' })
```

### Step 3: Identify task type

| Task | Read from references/ |
|------|----------------------|
| Deploy | `aquaria-cli/` + `workflows/` |
| Health check | `aquaria-cli/README.md` |
| Debug workflow | `workflows/` + `wrangler/` |
| Incident | `incident-response/` |
| Error fix | `incident-response/gotchas.md` |

### Step 4: Execute

Apply SKILL.md rules and reference docs. Provide concrete commands.

### Step 5: Summarize

```
=== Task Complete ===
Action: <what was done>
Commands used: <list>
Status: <result>
```
