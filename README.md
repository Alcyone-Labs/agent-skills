# Agent Skills

A curated collection of Agent Skills plus a publishable lifecycle CLI (`@alcyone-labs/agent-skills`).

## Install and run the CLI

### One-off execution

```bash
# npm
npx --yes @alcyone-labs/agent-skills --help

# pnpm
pnpm dlx @alcyone-labs/agent-skills --help
# alias
pnpx @alcyone-labs/agent-skills --help
```

### Global install

```bash
# npm
npm install -g @alcyone-labs/agent-skills

# pnpm
pnpm add -g @alcyone-labs/agent-skills

agent-skills --help
```

## Canonical install locations

- Global skills: `~/.agents/skills/<skill>`
- Global bins: `~/.agents/bin/<command>`
- Local skills: `./.agents/skills/<skill>`
- Local bins: `./.agents/bin/<command>`

## Core commands

```bash
agent-skills install <skill> [--local|--global] [--dry-run]
agent-skills list
agent-skills find <free-text request> [--limit 1..5]
agent-skills use <skill> <skill-bin> [args...]
agent-skills run <skill> <skill-bin> [args...]
agent-skills validate [<skill>] [--local|--global]
agent-skills update <skill> [--local|--global] [--dry-run]
agent-skills uninstall <skill> [--local|--global] [--dry-run]
agent-skills prune [--local|--global] [--dry-run]
agent-skills reset <skill> [--local|--global] [--dry-run]
agent-skills clean [--local|--global] [--dry-run]
agent-skills purge <skill> [--local|--global] [--dry-run]
agent-skills print-mcp-config [--allow-skill <name>] [--deny-skill <name>]
```

## Available skills

Current skill directories:

- `aquaria-cloudflare-ops`
- `aquaria-docs`
- `arg-parser`
- `chrome-extension-architect`
- `exa-search`
- `git-commit-writer`
- `large-file-refactorer`
- `lightpanda`
- `playwright-chrome-extension-testing`
- `sauve-jazz-extension`
- `simple-logger-usage`
- `skill-forge`

Each skill is self-contained under `skills/<skill>/` and may expose user-facing commands through `skills/<skill>/bin/`.

## Legacy shell installer

`install.sh` remains available for compatibility and local repo workflows:

```bash
./install.sh --self --global --agents --skill exa-search
```

The canonical v2 interface is `agent-skills`.
