# Git Commit Style Guide

## Core Principles

### 1. Atomic Commits

Each commit should represent a single logical change. If you need to use "and" in the subject, split the commit.

**Bad:**

```
feat: add login and fix navigation bug
```

**Good:**

```
feat: add user authentication
fix: correct navigation active state
```

### 2. Imperative Mood

Write as if commanding the codebase to change.

**Bad:**

```
Added feature
Fixes bug
Updated styles
```

**Good:**

```
Add feature
Fix bug
Update styles
```

### 3. Context Over Generic

Include the affected domain/package when helpful.

**Generic:**

```
feat: add search
```

**Contextual:**

```
feat(bookmarks): add fuzzy search with Fuse.js
```

## Format Specifications

### Subject Line Structure

```
<type>[(scope)]: <description>

[optional body]

[optional footer(s)]
```

### Length Rules

| Part               | Max Length | Notes                |
| ------------------ | ---------- | -------------------- |
| Subject            | 50 chars   | Hard limit           |
| Subject (extended) | 72 chars   | For complex scopes   |
| Body lines         | 72 chars   | Wrap manually        |
| Total body         | 300 chars  | Before using bullets |

### Capitalization

- Subject: Capitalize first word only
- Body: Capitalize first word of each paragraph
- Bullet points: Capitalize first word

**Correct:**

```
feat: add support for WebSocket connections

Implement real-time sync using WebSocket protocol.
Connection handles reconnection with exponential backoff.
```

### Punctuation

- **Subject**: NO trailing period
- **Body**: Use periods for complete sentences
- **Bullets**: No periods for fragments, periods for sentences

**Bad:**

```
feat: add new feature.
```

**Good:**

```
feat: add new feature
```

## Type Selection Decision Tree

```
What is the primary purpose?
├── New functionality
│   ├── User-facing → feat:
│   └── Internal API → feat:
├── Fix broken code → fix:
├── Restructure code
│   ├── Behavior changes → feat: or fix:
│   ├── No behavior change → refactor:
│   └── Performance only → perf:
├── Documentation
│   ├── Code comments → style: or refactor:
│   ├── README/API docs → docs:
│   └── Comments explaining why → refactor:
├── Formatting
│   ├── Lint fixes → style:
│   └── Auto-formatter → style:
├── Tests
│   ├── New tests → test:
│   └── Fixing tests → fix: or test:
└── Build/Dependencies
    ├── Package updates → chore:
    ├── Build config → chore:
    └── CI/CD → chore:
```

## Special Cases

### Breaking Changes

For breaking changes, add `!` after type/scope and explain in body:

```
feat!: drop support for Node 14

BREAKING CHANGE: Minimum Node version is now 16.
Update your environment before upgrading.
```

### Work-in-Progress

NEVER commit with WIP markers. Use `git stash` or feature branches.

**Forbidden:**

```
WIP: working on login
TODO: finish implementation
```

### Merge Commits

Avoid merge commits in feature branches. Use rebase or squash.

If merge is necessary:

```
Merge branch 'feature/x' into main

Integrates user profile improvements including
avatar upload and bio editing.
```

## Codebase-Specific Conventions

### This Project's Patterns

Based on commit history analysis:

1. **Use prefixes consistently**: `feat:`, `fix:`, `refactor:`, `docs:`
2. **Include version for schema changes**: `(v12)`, `(v13)`
3. **Reference phases for large refactors**: `Phase 1:`, `Phase 2:`
4. **List multiple changes with bullets** for complex commits
5. **Mention specific technologies** when relevant: Jazz, Preact, Aquaria

### Common Patterns Found

```
feat: add [feature] with [technology]
fix: [issue] in [component]
refactor: breakdown [module] into [structure]
docs: add [topic] documentation
style: update [element] per [standard]
chore: migrate from [old] to [new]
```
