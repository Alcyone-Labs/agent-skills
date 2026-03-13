# Core Structure

## Canonical Install Model

- Local skills: `./.agents/skills/<skill>`
- Local bins: `./.agents/bin/<command>`
- Global skills: `~/.agents/skills/<skill>`
- Global bins: `~/.agents/bin/<command>`
- Compatibility exports are derived from canonical installs; they are not separate install targets.

## Source Layout Variants

### Docs-only skill

```text
skills/
└── {skill-name}/
    ├── SKILL.md
    ├── README.md              # recommended when the skill benefits from quick install/scope docs
    └── references/            # optional deeper material
```

### Command skill

```text
skills/
└── {skill-name}/
    ├── SKILL.md
    ├── agent-skills.json      # recommended when explicit metadata is needed
    ├── bin/
    │   └── {exported-command}
    ├── scripts/                # optional internal helpers
    ├── references/
    │   └── {topic}/...
    ├── README.md
    ├── install.sh              # optional thin wrapper -> agent-skills install {skill-name}
    └── commands/               # optional compatibility adapters only
        ├── opencode/{skill-name}.md
        ├── gemini/{skill-name}.toml
        └── droid/{skill-name}.md
```

### Runtime / binary skill

```text
skills/
└── {skill-name}/
    ├── SKILL.md
    ├── agent-skills.json
    ├── bin/
    │   ├── {exported-command-a}
    │   └── {exported-command-b}
    ├── scripts/
    │   └── provision-runtime.sh
    ├── runtime/
    │   ├── browser/{binary-name}
    │   └── state/
    ├── README.md
    └── references/
```

## `agent-skills.json`

Use `agent-skills.json` when you need to describe exported commands explicitly, provision runtime dependencies, add validation checks, or declare purge behavior. If the file is absent, exported commands are inferred from `bin/` and runtime defaults to `none`.

Example installer/runtime contract for a binary-bearing skill:

```json
{
  "schemaVersion": 1,
  "exportedCommands": ["command-a", "command-b"],
  "runtime": {
    "strategy": "npm-in-skill",
    "installCommand": ["bash", "scripts/provision-runtime.sh"],
    "requiredPaths": [
      "runtime/browser/tool-binary",
      "node_modules/some-package/package.json"
    ]
  },
  "compatibility": {
    "clients": ["Claude"],
    "symlink": true
  },
  "validate": {
    "requiredPaths": ["bin/command-a", "runtime/state"],
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
- `agent-skills install|update|reset` is the canonical lifecycle entrypoint; `install.sh` is optional convenience only.
- Scripts must resolve resources relative to skill root.
- Runtime artifacts should be contained in the installed skill directory whenever practical.
- Provision binaries and package-manager installs inside the skill directory rather than shared/global locations.
- Prefer `runtime/` for owned stateful artifacts and keep `validate.requiredPaths` aligned with what install/update/reset actually produces.
