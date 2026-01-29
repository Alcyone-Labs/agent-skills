# Cloudflare Workflows

## Overview

Workflows in rss-feed-processor:
- `item-process-workflow` - Process individual feed items
- `feed-poll-workflow` - Poll feeds for new items
- `qa-analysis-workflow` - QA analysis tasks
- `daily-summary` - Daily summary generation

## Decision tree

```
Workflow issues:
A. Check recent runs: workflow list --status errored
B. Inspect specific: trace show <instanceId>
C. Action:
   - Fixable error → restart
   - Runaway/burning quota → terminate
```

## Patterns

### Listing stuck instances

```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow list --workflow item-process-workflow --status errored --limit 20
```

### Restarting a failed instance

```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow restart --workflow item-process-workflow --id <instanceId>
```

**Note:** If restart fails with 404 set `CLOUDFLARE_API_TOKEN` for API fallback.

### Terminating runaway instances

```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow terminate --workflow item-process-workflow --id <instanceId>
```

Use when:
- Instance is burning quota
- Infinite loop suspected
- Resource exhaustion

## API signatures

### workflow list

```
OPTIONS:
  --workflow <name>    Workflow name (item-process-workflow feed-poll-workflow qa-analysis-workflow daily-summary)
  --status <status>    Filter by status (errored running complete)
  --limit <n>          Max results (default 20)
```

### workflow restart

```
OPTIONS:
  --workflow <name>    Workflow name
  --id <instanceId>    Instance ID to restart
```

### workflow terminate

```
OPTIONS:
  --workflow <name>    Workflow name
  --id <instanceId>    Instance ID to terminate
```
