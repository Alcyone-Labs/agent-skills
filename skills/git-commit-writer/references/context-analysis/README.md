# Context Analysis for Commit Messages

## Pre-Commit Checklist

Before writing any commit message, analyze:

### 1. Project Conventions

**Check these files in order:**

1. `AGENTS.md` - Development guidelines
2. `README.md` - Project overview
3. `CONTRIBUTING.md` - Contribution guidelines
4. `package.json` - Project metadata

**Look for:**

- Commit message templates
- Branch naming conventions
- Preferred commit style
- Required scopes or prefixes

### 2. Recent Commit History

**Command:**

```bash
git log --oneline --no-decorate -20
```

**Analyze:**

- What types are most common? (feat:, fix:, refactor:)
- Are scopes used? (feat(api):)
- Average subject length?
- Body usage patterns?
- Special conventions? (v12, Phase 1:, etc.)

### 3. Staged Changes Analysis

**Command:**

```bash
git diff --staged --stat
git diff --staged --name-only
```

**Map to:**

- **Package/Namespace**: `packages/sauve-chrome-extension/src/popup`
- **Feature Domain**: bookmarks, feeds, labels, tabs, library, inbox
- **Tech Layer**: schema, hooks, components, utils, services
- **File Type**: .ts, .tsx, .css, .md, .json

### 4. Change Classification

**Single file, obvious change:**

- Subject only
- No body needed

**Multiple files, single purpose:**

- Subject + brief body
- Explain the "what"

**Complex refactor or feature:**

- Subject + detailed body
- Use bullet points for distinct changes
- Explain "what" and "why"

**Schema/Database migration:**

- Include version number
- Document breaking changes
- Explain migration strategy

## Decision Matrix

### Type Selection

| Change Characteristics            | Type        |
| --------------------------------- | ----------- |
| New capability or API             | `feat:`     |
| Bug correction                    | `fix:`      |
| Code restructuring, same behavior | `refactor:` |
| Performance optimization          | `perf:`     |
| Documentation only                | `docs:`     |
| Code formatting, whitespace       | `style:`    |
| Test addition/correction          | `test:`     |
| Build, deps, tooling              | `chore:`    |
| Security vulnerability            | `security:` |

### Scope Selection

**When to include scope:**

- Multiple domains in codebase
- Monorepo structure
- Team-specific conventions

**Common scopes for this project:**

```
feat(bookmarks): ...
feat(feeds): ...
fix(labels): ...
refactor(tabs): ...
docs(readme): ...
style(imports): ...
chore(deps): ...
```

### Body Decision

**Include body when:**

- > 3 files changed
- Breaking changes
- Complex reasoning needed
- Migration or upgrade
- Performance implications

**Body structure:**

```
[High-level summary]

[Details as bullets if multiple changes]

[References: Closes/Fixes/Refs #XXX]
```

## File Path Mapping

### This Codebase Structure

**Based on sauve-chrome-extension:**

| Path Pattern                      | Domain     | Scope Suggestion |
| --------------------------------- | ---------- | ---------------- |
| `src/popup/components/bookmarks/` | Bookmarks  | `bookmarks`      |
| `src/popup/components/feeds/`     | Feeds      | `feeds`          |
| `src/popup/components/labels/`    | Labels     | `labels`         |
| `src/popup/components/tabs/`      | Tabs       | `tabs`           |
| `src/popup/components/library/`   | Library    | `library`        |
| `src/popup/jazz/schemas/`         | Schema     | `schema`         |
| `src/background/`                 | Background | `background`     |
| `src/lib/`                        | Utilities  | `utils`          |

**Multi-domain changes:**

```
feat: add unified search across bookmarks, feeds, and tabs

[don't use scope when affecting multiple domains]
```

## Special Patterns

### Version Markers

For schema migrations, include version:

```
feat: add urlHash-based storage (v10)
feat: migrate to unified content store (v13)
```

### Phase Markers

For large multi-commit refactors:

```
Phase 1: schema updates for unified architecture
Phase 2: core label functions
Phase 3: auto-repair
Phase 4: migration (v12 to v13)
```

### Breaking Changes

Always document breaking changes:

```
feat!: drop support for Node 14

BREAKING CHANGE: Minimum Node version is now 16.
```

## Context Analysis Workflow

```
1. git diff --staged --stat
   └─ How many files? What domains?

2. git log --oneline -10
   └─ What style does project use?

3. Read AGENTS.md
   └─ Any specific conventions?

4. Classify change
   ├─ Single file obvious? → Subject only
   ├─ Multi-file single purpose? → Subject + brief body
   ├─ Complex feature? → Subject + detailed body
   └─ Schema migration? → Subject + version + breaking notice

5. Select type and scope
   ├─ Type from change characteristics
   └─ Scope from file paths (or omit for multi-domain)

6. Write subject
   ├─ Imperative mood
   ├─ 50 chars max
   ├─ Capitalize first word
   └─ No trailing period

7. Write body (if needed)
   ├─ Blank line after subject
   ├─ 72 char wrap
   └─ Explain what and why
```
