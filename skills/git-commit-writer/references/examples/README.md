# Example Commit Messages by Scenario

## Scenario 1: Simple Bug Fix

**Context:** Fixed null pointer exception in user greeting

**Files Changed:**

- `src/utils/greeting.ts` (1 line)

**Bad:**

```
fixed bug
Fixed the null pointer bug in greeting
fix: fixed null pointer in greeting
```

**Good:**

```
fix: handle null user in greeting
```

---

## Scenario 2: New Feature - Single Component

**Context:** Added dark mode toggle to settings

**Files Changed:**

- `src/components/ThemeToggle.tsx` (new)
- `src/hooks/useTheme.ts` (new)
- `src/settings/SettingsPage.tsx` (modified)

**Bad:**

```
added dark mode
dark mode feature
dark mode toggle added to settings
```

**Good:**

```
feat: add dark mode toggle to settings

Add theme toggle component with system preference detection
and local storage persistence.
```

---

## Scenario 3: Complex Feature - Multiple Areas

**Context:** Implemented unified search across all content

**Files Changed:**

- `src/search/SearchBar.tsx` (new)
- `src/search/useSearch.ts` (new)
- `src/search/dsl-parser.ts` (new)
- `src/bookmarks/BookmarksList.tsx` (modified)
- `src/feeds/FeedsList.tsx` (modified)
- `src/library/LibraryPage.tsx` (new)

**Bad:**

```
search feature
added search to bookmarks and feeds and library
search functionality across the app
```

**Good:**

```
feat: add unified search across all content types

Implement "My Library" view combining bookmarks, feeds, and tabs
with DSL-based filtering (type:, is:, source:, has:) and Fuse.js
fuzzy search. Includes virtualized list rendering for performance.
```

---

## Scenario 4: Code Restructuring

**Context:** Split monolithic component into smaller pieces

**Files Changed:**

- `src/components/Inbox.tsx` (deleted)
- `src/inbox/InboxHeader.tsx` (new)
- `src/inbox/InboxItem.tsx` (new)
- `src/inbox/InboxList.tsx` (new)
- `src/inbox/useInbox.ts` (new)
- `src/inbox/utils.ts` (new)

**Bad:**

```
refactored inbox
broke down inbox component
inbox changes
```

**Good:**

```
refactor: breakdown inbox into separate components

- Extract header, item card, and list components
- Create useInbox hook for data management
- Move utility functions to dedicated file
- Improve testability and maintainability
```

---

## Scenario 5: Database Schema Change

**Context:** Migrated to new data model

**Files Changed:**

- `src/schemas/user.ts` (modified)
- `src/schemas/post.ts` (modified)
- `src/migrations/v2-to-v3.ts` (new)
- `src/services/migration.ts` (modified)

**Bad:**

```
schema changes
updated database schema
migration stuff
```

**Good:**

```
feat: migrate to new user-post relationship model (v3)

Breaking: Replace nested user data with references
- Add userId foreign key to posts
- Create migration service for data transform
- Update all queries to use new structure
- Run migration automatically on app start

Refs: #234
```

---

## Scenario 6: Documentation

**Context:** Added API documentation

**Files Changed:**

- `docs/api.md` (new)
- `docs/authentication.md` (new)
- `README.md` (modified)

**Bad:**

```
docs
documentation
added docs
```

**Good:**

```
docs: add API documentation and authentication guide

Document REST endpoints with request/response examples.
Add authentication flow guide with JWT token handling.
```

---

## Scenario 7: Styling/Formatting

**Context:** Applied consistent code style

**Files Changed:**

- `src/**/*.ts` (100+ files with quote changes)

**Bad:**

```
style changes
formatting
updated quotes
```

**Good:**

```
style: normalize quote style to single quotes

Apply Oxfmt formatting across entire codebase.
No functional changes.
```

---

## Scenario 8: Performance Improvement

**Context:** Optimized slow loading list

**Files Changed:**

- `src/components/VirtualList.tsx` (new)
- `src/components/ItemList.tsx` (modified)
- `src/hooks/useVirtualization.ts` (new)

**Bad:**

```
faster list
performance fix
speed improvements
```

**Good:**

```
perf: add virtualization for long item lists

Implement virtual scrolling to render only visible items.
Reduces initial render time from 2s to 200ms for 1000+ items.
```

---

## Scenario 9: Test Addition

**Context:** Added unit tests for utility functions

**Files Changed:**

- `src/utils/format.test.ts` (new)
- `src/utils/validate.test.ts` (new)

**Bad:**

```
tests
test cases
added tests
```

**Good:**

```
test: add unit tests for format and validate utilities

Cover edge cases for date formatting and input validation.
Achieve 100% branch coverage for both modules.
```

---

## Scenario 10: Configuration/Build

**Context:** Updated build tooling

**Files Changed:**

- `vite.config.ts` (modified)
- `package.json` (modified)
- `.github/workflows/ci.yml` (modified)

**Bad:**

```
build updates
config changes
CI stuff
```

**Good:**

```
chore: migrate from ESLint to oxlint and update CI

Replace ESLint/Prettier with oxlint/oxfmt for faster linting.
Update GitHub Actions to use PNPM and add type checking step.
```

---

## Scenario 11: Security Fix

**Context:** Fixed XSS vulnerability

**Files Changed:**

- `src/utils/sanitize.ts` (new)
- `src/components/UserContent.tsx` (modified)

**Bad:**

```
security fix
xss fix
fixed vulnerability
```

**Good:**

```
security: sanitize user input to prevent XSS attacks

Add DOMPurify-based sanitization for all user-generated content.
Escape HTML entities before rendering in UserContent component.

Fixes: CVE-2024-XXXX
```
