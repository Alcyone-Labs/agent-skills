# Aquaria CLI Commands

## Overview

Aquaria CLI provides Cloudflare operations through `pnpm -s aquaria cloudflare`.

## Decision tree

```
Need to:
- Check health → daily-check
- Inspect traces → trace list / trace show
- Manage workflows → workflow list / restart / terminate
- Emergency stop → kill-switch
- Verify deployment → verify
```

## Commands

### verify

Verify deployment and connectivity.

```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor verify
```

### daily-check

Health check with configurable window.

```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 30m
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 2h
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 24h
```

### trace

Query workflow traces.

```bash
# List failures
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace list --workflow item-process --since 24h --status failure

# Show specific instance
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace show --instance-id <instanceId>
```

### workflow

Manage workflow instances.

```bash
# List errored instances
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow list --workflow item-process-workflow --status errored --limit 20

# Restart instance
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow restart --workflow item-process-workflow --id <instanceId>

# Terminate instance
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow terminate --workflow item-process-workflow --id <instanceId>
```

### kill-switch

Emergency stop control.

```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch enable
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch disable
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch status
```

## Source locations

- Command registration: `packages/aquaria-cli/src/cli/commands/cloudflare.ts`
- Deployment verification: `packages/aquaria-cli/src/cli/commands/cloudflare/verify.ts`
- Daily health checks: `packages/aquaria-cli/src/cli/commands/cloudflare/daily-check.ts`
- Trace querying: `packages/aquaria-cli/src/cli/commands/cloudflare/trace.ts`
- Workflow management: `packages/aquaria-cli/src/cli/commands/cloudflare/workflow.ts`
- Kill switch: `packages/aquaria-cli/src/cli/commands/cloudflare/kill-switch.ts`
