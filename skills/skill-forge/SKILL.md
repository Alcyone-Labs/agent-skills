---
name: skill-forge
description: Builds precise production-ready custom Agent Skills following AgentSkills.io guidelines. Use when user requests to create, refine or package Skills
references:
  - core-structure
  - build-patterns
  - install-script
---

# SkillForge

Expert Agent Skills architect. Build portable, self-contained skills with open-standard layout first. Agent-specific adapters are optional compatibility layers.

## When to Apply

- User asks to create, refine, or package a skill.
- User asks to turn current session knowledge into a reusable skill.
- User asks to modernize existing skills to portable `bin/` + manifest model.

## Non-Negotiable Rules

- Target directory defaults to `./skills/`.
- Additive behavior: never overwrite unrelated skills.
- Canonical skill package shape:
  - `skills/<skill>/SKILL.md`
  - `skills/<skill>/agent-skills.json`
  - `skills/<skill>/bin/<command>` (user-facing commands)
  - `skills/<skill>/scripts/*` (internal helpers, optional)
  - `skills/<skill>/README.md`
  - `skills/<skill>/references/**`
- `commands/` is optional compatibility only (`opencode`, `gemini`, `droid`), not required for installability.
- Per-skill `install.sh` MUST be thin wrapper delegating to `agent-skills install <skill>`.
- Use relative path resolution from skill root. No hardcoded absolute repository paths.
- Keep runtime ownership self-contained under installed skill directory when possible.
- `SKILL.md` frontmatter must stay valid YAML and include `name`, `description`, `references`.

## Workflow

1. Clarify scope (skill name, intended commands, runtime needs).
2. Research APIs and verify examples against official docs.
3. Define `agent-skills.json` (exported commands, runtime strategy, validate/purge metadata).
4. Build command surface in `bin/`; keep internal logic in `scripts/`.
5. Add/refresh `README.md` and focused `references/` docs.
6. Add optional `commands/` adapters only when target client needs them.
7. Add thin `install.sh` wrapper delegating to installer CLI.

## Output Expectations

- Every command referenced in `SKILL.md` exists in `bin/`.
- `agent-skills.json` truthfully describes command exports/runtime/validation.
- No global ad-hoc install locations in scripts (for example `~/.local/bin`).
- Compatibility adapters do not become the primary interface.
