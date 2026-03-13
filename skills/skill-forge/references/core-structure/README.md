# Core Structure

## Canonical Skill Layout

```
skills/
└── {skill-name}/
    ├── SKILL.md
    ├── agent-skills.json
    ├── bin/
    │   └── {exported-command}
    ├── scripts/                # optional internal helpers
    ├── references/
    │   └── {topic}/...
    ├── README.md
    ├── install.sh              # thin wrapper -> agent-skills install {skill-name}
    └── commands/               # optional compatibility adapters only
        ├── opencode/{skill-name}.md
        ├── gemini/{skill-name}.toml
        └── droid/{skill-name}.md
```

## `agent-skills.json`

Minimal installer/runtime contract:

```json
{
  "schemaVersion": 1,
  "exportedCommands": ["command-a", "command-b"],
  "runtime": {
    "strategy": "none"
  },
  "compatibility": {
    "clients": ["Claude"],
    "symlink": true
  },
  "validate": {
    "requiredPaths": ["bin/command-a"],
    "configChecks": [
      {
        "id": "api-key",
        "description": "API key configured",
        "kind": "env",
        "value": "MY_API_KEY",
        "severity": "warning"
      }
    ]
  },
  "purge": {
    "externalPaths": []
  }
}
```

## Design Rules

- `bin/` is canonical command surface.
- `commands/` files are optional adapters for clients that use slash/command files.
- Scripts must resolve resources relative to skill root.
- Runtime artifacts should be contained in the installed skill directory whenever practical.
