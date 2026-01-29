# Agent Skills

A curated collection of AI agent skills for professional software development. Each skill provides specialized expertise, workflows, and best practices for specific domains.

## Available Skills

| Skill | Description | Platforms |
|-------|-------------|-----------|
| **arg-parser** | Type-safe CLI argument parser with MCP integration, Zod validation, and auto-generated tools | OpenCode, Gemini CLI |
| **aquaria-cloudflare-ops** | Operate and debug Aquaria Cloudflare Worker + Workflows deployment | OpenCode |
| **chrome-extension-architect** | Privacy-first Chrome Manifest V3 extension architect | OpenCode, Gemini CLI, FactoryAI Droid |
| **git-commit-writer** | Write consistent, high-quality Git commits following project conventions | OpenCode |
| **large-file-refactorer** | Scan codebase for large files and orchestrate refactoring workflows using a test-first protocol | OpenCode, Gemini CLI |
| **skill-forge** | Build precise production-ready custom Agent Skills following AgentSkills.io guidelines | OpenCode |

## Quick Start

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash
```

This runs the installer in interactive mode, prompting you to select:
- Installation scope (global or local)
- Target platforms (OpenCode, Gemini CLI, Claude, FactoryAI Droid, Agents, Antigravity)
- Skills to install

### Installation Options

#### Global Installation (Recommended)

Installs skills to your user configuration directory:

```bash
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global
```

#### Local Installation

Installs skills to your current project directory:

```bash
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local
```

#### Selective Platform Installation

Install only for specific platforms:

```bash
# OpenCode only
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode

# Multiple platforms
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode --gemini

# All platforms
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode --gemini --claude --droid --agents --antigravity
```

### Local Development Installation

If you've cloned this repository and want to install from the local files:

```bash
./install.sh --self --global
```

## Updating Skills

To update skills to the latest version, simply re-run the installation command. The installer will overwrite existing skills with the latest versions.

```bash
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global
```

## Supported Platforms

| Platform | Global Path | Local Path |
|----------|-------------|------------|
| **OpenCode** | `~/.config/opencode/` | `./.opencode/` |
| **Gemini CLI** | `~/.gemini/` | `./.gemini/` |
| **Claude** | `~/.claude/` | `./.claude/` |
| **FactoryAI Droid** | `~/.factory/` | `./.factory/` |
| **Agents** | `~/.config/agents/` | `./.agents/` |
| **Antigravity** | `~/.antigravity/` | `./.antigravity/` |

## Usage Examples

### OpenCode

```bash
# Load a skill
/opencode chrome-extension-architect Build a side panel note-taker

# Use arg-parser skill
/opencode arg-parser Create a CLI tool with MCP support

# Refactor large files
/opencode large-file-refactorer Find files over 500 lines
```

### Gemini CLI

```bash
# Use chrome extension skill
/skill chrome-extension-architect Debug my extension permissions

# Use large file refactorer
/skill large-file-refactorer Refactor src/components/
```

### FactoryAI Droid

```bash
# Use chrome extension skill
/skill chrome-extension-architect Make my extension work in Firefox
```

## Skill Structure

Each skill follows a standardized structure:

```
skills/<skill-name>/
├── SKILL.md                    # Main skill manifest with rules and workflows
├── README.md                   # Skill-specific documentation
├── commands/                   # Platform-specific command definitions
│   ├── opencode/<skill>.md    # OpenCode slash command
│   ├── gemini/<skill>.toml    # Gemini CLI command
│   └── droid/<skill>.md       # FactoryAI Droid command
└── references/                 # Reference documentation
    └── <topic>/
        └── README.md
```

## Development

### Adding a New Skill

1. Create a new directory under `skills/<skill-name>/`
2. Add `SKILL.md` with the skill manifest
3. Add `README.md` with usage documentation
4. Add platform-specific commands in `commands/`
5. Add reference documentation in `references/`

### Testing Installation Locally

```bash
# Test local installation
./install.sh --self --local

# Test with specific platforms
./install.sh --self --global --opencode
```

## Repository Structure

```
agent-skills/
├── install.sh              # Main installation script
├── skills/                 # All available skills
│   ├── arg-parser/
│   ├── aquaria-cloudflare-ops/
│   ├── chrome-extension-architect/
│   ├── git-commit-writer/
│   ├── large-file-refactorer/
│   └── skill-forge/
├── commands/              # Platform-specific command definitions
│   ├── opencode/          # OpenCode slash commands
│   ├── gemini/            # Gemini CLI custom commands
│   └── droid/             # FactoryAI Droid commands
└── tests/                 # Test suite
```

## Contributing

Contributions are welcome! Please ensure:

1. Skills follow the established structure
2. Documentation is clear and concise
3. Commands work across all supported platforms
4. Skills are privacy-conscious and secure by default

## License

MIT License - See individual skill directories for specific licensing details.

## Resources

### Documentation

- [AgentSkills.io](https://agentskills.io) - Skill development guidelines
- [OpenCode Documentation](https://opencode.ai)
- [Gemini CLI Documentation](https://ai.google.dev/gemini-api/docs)

### Platform-Specific Command Documentation

- [OpenCode Commands](https://opencode.ai/docs/commands) - Slash commands and skill loading
- [Gemini CLI Custom Commands](https://geminicli.com/docs/cli/custom-commands/) - Creating and using custom commands with `{{args}}` injection
- [FactoryAI Droid Documentation](https://docs.factory.ai/droid) - Droid commands and skill system

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
