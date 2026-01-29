---
name: aquaria-cloudflare-ops
description: Operate and debug Aquaria Cloudflare Worker + Workflows deployment. Deploy safely run health checks inspect traces restart stuck instances apply fixes.
references:
  - core-structure
  - build-patterns
  - install-script
  - aquaria-cli
  - workflows
  - wrangler
  - incident-response
---

# Aquaria Cloudflare Ops (rss-feed-processor)

## When to apply

- Deploy `workflows/packages/rss-feed-processor` Worker
- Check production health daily checks workflow failures
- Debug Cloudflare Workflows `item-process-workflow` `feed-poll-workflow` `qa-analysis-workflow` `daily-summary`
- Mitigate incidents kill switch bulk terminate restart stuck instances

## Inputs / prerequisites

Provide one of:

1. **Project path** (preferred): `--project workflows/packages/rss-feed-processor`
2. **Explicit URL**: `--url https://<worker>.<subdomain>.workers.dev`

Credentials:

- **Admin key** for `/api/admin/*` and `/api/traces/*`:
  - `--admin-key` flag or env `AQUARIA_ADMIN_KEY` / `ADMIN_KEY`
- **Cloudflare API token** for deep inspection and restart fallback:
  - env `CLOUDFLARE_API_TOKEN`

## Rules

1. Always start narrow then widen failure window (`--since 30m` before `24h`)
2. Never print `.env*` contents or secrets in terminal output
3. Quote operational lessons from `~/.factory/sessions/*.jsonl` not inline secrets
4. Use `--step-output=false` for Wrangler to avoid dumping huge outputs
5. Enable kill switch before investigating incidents

## Workflow decision tree

```
Request: deploy rss-feed-processor
A. Pre-deploy: test → build → kill-switch enable (if incident)
B. Deploy: wrangler deploy → capture version ID
C. Post-deploy: verify → daily-check 30m → trace list --status failure
D. If failures: trace show <instanceId> → diagnose → fix → redeploy

Request: check prod health
A. Start narrow: daily-check --since 30m
B. If issues: widen to 2h → trace list --status failure
C. If failures found: trace show <instanceId> → inspect step output

Request: debug stuck workflow
A. List: workflow list --workflow <name> --status errored
B. Inspect: trace show <instanceId> OR wrangler describe
C. Action: restart <instanceId> OR terminate <instanceId>

Request: incident response
A. Immediate (0-5m): kill-switch enable → verify → daily-check 1h
B. Diagnose (5-15m): trace list --status failure → trace show <instanceId>
C. Fix → deploy with kill-switch ON
D. Recovery: post-deploy checks → kill-switch disable only after stable
```

## Examples

**Input:** Deploy rss-feed-processor
**Output:**
```bash
pnpm -C workflows/packages/rss-feed-processor test -- --run --timeout 60000
pnpm -C workflows/packages/rss-feed-processor build
pnpm -C workflows/packages/rss-feed-processor run deploy

pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor verify
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 30m
```

**Input:** Production showing failures
**Output:**
```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 30m
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace list --workflow item-process --since 30m --status failure

# Pick instanceId from output
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace show --instance-id <instanceId>
```

**Input:** SQLITE_TOOBIG error in traces
**Output:**
```bash
# Confirm failing step
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace show --instance-id <instanceId>

# Or use Wrangler for full detail
pnpm -C workflows/packages/rss-feed-processor exec wrangler workflows instances describe item-process-workflow <instanceId> --step-output=false --truncate-output-limit 2000

# Fix: apply trace filtering to exclude large fields
# Deploy and watch
traces list --status failure --since 30m
```
