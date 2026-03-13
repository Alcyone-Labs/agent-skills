---
name: skill-forge
description: Builds precise production-ready custom Agent Skills following AgentSkills.io guidelines. Use when user requests to create, refine or package Skills
references:
  - core-structure
  - build-patterns
---

# SkillForge

Expert Agent Skills architect. Build portable, self-contained skills around the canonical `agent-skills` install model first. Agent-specific adapters are optional compatibility exports, not the primary packaging strategy.

## When to Apply

- User asks to create, refine, or package a skill.
- User asks to turn current session knowledge into a reusable skill.
- User asks to modernize existing skills to portable `.agents` + `bin/` + manifest model.

## Non-Negotiable Rules

- Target source directory defaults to `./skills/`.
- Additive behavior: never overwrite unrelated skills.
- Canonical installs land under `.agents`:
  - Local skills: `./.agents/skills/<skill>`
  - Local bins: `./.agents/bin/<command>`
  - Global skills: `~/.agents/skills/<skill>`
  - Global bins: `~/.agents/bin/<command>`
- Start from the smallest truthful package shape:
  - Docs-only skill: `SKILL.md`, optional `README.md`, optional `references/**`
  - Command skill: add `bin/<command>` and `agent-skills.json` when manifest metadata is needed
  - Runtime/binary skill: add `scripts/` and `runtime/` owned by the skill itself
- `SKILL.md` is required; `README.md` and `references/` are strongly recommended when they improve usability.
- `agent-skills.json` is recommended when you need explicit `exportedCommands`, runtime provisioning, validation, purge metadata, or compatibility settings. It is not required for a docs-only skill, and command exports can be inferred from `bin/`.
- `bin/` is the canonical command surface.
- `commands/` is optional compatibility only (`opencode`, `gemini`, `droid`, etc.), not required for installability.
- Per-skill `install.sh` is optional. If present, it must be a thin wrapper delegating to `agent-skills install <skill>`.
- Use relative path resolution from skill root. No hardcoded absolute repository paths.
- Keep runtime ownership self-contained under the installed skill directory when possible.
- Provision third-party binaries and dependencies inside the skill directory (for example `runtime/browser/...`, `node_modules/...`) and declare them in manifest `runtime.requiredPaths` / `validate.requiredPaths` as needed.
- `SKILL.md` frontmatter must stay valid YAML and include `name` and `description`; include `references` when reference docs exist.

## Workflow

1. Clarify scope (skill name, intended commands, runtime needs).
2. Research APIs and verify examples against official docs.
3. Choose the truthful package shape: docs-only, command-bearing, or runtime/binary-bearing.
4. Define `agent-skills.json` only when the skill needs explicit installer metadata.
5. Build command surface in `bin/`; keep internal logic in `scripts/`.
6. Add/refresh `README.md` and focused `references/` docs.
7. Add optional `commands/` adapters only when a target client actually needs them.
8. Add `install.sh` only when a thin compatibility wrapper improves repo-local workflows.

## Output Expectations

- Every command referenced in `SKILL.md` exists in `bin/`.
- `agent-skills.json`, when present, truthfully describes exports/runtime/validation/purge behavior.
- Runtime/binary assets stay owned by the installed skill directory and are reproducible via `agent-skills install/update/reset`.
- No scripts install commands into ad-hoc locations such as `~/.local/bin`, agent-specific skill folders, or hand-managed subtrees.
- Compatibility adapters do not become the primary interface.
