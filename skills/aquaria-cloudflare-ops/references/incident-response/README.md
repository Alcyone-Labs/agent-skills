# Incident Response

## Overview

Fast stop slow recovery pattern for production incidents.

## Decision tree

```
Incident detected:
A. Immediate (0-5 min):
   1. Enable kill switch
   2. Get health snapshot
   3. Capture failure list

B. Diagnose (5-15 min):
   1. List failures
   2. Inspect instance
   3. Identify root cause

C. Fix and verify:
   1. Deploy fix with kill-switch ON
   2. Post-deploy checks
   3. Confirm health stable

D. Recovery:
   1. Disable kill switch ONLY after stable
   2. Monitor for 30m
```

## Immediate response

```bash
# Stop the bleeding
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch enable
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch status

# Get snapshot
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor verify
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 1h
```

## Diagnose

```bash
# List failures
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace list --workflow item-process --since 6h --status failure

# Inspect one
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace show --instance-id <instanceId>
```

## Recovery

```bash
# Deploy fix (kill switch still ON)
pnpm -C workflows/packages/rss-feed-processor test -- --run --timeout 60000
pnpm -C workflows/packages/rss-feed-processor build
pnpm -C workflows/packages/rss-feed-processor run deploy

# Verify
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor verify
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 30m
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor trace list --workflow item-process --since 30m --status failure

# Only after stable - disable kill switch
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch disable

# Monitor
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor daily-check --since 30m
```

## Kill switch patterns

### Enable before risky deploys

```bash
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch enable
pnpm -C workflows/packages/rss-feed-processor run deploy
# ... verify ...
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor kill-switch disable
```

### Keep on during incident investigation

Never disable kill switch until:
- Health checks pass
- No new failures for 30m
- Root cause understood and fixed

### Bulk restart after kill switch

When disabling after incident workflows may be backed up:

```bash
# List all errored
pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow list --workflow item-process-workflow --status errored --limit 100

# Restart in batches (scriptable)
```
