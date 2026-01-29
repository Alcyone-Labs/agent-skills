---
name: git-commit-writer
description: Write consistent high-quality Git commits following project conventions
references:
  - style-guide
  - conventional-commits
  - examples
  - context-analysis
---

## When to Apply

- User asks "generate commit message" or "write git commit"
- Staging changes that need clear documentation
- Commit body needed for complex multi-file changes
- Commit history review or rewriting

## Golden Rules

### Subject Line (Required)

- **Hard limit**: 50 characters (soft limit: 72 for exceptional cases)
- **Capitalize first word**: "Add feature" not "add feature"
- **No period at end**: "Add login" not "Add login."
- **Imperative mood**: "Fix bug" not "Fixed bug" or "Fixes bug"
- **Single purpose**: One atomic change per commit

### Commit Type Prefix (Required)

Based on conventional commits + project conventions:

| Prefix      | Use When                                        |
| ----------- | ----------------------------------------------- |
| `feat:`     | New feature or capability                       |
| `fix:`      | Bug fix                                         |
| `refactor:` | Code restructuring, no behavior change          |
| `docs:`     | Documentation only                              |
| `style:`    | Formatting, semicolons, quotes (no code change) |
| `test:`     | Adding/updating tests                           |
| `chore:`    | Build, tooling, dependencies                    |
| `perf:`     | Performance improvement                         |
| `security:` | Security-related changes                        |

### Body (Optional but Recommended)

- **Blank line** after subject
- **Wrap at 72 characters**
- Explain **what** and **why**, not how
- Use bullet points for multiple distinct changes
- Reference issues: `Closes #123`, `Refs #456`

### Codebase Context Analysis

ALWAYS analyze the codebase structure before writing:

1. **Check AGENTS.md or README** for project-specific conventions
2. **Review recent commits**: `git log --oneline -20`
3. **Identify affected areas**:
   - Package/namespace (e.g., `packages/sauve-chrome-extension/src/popup`)
   - Feature domain (bookmarks, feeds, labels, tabs, library)
   - Tech layer (schema, hooks, components, utils)
4. **Map to semantic scope** if project uses scopes: `feat(bookmarks):`

### Decision Tree

```
Changes staged?
├─ Single file, obvious change
│  └─ Subject only, no body
│     └─ "fix: correct typo in README"
│
├─ Multiple related files, single purpose
│  └─ Subject + brief body
│     └─ "feat: add keyboard shortcuts system
│
│         Implements configurable keybindings with context-aware
│         actions for navigation and reader controls."
│
├─ Complex refactor or feature
│  └─ Subject + detailed body with bullets
│     └─ "refactor: migrate inbox to reading list model
│
│         Replace inbox architecture with single-source-of-truth:
│         - Remove inbox, inboxReferences from schema
│         - Add readingListIndex for stable UI ordering
│         - Create reading-list module with query functions
│         - Migrate UI hooks to use reading list"
│
└─ Schema/database migration
   └─ Include migration details
      └─ "feat: add urlHash-based storage (v10)

          Breaking: Feed items now keyed by SHA-256 hash
          - Add RSSFeedItemState with urlHash key
          - Update PageContent with labels field
          - Add canonicalizeFeedUrl() utility"
```

## Pattern Library

### Good Subject Lines

```
feat: add unified search across all content types
fix: prevent duplicate bookmarks on rapid clicks
refactor: extract useLabelCRUD hook from component
docs: add Aquaria integration architecture guide
style: normalize quote style per Oxfmt
chore: migrate from ESLint to oxlint
perf: lazy-load fuzzy search index
security: sanitize user input in search DSL
```

### Good Bodies

```
Add My Library unified search across feeds, bookmarks, tabs

Implements a unified "My Library" view combining all content types
with powerful DSL-based filtering and Fuse.js fuzzy text search.
Converts options page to Preact and adds keyboard shortcuts panel.

Closes #456
```

```
refactor: breakdown inbox into separate components

- Extract bulk action toolbar, header, item card, drawer
- Create hooks to handle selection and CRUD logic
- Move utility functions to dedicated files
- Improve component reusability and testability
```

### Anti-Patterns to Avoid

```
❌ "updated files"                    (vague, past tense)
❌ "Fix."                             (too short, period)
❌ "feat: added new feature"          (past tense, redundant)
❌ "various changes"                  (not atomic)
❌ "WIP: working on login"            (no WIP in commits)
❌ "fix bug #123"                     (missing colon after type)
```

## Examples

### Example 1: Simple Bug Fix

**Staged changes:**

```diff
- if (user.name) {
+ if (user?.name) {
```

**Commit message:**

```
fix: handle undefined user in greeting
```

### Example 2: Feature with Multiple Files

**Staged changes:**

- `src/hooks/useKeyboard.ts` (new)
- `src/components/KeyboardShortcuts.tsx` (new)
- `src/context/ShortcutContext.tsx` (new)
- `src/types/shortcuts.ts` (new)

**Commit message:**

```
feat: add keyboard shortcuts configuration system

Implements configurable keybindings with context-aware actions.
Defines shortcut contexts (any, tabs, list, reader) and default
Alt+letter shortcuts for main pages. Stored in Jazz for sync.
```

### Example 3: Schema Migration

**Staged changes:**

- `src/schemas/root.ts` (modified)
- `src/schemas/label.ts` (modified)
- `src/background/migration-service.ts` (modified)

**Commit message:**

```
feat: migrate to unified content store (v13)

Breaking schema changes for unified content architecture:
- Replace separate inbox/feed storage with contentStore
- Add urlHash as primary key for all content items
- Migrate existing data via auto-repair service
- Update all queries to use new index structure

Migration runs automatically on app startup.
```

### Example 4: Refactor

**Staged changes:**

- `src/popup/components/feeds/` (reorganized)
- `src/popup/hooks/useFeeds.ts` (new)

**Commit message:**

```
refactor: breakdown feeds into separate components

- Extract feed card, icon, search, and item components
- Separate feed management into custom hooks
- Reorganize feed navigation with index.tsx entry point
- Improve code organization and testability
```

### Example 5: Documentation

**Staged changes:**

- `AGENTS.md` (new)
- `docs/architecture.md` (new)

**Commit message:**

```
docs: add development guidelines and architecture documentation

Add AGENTS.md with build commands, tech stack overview,
code style conventions, and testing guidelines.
Document Aquaria RSS integration and Jazz storage patterns.
```
