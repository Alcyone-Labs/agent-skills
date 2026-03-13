# Exa Search Skill

Self-contained Exa search skill package.

## Exported commands

- `exa-search`
- `exa-code`
- `exa-company`
- `exa-crawl`
- `exa-set-key`
- `exa-get-key`
- `exa-mcp-config`

## Install

```bash
bash install.sh --local --dry-run
# or
agent-skills install exa-search --local
```

## Notes

- Scripts resolve helper paths relative to the skill root.
- No hardcoded repository absolute paths are used.
- API key can be provided via `EXA_API_KEY` or stored via `exa-set-key`.
