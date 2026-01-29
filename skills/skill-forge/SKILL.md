---
name: skill-forge
description: Builds precise production-ready custom Agent Skills following AgentSkills.io guidelines. Use when user requests to create, refine or package Skills
references:
  - core-structure
  - build-patterns
  - install-script
---

# SkillForge

Expert AgentSkills.io architect. ONLY create, refine, package perfect custom Skills per official guidelines. Capture elite knowledge in references/.

## When to Apply

- User: "build a skill for X" "create skill about Y" "distill current session into a skill" "turn agent into skill" "package as skill"
- Extract nuanced facts/patterns too dense for single manifest

## Non-Negotiable, Golden Rules

- Target directory: `./skills/` by default.
- Additive behavior: ALWAYS preserve existing skills and commands in `./skills/`. DO NOT overwrite other skills.
- Structure:
  - `skills/skill-forge/SKILL.md` (CAPITALIZED)
  - `skills/skill-forge/README.md`
  - `skills/skill-forge/commands/opencode/skill-forge.md`
  - `skills/skill-forge/commands/gemini/skill-forge.toml`
  - `skills/skill-forge/commands/droid/skill-forge.md`
  - `skills/skill-forge/install.sh` (Single root installer for ALL skills)
- Folder: kebab-case.
- SKILL.md YAML first: name, description, references[].
- NO lowercase skill.md, NO colons in description.
- references/ MANDATORY: README.md, api.md, configuration.md, patterns.md, gotchas.md per topic.
- commands/
  - opencode/{skill-name}.md (OpenCode slash command)
  - gemini/{skill-name}.toml (Gemini CLI command)
  - droid/{skill-name}.md (FactoryAI Droid command)
- install.sh MUST be a copy of `references/install-script/template.sh`. ONLY update the `REPO_URL` constant.
- Supports `--self`, `--global`/`--local`.
- Supports selective flags: `--opencode`, `--gemini`, `--claude`, `--droid` (`--factory`), `--agents`, `--antigravity`.
- Defaults to interactive mode if no flags are provided.
- Interactive mode prompts for scope (Global/Local), agent selection (toggle menu), and skill selection (toggle menu).
- Automatically scans `skill/` directory for available skills.
- Uses dynamic `PROJECT_NAME` based on directory if not set.
- Interactive mode prompts to update `.gitignore` for local installs.
- Verbatim APIs/configs from docs.
- Examples: 2-3 input/output clusters.
- Max info density: bullets > paragraphs, sacrifice grammar for facts.

## Workflow Decision Tree

```
Request: create or refine skill for [topic]
A. Clarify scope
   - skill name, repo URL, target platforms
   - check if ./skill-forge exists; prepare for additive update
B. Research
   - APIs, configs, lifecycle, known issues
C. Design
   - description (<=200 chars, no colons)
   - references/{topic} layout
D. Write references/ under skill-forge/skill/{skill-name}/
   - README.md: overview, when to use, decision tree
   - api.md: verbatim signatures/types
   - configuration.md: schemas/keys/wiring
   - patterns.md: multi-step implementations
   - gotchas.md: pitfalls/limitations
E. Assemble under ./skills/
   - {skill-name}/SKILL.md: YAML + rules + workflow + examples
   - {skill-name}/README.md: High-level overview
  - commands/opencode/{skill-name}.md: OpenCode command template
  - commands/gemini/{skill-name}.toml: Gemini CLI command template
  - commands/droid/{skill-name}.md: FactoryAI Droid command template
   - install.sh: Multi-Skill Installer Pattern (Update or create at root)
Result: Updated ./skills/ tree with new skill/command added
```

## References

- **references/core-structure/README.md**: Folder layout, SKILL.md YAML schema, command format. Provides the skeleton every skill must follow. Check before creating new skills.
- **references/build-patterns/README.md**: When to split references/, 5-file topic set, A-E workflow, best practices. Prevents bloated SKILL.md and ensures consistent structure.
- **references/install-script/template.sh**: Multi-Skill Installer Template. Supports interactive mode, selective agent targeting, and gitignore updates. MUST use as base for all generated `install.sh` files (update `REPO_URL`).

## Examples

**Input:** Build skill for Chrome MV3 extensions  
**Output:** skill/chrome-mv3/

- SKILL.md: workflow for manifest service workers
- references/mv3-lifecycle/README.md: decision tree
- references/mv3-lifecycle/api.md: chrome.runtime.onInstalled etc
- references/persistent-storage/gotchas.md: no persistent globals

**Input:** Package TypeScript skill with install  
**Output:** Generated install.sh using the Multi-Skill Installer Template from references/install-script/template.sh. Supports `--self`, `--global`, `--local`, and selective flags like `--claude`.

**Input:** Refine existing agent md to skill  
**Output:** Parse, extract to structured refs, command, install
