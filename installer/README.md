# @alcyone-labs/agent-skills 2.1.0

Manifest-driven lifecycle CLI for Agent Skills.

See [`CHANGELOG.md`](./CHANGELOG.md) for the 2.1.0 release notes and differences from 2.0.0.

## What's new in 2.1.0 vs 2.0.0

2.1.0 expands the installer from install-only lifecycle management into a source-skill discovery and MCP-friendly workflow layer.

Highlights:
- `list` and `find` for source-skill discovery
- `use` for ephemeral source-skill execution without persistent `.agents` install state
- MCP tools for `find`, `use`, and `install`
- `print-mcp-config` for JSON-only MCP config generation
- repeated `--allow-skill` / `--deny-skill` policy flags for MCP restriction
- packaged generated source-skill catalog for metadata-only commands
- BM25-ranked search over shipped skill metadata
- command-specific auto-help via ArgParser
- logger-safe CLI output paths instead of direct `console.*` writes in the installer entrypoint
- improved CLI catalog rendering for `list` / `find` using colored output when the terminal supports it


## Canonical install model

- Global skills: `~/.agents/skills/<skill>`
- Global bins: `~/.agents/bin/<command>`
- Local skills: `./.agents/skills/<skill>`
- Local bins: `./.agents/bin/<command>`

Compatibility exports are derived from canonical `.agents` installs (Claude enabled by default).

## Use without installing the package

### npm / npx

```bash
npx --yes @alcyone-labs/agent-skills --help
npx --yes @alcyone-labs/agent-skills list
npx --yes @alcyone-labs/agent-skills find "browser markdown extraction"
```

### pnpm / pnpx

```bash
pnpm dlx @alcyone-labs/agent-skills --help
pnpx @alcyone-labs/agent-skills install lightpanda --local --dry-run
```

## Install globally

### npm

```bash
npm install -g @alcyone-labs/agent-skills
agent-skills --help
```

### pnpm

```bash
pnpm add -g @alcyone-labs/agent-skills
agent-skills --help
```

## Command surface

Use `agent-skills --help` for top-level help and `agent-skills <command> --help` for command-specific help.

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

All mutating commands honor `--dry-run`.

## Discover source skills

List every source skill with its description from the packaged source catalog index (no GitHub clone or local source checkout required):

```bash
agent-skills list
```

Find the most relevant 1-5 skills for a request using BM25 over the shipped skill catalog metadata:

```bash
agent-skills find "chrome extension mv3 service worker auth"
agent-skills find "browser markdown extraction" --limit 3
agent-skills find "jazz service worker" --limit 5
```

`list` and `find` are metadata-only commands. `install` and `use` still resolve real source skill contents on demand from the local repo or remote source when needed.

## Run a skill without installing it

`use` stages the source skill in a temporary directory, provisions its runtime if needed, runs the requested command, and removes the temporary copy afterwards.

```bash
agent-skills use lightpanda lightpanda-fetch https://example.com
```

`run` keeps its existing meaning: execute a runnable command from source or installed skill precedence.

```bash
agent-skills run lightpanda lightpanda-fetch https://example.com
```

## MCP support

The CLI exposes these MCP tools:

- `find`
- `use`
- `install`

Start the MCP server directly:

```bash
npx --yes @alcyone-labs/agent-skills --s-mcp-serve
```

Restrict the server to an allow-list and/or deny-list of skills:

```bash
npx --yes @alcyone-labs/agent-skills --s-mcp-serve \
  --allow-skill lightpanda \
  --allow-skill skill-forge \
  --deny-skill exa-search
```

Policy rules:

- default: all skills are allowed
- deny-list wins over allow-list
- `find` only returns allowed skills
- `install` and `use` reject denied or out-of-scope skills

## Generate MCP config JSON

`print-mcp-config` writes pure JSON to stdout with no headings or extra log output.

Default config:

```bash
agent-skills print-mcp-config
```

Restricted config:

```bash
agent-skills print-mcp-config \
  --allow-skill lightpanda \
  --allow-skill skill-forge \
  --deny-skill exa-search
```

Example output:

```json
{
  "mcpServers": {
    "agent-skills": {
      "command": "npx",
      "args": [
        "--yes",
        "@alcyone-labs/agent-skills",
        "--s-mcp-serve",
        "--allow-skill",
        "lightpanda",
        "--deny-skill",
        "exa-search"
      ]
    }
  }
}
```

## Development notes

`npm run build` regenerates `src/core/source-skill-index.generated.ts` before compiling TypeScript.
`npm run typecheck` also regenerates the source-skill index first, so stale packaged metadata does not drift from the repo skill set.

Relevant scripts:
- `npm run generate:source-skill-index` — regenerate the packaged source catalog only
- `npm run build` — regenerate the source catalog, then run `tsc`
- `npm run typecheck` — regenerate the source catalog, then run `tsc --noEmit`


## Publish checklist

1. `npm test`
2. `npm pack --dry-run`
3. `npm publish --access public` (or with dist-tag as needed)

Reference docs:
- npm publish: https://docs.npmjs.com/cli/v10/commands/npm-publish
- npm exec/npx semantics: https://docs.npmjs.com/cli/v10/commands/npm-exec
- pnpm dlx (`pnpx` alias): https://pnpm.io/cli/dlx
- pnpm global add: https://pnpm.io/cli/add
