# @alcyone-labs/agent-skills

`agent-skills` is the lifecycle CLI for Agent Skills packaging and installs.

## Canonical install locations

- Global skills: `~/.agents/skills/<skill>`
- Global bins: `~/.agents/bin/<command>`
- Local skills: `./.agents/skills/<skill>`
- Local bins: `./.agents/bin/<command>`

Compatibility exports (for clients that do not read `.agents/skills`) are derived from the canonical install.

## Commands

```bash
agent-skills install <skill> [--local|--global] [--dry-run]
agent-skills run <skill> <skill-bin> [args...]
agent-skills validate [--skill <skill>] [--local|--global]
agent-skills update <skill> [--local|--global] [--dry-run]
agent-skills uninstall <skill> [--local|--global] [--dry-run]
agent-skills prune [--local|--global] [--dry-run]
agent-skills reset <skill> [--local|--global] [--dry-run]
agent-skills clean [--local|--global] [--dry-run]
agent-skills purge <skill> [--local|--global] [--dry-run]
```

All mutating commands support `--dry-run`.

## Command behavior summary

- `install`: copy/sync skill into canonical `.agents` paths, export bin symlinks, provision runtime.
- `run`: execute a skill-exported command.
- `validate`: read-only checks for links, required files, runtime readiness, and config warnings.
- `update`: refresh from source and re-run provisioning.
- `uninstall`: remove installed skill, exported bins, and compatibility exports.
- `prune`: remove dangling symlinks/compat exports.
- `reset`: rebuild symlinks/runtime from installed manifest.
- `clean`: remove stale tool-owned residue and dead links.
- `purge`: uninstall plus explicitly declared external cleanup.

## Client compatibility

- Gemini CLI supports `.agents/skills` aliases, so separate export is not required by default.
- Claude Code compatibility export is enabled by default.
