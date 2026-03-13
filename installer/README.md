# @alcyone-labs/agent-skills (v2)

Manifest-driven lifecycle CLI for Agent Skills.

## Canonical install model

- Global skills: `~/.agents/skills/<skill>`
- Global bins: `~/.agents/bin/<command>`
- Local skills: `./.agents/skills/<skill>`
- Local bins: `./.agents/bin/<command>`

Compatibility exports are derived from canonical `.agents` installs (Claude enabled by default).

## Use without installing

### npm / npx

```bash
npx --yes @alcyone-labs/agent-skills help
npx --yes @alcyone-labs/agent-skills install exa-search --local --dry-run
```

### pnpm / pnpx

```bash
pnpm dlx @alcyone-labs/agent-skills help
pnpx @alcyone-labs/agent-skills install lightpanda --local --dry-run
```

## Install globally

### npm

```bash
npm install -g @alcyone-labs/agent-skills
agent-skills help
```

### pnpm

```bash
pnpm add -g @alcyone-labs/agent-skills
agent-skills help
```

## Command surface

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

All mutating commands honor `--dry-run`.

## Publish checklist

1. `npm test`
2. `npm pack --dry-run`
3. `npm publish --access public` (or with dist-tag as needed)

Reference docs:
- npm publish: https://docs.npmjs.com/cli/v10/commands/npm-publish
- npm exec/npx semantics: https://docs.npmjs.com/cli/v10/commands/npm-exec
- pnpm dlx (`pnpx` alias): https://pnpm.io/cli/dlx
- pnpm global add: https://pnpm.io/cli/add
