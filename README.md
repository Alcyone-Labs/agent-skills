# Agent Skills

A curated collection of AI agent skills for professional software development. Each skill provides specialized expertise, workflows, and best practices for specific domains.

## Available Skills

| Skill | Description | Platforms |
|-------|-------------|-----------|
| **aquaria-cloudflare-ops** | Operate and debug Aquaria Cloudflare Worker + Workflows deployment. Deploy safely, run health checks, inspect traces, restart stuck instances, apply fixes | OpenCode |
| **aquaria-docs** | Expert Aquaria documentation architect. Enforce documentation principles, golden rules, templates, folder structure, and quality gates. Creates compliant docs from templates, validates against Golden Rules checklist | OpenCode |
| **arg-parser** | Type-safe CLI argument parser with MCP integration, Zod validation, auto-generated tools, and interactive prompts | OpenCode, Gemini CLI |
| **chrome-extension-architect** | Privacy-first Chrome Manifest V3 extension architect. SidePanel design, MV3 service worker lifecycle, least-privilege permission audits, storage strategy, cross-browser sidebar patterns | OpenCode, Gemini CLI, FactoryAI Droid |
| **git-commit-writer** | Write consistent, high-quality Git commits following project conventions. Analyzes staged changes, classifies commit type, generates conventional commit messages | OpenCode |
| **large-file-refactorer** | Scan codebase for large files and orchestrate refactoring workflows using a test-first protocol | OpenCode, Gemini CLI |
| **simple-logger-usage** | Best practices for using simple-logger in TypeScript applications. Structured logging with metadata separation, scoped loggers, Chrome MV3 service worker support | OpenCode |
| **skill-forge** | Build precise production-ready custom Agent Skills following AgentSkills.io guidelines | OpenCode |
| **sauve-jazz-extension** | Complete Jazz extension development guidance. Architecture patterns, collections system, labels management, sync patterns, testing, troubleshooting | OpenCode |

## Quick Start

### One-Line Installation (Recommended)

The fastest way to get started - no cloning required:

```bash
# Using npx (npm)
npx @alcyone-labs/agent-skills

# Using pnpx (pnpm)
pnpx @alcyone-labs/agent-skills

# Using bunx (bun)
bunx @alcyone-labs/agent-skills
```

This interactive installer will guide you through:
1. **Installation Scope** - Choose global (~/user space) or local (./project)
2. **Target Platforms** - Select which agents to install to (Agents pre-selected by default)
3. **Skills Selection** - Pick which skills to install from the available collection
4. **Command Installation** - Optionally install commands for supported platforms (default: no)
5. **Gitignore Update** - Optionally add agent folders to .gitignore (default: no, local only)

### Clone and Install (Development)

For development or to inspect the code before installing:

```bash
# Clone the repository
git clone https://github.com/Alcyone-Labs/agent-skills.git /tmp/agent-skills
cd /tmp/agent-skills

# Run the interactive TypeScript installer
./install-interactive.sh
```

### Bash Installer (Alternative)

For a lighter-weight interactive experience or non-interactive usage:

```bash
# Clone the repository
git clone https://github.com/Alcyone-Labs/agent-skills.git /tmp/agent-skills

# Run the bash installer interactively
/tmp/agent-skills/install.sh --self
```

### Quick Installation (Non-Interactive)

If you know exactly what you want, install directly without cloning:

```bash
# Install specific skills to OpenCode
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode --skill chrome-extension-architect --skill git-commit-writer

# Install all skills to multiple platforms
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode --gemini --all-skills
```

#### Local Installation

Installs skills to your current project directory:

```bash
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local --opencode
```

#### Selective Installation

Install only specific skills to specific platforms:

```bash
# Install only chrome-extension-architect to OpenCode
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode --skill chrome-extension-architect

# Install multiple skills to multiple platforms
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode --gemini --skill chrome-extension-architect --skill arg-parser

# Install all skills to all platforms
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --opencode --gemini --claude --droid --agents --antigravity --all-skills
```

#### Clone and Install (for development)

If you want to inspect the code before installing:

```bash
# Clone the repository
git clone https://github.com/Alcyone-Labs/agent-skills.git /tmp/agent-skills
cd /tmp/agent-skills

# Install from the cloned repository
./install.sh --self --global --opencode

# Or install specific skills
./install.sh --self --global --opencode --skill chrome-extension-architect
```

### Available Skills

| Skill | Description |
|-------|-------------|
| `aquaria-cloudflare-ops` | Operate and debug Aquaria Cloudflare Worker + Workflows deployment |
| `aquaria-docs` | Expert Aquaria documentation architect with templates and quality gates |
| `arg-parser` | Type-safe CLI argument parser with MCP integration and interactive prompts |
| `chrome-extension-architect` | Privacy-first Chrome Manifest V3 extension architect |
| `git-commit-writer` | Write consistent, high-quality Git commits following project conventions |
| `large-file-refactorer` | Scan codebase for large files and orchestrate refactoring workflows |
| `simple-logger-usage` | Best practices for structured logging in TypeScript applications |
| `skill-forge` | Build production-ready custom Agent Skills following AgentSkills.io guidelines |
| `sauve-jazz-extension` | Complete Jazz extension development with architecture and patterns |

**Tip:** Use `--skill <name>` to install specific skills, or `--all` to install everything.

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

## CLI Reference

The installer supports various flags for non-interactive or scripted usage:

### Installation Scope

| Flag | Description |
|------|-------------|
| `--global`, `-g` | Install globally to user space (`~/`) |
| `--local`, `-l` | Install locally to current project (`./`) |

### Platform Selection

| Flag | Description |
|------|-------------|
| `--opencode` | Install for OpenCode |
| `--gemini` | Install for Gemini CLI |
| `--claude` | Install for Claude |
| `--droid` | Install for FactoryAI Droid |
| `--agents` | Install for Agents |
| `--antigravity` | Install for Antigravity |

### Skill Selection

| Flag | Description |
|------|-------------|
| `--all`, `-a` | Install all available skills |
| `--skills <name>` | Install specific skill (can be used multiple times) |

### Options

| Flag | Description |
|------|-------------|
| `--commands` | Install slash commands for supported agents |
| `--no-commands` | Skip installing commands |
| `--gitignore` | Add agent folders to `.gitignore` |
| `--no-gitignore` | Skip adding to `.gitignore` |
| `--interactive`, `-i` | Force interactive mode with prompts |
| `--help`, `-h` | Show help message with all available options |

### Examples

```bash
# Install all skills globally for OpenCode (non-interactive)
npx @alcyone-labs/agent-skills --global --opencode --all

# Install specific skills locally with commands
npx @alcyone-labs/agent-skills --local --opencode --skills chrome-extension-architect --skills git-commit-writer --commands

# Install to multiple platforms without gitignore updates
pnpx @alcyone-labs/agent-skills --global --opencode --gemini --all --no-gitignore

# View all available options
npx @alcyone-labs/agent-skills --help
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
# Test interactive TypeScript installer
./install-interactive.sh

# Test bash installer
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
