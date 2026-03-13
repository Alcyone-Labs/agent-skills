---
name: exa-search
version: 1.1.0
description: AI-powered search using Exa. Search web, code, companies, and crawl URLs with structured output.
---

# Exa Search

Use this skill when you need high-signal web and code retrieval from Exa.

## Quick Start

```bash
exa-set-key YOUR_API_KEY
exa-search "best practices for LLM prompt engineering"
exa-code "React useEffect cleanup pattern TypeScript"
exa-company "Anthropic"
exa-crawl "https://docs.anthropic.com"
```

## Exported Commands

- `exa-search` — general search
- `exa-code` — code-focused search
- `exa-company` — company research
- `exa-crawl` — crawl URL content
- `exa-set-key` — store API key
- `exa-get-key` — print key from configured provider
- `exa-mcp-config` — print MCP configuration template

## API Key

- Get your key at https://dashboard.exa.ai/api-keys
- `exa-set-key` stores credentials in macOS Keychain or Linux config file.
- `EXA_API_KEY` environment variable takes precedence.

## MCP Configuration

```json
{
  "mcpServers": {
    "exa": {
      "url": "https://mcp.exa.ai/mcp?exaApiKey=YOUR_API_KEY"
    }
  }
}
```
