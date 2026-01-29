---
description: Load Aquaria Cloudflare Ops skill for deploying and debugging Cloudflare Workers
argument-hint: <task description>
---

Load the Aquaria Cloudflare Ops skill and help operate Cloudflare Workers and Workflows.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `.factory/skills/aquaria-cloudflare-ops/`
   - Global: `~/.factory/skills/aquaria-cloudflare-ops/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local --droid

   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --droid
   ```

3. Output success message and stop (do not continue to other steps).

### Step 2: Load skill

Load the aquaria-cloudflare-ops skill.

### Step 3: Identify task type

Analyze $ARGUMENTS to determine:

| Task | Read from references/ |
|------|----------------------|
| Deploy | `aquaria-cli/` + `workflows/` |
| Health check | `aquaria-cli/README.md` |
| Debug workflow | `workflows/` + `wrangler/` |
| Incident | `incident-response/` |
| Error fix | `incident-response/gotchas.md` |

### Step 4: Execute

Apply SKILL.md rules and reference docs. Provide concrete commands.

Always:
1. Start narrow (`--since 30m` before `24h`)
2. Never print secrets or .env contents
3. Use `--step-output=false` for Wrangler
4. Enable kill switch before incident investigation

### Step 5: Summarize

```
=== Task Complete ===
Action: <what was done>
Commands used: <list>
Status: <result>
```

<user-request>
$ARGUMENTS
</user-request>
