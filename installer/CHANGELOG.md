# Changelog

All notable changes to `@alcyone-labs/agent-skills` are documented in this file.

## 2.1.0 - 2026-03-13

Compared with 2.0.0, this release turns the installer into a broader source-skill discovery, ephemeral execution, and MCP integration CLI.

### Added

Discovery and search
- `agent-skills list` to enumerate source skills from packaged metadata, including `SKILL.md` descriptions.
- `agent-skills find` to rank the most relevant 1-5 source skills for a free-text request.
- a committed generated source-skill catalog shipped with the package so metadata-only commands work outside the source repo.
- BM25-based ranking over skill name, exported commands, description, and generated searchable guide text.

Execution and lifecycle
- `agent-skills use <skill> <command> [args...]` for ephemeral source-skill execution without creating persistent `.agents` install state.
- positional CLI normalization for `install`, `find`, `use`, `run`, and related lifecycle commands so common invocations like `install foo` and `use skill cmd args...` work naturally.
- focused tests for packaged catalog behavior, BM25 relevance, ephemeral execution, policy enforcement, and CLI help behavior.

MCP support
- MCP tool support for `find`, `use`, and `install` via `@alcyone-labs/arg-parser-mcp`.
- `agent-skills print-mcp-config` to emit a JSON-only MCP config snippet suitable for direct inclusion in client config.
- repeated `--allow-skill` and `--deny-skill` flags for MCP skill access control.

### Changed

CLI behavior
- top-level and command-specific help are now ArgParser-owned instead of hand-written help handling.
- installer CLI rendering now uses the ArgParser handler logger rather than direct `console.*` writes in shared output paths.
- `print-mcp-config` remains a pure-stdout JSON contract while other CLI output uses logger-driven rendering.
- `run` keeps installed/runnable execution semantics; ephemeral source execution now lives under `use`.
- `list` and `find` render more readable CLI output with colorized names and ranked `Why:` explanations when terminal colors are enabled.

Metadata resolution
- `list` and `find` no longer need to clone GitHub just to inspect source-skill metadata.
- packaged source metadata now includes descriptions, exported command names, and generated searchable guide text.
- MCP `find` uses the same packaged catalog and ranking behavior as the CLI.

Build and packaging
- `build` and `typecheck` now regenerate the packaged source-skill index before compiling, reducing drift between the repo skills and published metadata.
- the published package continues to ship `dist/**/*`, `README.md`, and `CHANGELOG.md`, with the generated source catalog compiled into the installer output.
- the published installer now depends on ArgParser v3 and the MCP plugin package.

### Policy behavior
- MCP deny entries take precedence over allow entries.
- MCP `find` only returns allowed skills.
- MCP `install` and `use` reject denied or out-of-scope skills.