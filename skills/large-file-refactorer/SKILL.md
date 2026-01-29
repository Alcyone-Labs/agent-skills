---
name: large-file-refactorer
description: Scans codebase for large files and orchestrates refactoring workflows using a test-first protocol
references:
  - refactoring-protocol
---

# Large File Refactorer

Expert agent for identifying oversized code files and orchestrating safe refactoring via test-first protocols.

## When to Apply

- User says "find large files", "refactor big files", "analyze file sizes"
- Codebase has files exceeding 500 lines
- Need to split monolithic files into modular components
- Concerns about code maintainability and test coverage

## Non-Negotiable Rules

1. **Test-first mandate**: NEVER refactor without adequate test coverage
2. **User confirmation**: ALWAYS present findings before bulk refactoring
3. **Verification gate**: Run tests after EACH file, stop on failure
4. **Progressive processing**: One file at a time, verify, then continue

## Workflow Decision Tree

```
Request: Find/refactor large files
A. Discovery
   - Determine threshold (default 500 lines)
   - Glob: **/*.{ts,js,tsx,jsx,py,rb,go}
   - Filter: exclude generated, node_modules, dist, lock files, configs
B. Analysis
   - Read each large file (wc -l)
   - Identify classes/functions/imports
   - Check test coverage (exists? *.test.ts *.spec.ts)
   - Score: P0 (core logic, no tests) > P1 (frequent imports) > P2 (utilities, tests) > P3 (skip)
C. Presentation
   - Report: X files above threshold
   - Group by priority (P0-P3)
   - Ask: "Process all high-priority? All? Select specific?"
D. Orchestration (per approved file)
   - Load references/refactoring-protocol/README.md
   - Execute 5-phase protocol:
     1. Assessment
     2. Test Coverage (CRITICAL - no skip)
     3. Refactoring
     4. Verification
     5. Documentation
   - Wait for verification pass before next file
E. Reporting
   - Summary: analyzed, above threshold, refactored, skipped, duration
   - Per-file breakdown: before/after lines, files created, test coverage change
   - Recommendations: CI limits, pre-commit hooks, design guidelines
```

## File Size Thresholds

| Format      | Examples              | Default |
|-------------|----------------------|---------|
| Lines       | "500 lines", "500"    | 500     |
| Kilobytes   | "50KB", "50kb"       | 50KB    |
| Characters  | "50 chars"           | 5000    |

## Exclusion Patterns

- Generated: `*.generated.ts`, `*.d.ts`, `*.generated.js`
- Dependencies: `node_modules/`, `vendor/`, `dist/`, `build/`
- Artifacts: `*.min.js`, `*.bundle.js`
- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Configs: `tsconfig.json`, `.eslintrc*`, `.oxfmtrc.json`, `aquaria.config.json`

## Priority Framework

| Priority | Criteria                                       | Action                   |
|----------|-----------------------------------------------|--------------------------|
| P0       | Core business logic, high complexity, no tests | Process immediately      |
| P1       | Frequently imported, moderate complexity       | Process after P0         |
| P2       | Utility functions, good test coverage          | Process if user approves |
| P3       | Generated or low-value code                    | Skip with explanation    |

## Tool Usage

| Tool   | Purpose                               |
|--------|---------------------------------------|
| `glob` | Find all code files                   |
| `bash` | Check file sizes (`wc -l`), run tests |
| `grep` | Search for patterns during analysis   |
| `read` | Quick inspection of file structure    |

## Error Handling

**If refactoring fails:**
1. Capture error message
2. Log failure in report
3. Ask user: "Retry this file, skip it, or stop entirely?"
4. Respect user's choice before proceeding

**If glob/bash fails:**
1. Check file path validity
2. Verify permissions
3. Report specific error to user
4. Ask for alternative approach

## Examples

### Example 1: Find and Refactor Large Files

**Input**: "Find files larger than 300 lines and refactor the important ones"

**Process**:
1. Glob `**/*.{ts,tsx,js,jsx}`
2. Filter with `wc -l | awk '$1 > 300'`
3. Analyze 12 files above threshold
4. Prioritize: 3 P0, 4 P1, 5 P2
5. Present findings, get approval for P0-P1
6. Orchestrate refactoring per protocol

**Output**:
```markdown
# Large File Refactoring Report

## Summary
- Files analyzed: 150
- Files above threshold: 12
- Files refactored: 7 (P0-P1)
- Files skipped: 5 (P2 deferred, P3 excluded)
- Total time: 2h 15m

## Files Successfully Refactored

### src/core/UserManager.ts (800 lines)
**Before**: Single file with 800 lines, 3 classes, 15 functions
**After**: Split into 4 files (total 800 lines)
- `UserRepository.ts` (200 lines) - Data access
- `UserValidator.ts` (150 lines) - Validation
- `UserService.ts` (270 lines) - Business logic
- `UserManager.ts` (180 lines) - Orchestrator

**Test Coverage**: Before 0% → After 92% (35 new tests)
**Status**: ✅ All tests passing
```

### Example 2: Dry Run Analysis

**Input**: "Check src/ directory for large files (dry run only)"

**Process**:
1. Glob `src/**/*.{ts,js}` only
2. Apply 500-line threshold
3. Analyze and categorize
4. Present detailed report
5. Wait for explicit refactoring request

**Output**:
```markdown
## Found 8 files exceeding 500 lines in src/

### High Priority (P0-P1) - Recommend Refactoring
1. **src/core/UserManager.ts** (800 lines) - Core auth logic, no tests
2. **src/controllers/OrderController.ts** (650 lines) - High complexity, partial tests

### Medium Priority (P2) - Ask Before Processing
3. **src/utils/StringUtils.ts** (520 lines) - Utilities, good tests

Would you like me to:
- Process all high-priority files automatically?
- Process all files?
- Select specific files to refactor?
```

### Example 3: Test Safety Concerns

**Input**: "I'm worried about breaking tests during refactoring"

**Process**:
1. Emphasize test-first protocol
2. Show current test coverage per file
3. Offer: Run full test suite before starting
4. Run `npm test` if user agrees
5. Proceed only if tests green
6. Document baseline failures

**Output**:
```
✅ Baseline test run complete
- Total tests: 247
- Passing: 238 (96%)
- Failing: 9 (4%) - documented known issues

Will proceed with refactoring, maintaining current failure baseline.
No new failures will be introduced.
```

## Best Practices

1. **Start with confirmation**: Never auto-refactor without approval
2. **Time awareness**: Warn if >3 files (= 30+ minutes)
3. **Progress updates**: Report after each file: "✅ Processed 1/5 files (20%)"
4. **Test safety**: Verify tests pass before proceeding
5. **Clear communication**: Explain why files prioritized or skipped
6. **No behavioral changes**: Refactoring only, no bug fixes
7. **Import updates**: Check and update all importers after split

## References

- **references/refactoring-protocol/**: 5-phase test-first refactoring protocol
  - README.md: Protocol overview and decision tree
  - patterns.md: Common refactoring patterns (Repository, Validator, Constants)
  - gotchas.md: Pitfalls and error handling
