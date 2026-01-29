# Common Errors and Fixes

## Overview

Symptom to diagnosis to fix mapping.

## Error decision tree

```
Error seen:
A. Provider method not supported → Provider affinity issue
B. SQLITE_TOOBIG → Trace persistence too large
C. Not serializable → Step returning non-JSON
D. Restart 404 → Use API token fallback
E. Feed poll healthy but no items → Check queue depth and item-process runs
```

## Provider 'native' does not support method 'transcript'

**Symptom:**
```
Provider 'native' does not support method 'transcript'
```

**Cause:** Method-based capability call inherited global provider affinity (cost pin) that does not implement the requested method.

**Fix:**
1. Find failing step in trace output
2. Override provider on step's inputs for specific method
3. Deploy and recheck with `daily-check --since 30m`

## SQLITE_TOOBIG

**Symptom:**
```
Error: ExecutionError: Step store-r2 failed: string or blob too big: SQLITE_TOOBIG
```

**Cause:** Trace storage (Durable Object SQLite) attempting to persist huge value (full markdown large arrays like embedding vectors).

**Fix:**
1. Confirm failing step via `trace show` or Wrangler describe
2. Apply trace filtering to exclude large fields from persisted traces
3. Deploy and watch `trace list --status failure`

## WorkflowFatalError: not serialisable

**Symptom:**
```
WorkflowFatalError: ... returned a value which is not serialisable
```

**Cause:** Step returned something Cloudflare Workflows cannot serialize (Error object BigInt circular structure).

**Fix:**
1. Identify step via Wrangler describe output
2. Ensure step outputs are plain JSON-compatible data
3. Deploy and rerun checks

## workflow restart fails with 404

**Symptom:**
```
404 Not Found on workflow restart
```

**Cause:** Some deployments do not expose worker admin restart endpoint.

**Fix:**
1. Set `CLOUDFLARE_API_TOKEN`
2. Rerun restart (CLI supports Cloudflare API fallback)

## feed-poll healthy but items never process

**Symptom:**
- feed-poll appears healthy
- No items being processed

**Cause:**
- Polling enqueues item-process incorrectly (waiting for completion instead of fire-and-forget)
- Registry or QA backlog

**Fix:**
1. Check queue depth + alarms in `daily-check` output
2. Confirm item-process runs exist:
   ```bash
   pnpm -s aquaria cloudflare --project workflows/packages/rss-feed-processor workflow list --workflow item-process-workflow --limit 20
   ```
3. If instances stuck or errored restart or terminate as appropriate

**Session evidence:**
> "If we call `this.env.WORKFLOW_ITEM_PROCESSOR.create(...)` and wait for the workflow to complete we'd just be blocking on it."

## Session evidence locations

When quoting operational lessons reference session artifacts under:
- `~/.factory/sessions/*.jsonl`

Avoid printing `.env*` contents or secrets in terminal output.
