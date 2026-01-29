# Wrangler Deep Inspection

## Overview

Use Wrangler for step-by-step workflow details without dumping huge outputs.

## When to use Wrangler

- Need detailed step-by-step trace
- Aquaria CLI trace output truncated
- Debugging serialization errors
- Confirming step outputs

## Decision tree

```
Need deep inspection:
A. List instances: wrangler workflows instances list <workflow>
B. Describe instance: wrangler workflows instances describe <workflow> <instanceId> [options]
```

## Commands

### List workflow instances

```bash
pnpm -C workflows/packages/rss-feed-processor exec wrangler workflows instances list item-process-workflow
```

### Describe instance (safe)

```bash
pnpm -C workflows/packages/rss-feed-processor exec wrangler workflows instances describe item-process-workflow <instanceId> --step-output=false --truncate-output-limit 2000
```

**Flags explained:**
- `--step-output=false` - Do not dump full step outputs (prevents huge traces)
- `--truncate-output-limit 2000` - Truncate outputs to 2000 chars

## Patterns

### Debugging serialization errors

When you see `WorkflowFatalError: ... returned a value which is not serialisable`:

1. Get instance ID from `trace list --status failure`
2. Use Wrangler describe to identify which step failed
3. Fix step to return JSON-compatible data
4. Redeploy and rerun

### Inspecting SQLITE_TOOBIG

When trace persistence fails:

1. Use Wrangler describe to see step without huge persisted values
2. Apply trace filtering to exclude large fields
3. Deploy and verify with `trace list --status failure`
