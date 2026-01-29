---
description: Generate consistent high-quality Git commit messages
---

## Workflow

### Step 1: Check for --update-skill flag

If `$ARGUMENTS` contains `--update-skill`:

1. Run `install.sh --local` (or `--global` based on context)
2. Stop execution

### Step 2: Load skill

```javascript
skill({ name: 'git-commit-writer' });
```

### Step 3: Analyze staged changes

```bash
git diff --staged --stat
git diff --staged --name-only
git log --oneline --no-decorate -10
```

**Read if exists:**

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`

### Step 4: Classify the change

**Decision tree:**

```
Number of files?
├── 1-2 files, obvious change
│   └─ Generate subject only
├── 3-5 files, single purpose
│   └─ Generate subject + brief body
└─ 6+ files OR complex change
    └─ Generate subject + detailed body with bullets
```

### Step 5: Select commit type

| Change Type        | Prefix      |
| ------------------ | ----------- |
| New feature        | `feat:`     |
| Bug fix            | `fix:`      |
| Code restructuring | `refactor:` |
| Documentation      | `docs:`     |
| Formatting         | `style:`    |
| Tests              | `test:`     |
| Build/tooling      | `chore:`    |
| Performance        | `perf:`     |
| Security           | `security:` |

### Step 6: Generate commit message

**Rules:**

- Subject: 50 chars max, capitalize first word, no period
- Use imperative mood: "Add" not "Added"
- Include scope if project uses it: `feat(bookmarks):`
- Body: 72 char wrap, explain what and why
- Use bullets for multiple distinct changes

### Step 7: Output

Return ONLY the commit message, no commentary.

## Example Commands

**Generate commit for staged changes:**

```
/git-commit-writer
```

**Update skill installation:**

```
/git-commit-writer --update-skill
```

<user-request>
$ARGUMENTS
</user-request>
