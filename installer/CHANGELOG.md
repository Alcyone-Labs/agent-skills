# Changelog

All notable changes to `@alcyone-labs/agent-skills` are documented in this file.

## 2.1.0 - 2026-03-13

Compared with 2.0.0, this release adds source-skill discovery workflows, ephemeral execution, and MCP support.

### Added
- `agent-skills list` to enumerate all source skills with descriptions parsed from each skill's `SKILL.md` frontmatter.
- `agent-skills find` to rank the most relevant 1-5 source skills for a free-text request using deterministic lexical matching.
- `agent-skills use <skill> <command> [args...]` to stage a source skill in a temporary directory, provision its runtime if needed, execute it, and clean up afterwards without creating persistent `.agents` state.
- MCP tool support for `find`, `use`, and `install` via `@alcyone-labs/arg-parser-mcp`.
- `agent-skills print-mcp-config` to emit a JSON-only MCP config snippet suitable for direct use in `config.json`.
- MCP skill access controls with repeated `--allow-skill` and `--deny-skill` flags.
- Focused test coverage for catalog search, MCP config generation, ephemeral execution, CLI help, CLI list/find/use flows, and MCP policy enforcement.

### Changed
- Top-level CLI help now comes from ArgParser auto-help instead of a hand-written `help` switch.
- The published installer now depends on ArgParser v3 and the MCP plugin package.
- `run` keeps its installed/runnable execution semantics; ephemeral source execution is now represented explicitly by `use`.
- Source-skill metadata now includes descriptions, which powers both listing and ranked search.
- `print-mcp-config` and MCP tool handlers share policy-aware helper logic instead of duplicating CLI-only behavior.

### Policy behavior
- MCP `deny` entries take precedence over `allow` entries.
- MCP `find` only returns allowed skills.
- MCP `install` and `use` reject denied or out-of-scope skills.

### Packaging
- The published package now includes this changelog alongside the README and built `dist/` output.
