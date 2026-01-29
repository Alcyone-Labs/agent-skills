# Core Structure

## Folder Layout

skill-forge/
├── skills/
│ └���─ {skill-name}/
│ ├── SKILL.md # CAPITALIZED manifest router
│ ├── README.md # Skill overview
│ └── references/ # {topic}/[README api config patterns gotchas].md
├── commands/
│   ├── opencode/
│   │   └── {skill-name}.md   # OpenCode slash command
│   └── gemini/
│       └── {skill-name}.toml # Gemini CLI command
└── install.sh # Global installer for all skills in this folder

## SKILL.md YAML

```
---
name: kebab-case
description: <=200 chars NO colons what-when
references:
  - core-structure
  - build-patterns
  - install-script
---
```

Body: When Apply | Rules | Workflow Tree | 2-3 Examples

## Command Format

### OpenCode

`commands/opencode/{skill-name}.md`

```
---
description: Load skill guide tasks
---

If $ARGUMENTS --update-skill: run install.sh --local/global; stop

skill({ name: '{skill-name}' })

Task type from $ARGUMENTS. Read relevant references/. Execute.
```

### Gemini CLI

`commands/gemini/{skill-name}.toml`

```toml
description = "Command description"

prompt = """
Instructions...

@{{{SKILL_PATH}}/{skill-name}/SKILL.md}
...
"""
```
