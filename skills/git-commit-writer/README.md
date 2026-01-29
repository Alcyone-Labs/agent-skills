# Git Commit Writer

Write consistent, high-quality Git commit messages following conventional commits and project-specific conventions.

## Overview

This skill analyzes staged changes and generates commit messages that:

- Follow conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
- Respect project conventions from AGENTS.md and git history
- Include appropriate context based on affected files
- Use imperative mood and proper formatting

## Usage

### Basic Usage

```bash
# Stage your changes
git add .

# Generate commit message
/opencode git-commit-writer

# Use the generated message
git commit -m "<generated message>"
```

### How It Works

1. **Analyzes staged changes** - File count, domains affected, complexity
2. **Reads project conventions** - AGENTS.md, recent commit history
3. **Classifies change type** - Feature, fix, refactor, docs, etc.
4. **Generates appropriate message** - Subject + optional body

## Features

### Smart Type Detection

Automatically selects the right commit type:

- `feat:` - New capabilities
- `fix:` - Bug corrections
- `refactor:` - Code restructuring
- `docs:` - Documentation
- `style:` - Formatting
- `test:` - Test changes
- `chore:` - Build/tooling
- `perf:` - Performance
- `security:` - Security fixes

### Context-Aware

Analyzes file paths to understand:

- Affected domain (bookmarks, feeds, labels, etc.)
- Tech layer (schema, hooks, components)
- Change complexity

### Convention Following

Respects project-specific patterns:

- Version markers for schema changes (v10, v11)
- Phase markers for large refactors
- Scope usage based on project history

## Examples

### Simple Change

**Input:**

```
Files: src/utils/format.ts (1 file, 5 lines changed)
```

**Output:**

```
fix: handle null values in date formatter
```

### Complex Feature

**Input:**

```
Files: 8 files across bookmarks, feeds, search components
```

**Output:**

```
feat: add unified search across all content types

Implement "My Library" view with DSL-based filtering and
Fuse.js fuzzy search. Adds keyboard shortcuts for navigation.
```

### Refactor

**Input:**

```
Files: 6 files - inbox component split into pieces
```

**Output:**

```
refactor: breakdown inbox into separate components

- Extract header, item card, and list components
- Create useInbox hook for data management
- Move utilities to dedicated files
```

## Commit Message Format

```
<type>[(scope)]: <subject>

[body]

[footer]
```

### Rules

**Subject Line:**

- Maximum 50 characters
- Capitalize first word
- No trailing period
- Use imperative mood

**Body:**

- Wrap at 72 characters
- Explain what and why
- Use bullets for multiple changes

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `docs:` - Documentation
- `style:` - Formatting
- `test:` - Tests
- `chore:` - Build/tooling
- `perf:` - Performance
- `security:` - Security

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- Project AGENTS.md for specific conventions
