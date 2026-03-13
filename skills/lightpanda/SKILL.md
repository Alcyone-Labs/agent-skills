---
name: lightpanda
version: 2.1.0
description: Lightpanda browser with native LP domain commands for fetching markdown, semantic trees, and structured data.
---

# Lightpanda

Use this skill instead of Chrome/Chromium when you need token-efficient content extraction and LP native semantic/interactive data.

## Quick Start

```bash
lightpanda-start
lightpanda-fetch "https://example.com"
lightpanda-structured "https://example.com"
lightpanda-interactive "https://example.com"
lightpanda-semantic "https://example.com"
lightpanda-stop
```

## Exported Commands

- `lightpanda-start` — start local Lightpanda CDP server
- `lightpanda-stop` — stop server started by this skill
- `lightpanda-fetch` — convert URL to markdown via `LP.getMarkdown`
- `lightpanda-structured` — extract `LP.getStructuredData`
- `lightpanda-interactive` — extract `LP.getInteractiveElements`
- `lightpanda-semantic` — extract `LP.getSemanticTree`

## Runtime Model

- Browser binary is provisioned inside the installed skill directory at `runtime/browser/lightpanda`.
- Node dependency `playwright-core` is installed in-skill (`node_modules/`).
- PID/log state is owned under `runtime/state/` for safe `reset`/`clean` operations.

## Native LP Commands

- `LP.getMarkdown`
- `LP.getSemanticTree`
- `LP.getInteractiveElements`
- `LP.getStructuredData`

## Notes

- DuckDuckGo is generally safer than Google for automated browsing with Lightpanda.
- Keep one CDP connection per process; use separate ports for concurrency.
