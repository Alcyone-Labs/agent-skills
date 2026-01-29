---
description: Load Large File Refactorer skill for identifying and refactoring oversized files
argument-hint: <task description>
---

Load the Large File Refactorer skill and help identify and safely refactor oversized code files.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `.factory/skills/large-file-refactorer/`
   - Global: `~/.factory/skills/large-file-refactorer/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local --droid

   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --droid
   ```

3. Output success message and stop (do not continue to other steps).

### Step 2: Load skill

Load the large-file-refactorer skill.

### Step 3: Identify task type

Analyze $ARGUMENTS to determine:

| Task | Action |
|------|--------|
| Find large files | Scan codebase for files > threshold (default 500 lines) |
| Analyze specific file | Check file structure, complexity, test coverage |
| Refactor file | Execute 5-phase test-first refactoring protocol |
| Dry run | Analyze only, don't refactor |

### Step 4: Read relevant reference files

Read from `{{SKILL_PATH}}/references/refactoring-protocol/`:
- `README.md` - Protocol overview
- `patterns.md` - Common refactoring patterns
- `gotchas.md` - Pitfalls and error handling

### Step 5: Execute

**For finding large files:**
1. Scan codebase for files exceeding threshold
2. Analyze each file's structure and complexity
3. Prioritize by business impact and risk (P0-P3)
4. Present findings with recommendations

**For refactoring:**
Follow the 5-phase protocol:
1. **Assessment** (5-10 min): Analyze file structure, identify modules, check test coverage
2. **Test Coverage** (15-30 min): Write comprehensive tests (CRITICAL - no skip allowed)
3. **Refactoring** (20-40 min): Split file into logical modules, update imports
4. **Verification** (5-10 min): Run tests, compare to baseline, ensure no regressions
5. **Documentation** (5 min): Add JSDoc, document module structure

### Step 6: Summarize

```
=== Large File Refactorer Task Complete ===

Files analyzed: <count>
Files refactored: <count>
Test coverage: <before>% → <after>%
Lines reduced: <before> → <after>

Recommendations:
- <recommendation 1>
- <recommendation 2>
```

<user-request>
$ARGUMENTS
</user-request>
