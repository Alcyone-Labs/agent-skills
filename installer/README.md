# @alcyone-labs/agent-skills

Interactive installer for Agent Skills from Alcyone Labs. Install AI agent skills for various platforms including OpenCode, Gemini CLI, Claude, FactoryAI Droid, Agents, and Antigravity.

## Installation

No installation required! Use directly with npx:

```bash
npx @alcyone-labs/agent-skills
```

## Usage

The installer runs in **interactive mode by default**, guiding you through all configuration options. Use flags to pre-configure values and skip specific prompts.

### Interactive Mode (Default)

Run without arguments for full interactive mode:

```bash
npx @alcyone-labs/agent-skills
```

This will guide you through:
1. Selecting installation scope (global or local)
2. Choosing target agents/platforms
3. Selecting skills to install
4. Optional command installation
5. Optional .gitignore updates

### Pre-Configured Interactive Mode

Set some values via flags, get prompted for the rest:

```bash
# Pre-set global scope, get prompted for agents and skills
npx @alcyone-labs/agent-skills --global

# Pre-set agents, get prompted for scope and skills
npx @alcyone-labs/agent-skills --opencode --gemini

# Pre-set scope and agents, get prompted for skills
npx @alcyone-labs/agent-skills --global --gemini --droid
```

### Non-Interactive Mode

Provide all required flags for fully automated installation:

```bash
# Install all skills globally for multiple agents (no prompts)
npx @alcyone-labs/agent-skills --global --all --gemini --droid --agents

# Install locally for specific agents with commands
npx @alcyone-labs/agent-skills --local --all --opencode --commands

# Complete automation example
npx @alcyone-labs/agent-skills --global --all --opencode --gemini --claude --droid --agents --antigravity --no-commands --no-gitignore
```

## CLI Options

### Scope Flags
- `--global`, `-g` - Install globally (user space ~/)
- `--local`, `-l` - Install locally (project ./)

### Agent Flags
- `--opencode` - Install for OpenCode
- `--gemini` - Install for Gemini CLI
- `--claude` - Install for Claude
- `--droid` - Install for FactoryAI Droid
- `--agents` - Install for Agents (default)
- `--antigravity` - Install for Antigravity

### Skill Selection
- `--all`, `-a` - Install all available skills

### Command Installation
- `--commands` - Install commands for supported agents
- `--no-commands` - Skip installing commands

### Gitignore
- `--gitignore` - Add agent folders to .gitignore
- `--no-gitignore` - Skip adding to .gitignore

## Examples

### Quick Start - Install Everything Globally

```bash
npx @alcyone-labs/agent-skills --global --all --opencode --gemini --claude --droid --agents --antigravity
```

### Development Setup - Local Install

```bash
# Install all skills locally for your project
npx @alcyone-labs/agent-skills --local --all --agents

# With gitignore update (recommended for local installs)
npx @alcyone-labs/agent-skills --local --all --agents --gitignore
```

### Selective Installation

```bash
# Install only specific skills to specific agents
npx @alcyone-labs/agent-skills --global --opencode --gemini --no-commands
```

### CI/CD Automation

```bash
# Non-interactive installation for CI/CD pipelines
npx @alcyone-labs/agent-skills --global --all --agents --no-commands --no-gitignore
```

### Partial Configuration

```bash
# Set scope, choose agents and skills interactively
npx @alcyone-labs/agent-skills --global

# Set agents, choose scope and skills interactively
npx @alcyone-labs/agent-skills --opencode --gemini
```

## How It Works

1. **Local Mode**: If running from a cloned repository, uses local skills
2. **Remote Mode**: Otherwise, fetches skills directly from GitHub
3. **Always Interactive**: Prompts run by default with `promptWhen: "always"`
4. **Flag Pre-configuration**: Use flags to skip prompts and pre-set values
5. **Smart Skipping**: Prompts automatically skip when values provided via flags

## Supported Platforms

| Platform | Global Path | Local Path |
|----------|-------------|------------|
| OpenCode | `~/.config/opencode/` | `./.opencode/` |
| Gemini CLI | `~/.gemini/` | `./.gemini/` |
| Claude | `~/.claude/` | `./.claude/` |
| FactoryAI Droid | `~/.factory/` | `./.factory/` |
| Agents | `~/.config/agents/` | `./.agents/` |
| Antigravity | `~/.antigravity/` | `./.antigravity/` |

## Requirements

- Node.js 18+ or Bun
- Git (for fetching from GitHub)

## License

MIT License - See repository for details.

## Contributing

Contributions welcome! Visit https://github.com/Alcyone-Labs/agent-skills
