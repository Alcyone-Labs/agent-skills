---
description: Load large-file-refactorer skill to scan and refactor large code files
---

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:
1. Determine install location by checking which exists:
   - Local: `.opencode/skill/large-file-refactorer/`
   - Global: `~/.config/opencode/skill/large-file-refactorer/`
2. Run the appropriate install command:
   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/large-file-refactorer/main/install.sh | bash
   
   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/large-file-refactorer/main/install.sh | bash -s -- --global
   ```
3. Output success message and stop (do not continue to other steps).

### Step 2: Load skill

```javascript
skill({ name: 'large-file-refactorer' })
```

### Step 3: Identify task type from user request

Analyze $ARGUMENTS to determine:
- **Task type**: scan only, scan and refactor, specific file, threshold
- **Scope**: directory (default: entire codebase), file pattern
- **Threshold**: lines (default: 500)

### Step 4: Execute task

**If scan only ("find large files", "analyze", "dry run"):**
1. Follow Discovery workflow in SKILL.md
2. Present findings with prioritization
3. Wait for user to request refactoring

**If scan + refactor ("refactor large files", "split big files"):**
1. Follow full Discovery → Analysis → Presentation workflow
2. Get user confirmation
3. For each approved file:
   - Load `references/refactoring-protocol/README.md`
   - Execute 5-phase protocol
   - Verify before proceeding to next file
4. Generate comprehensive report

**If specific file ("refactor src/core/UserManager.ts"):**
1. Verify file exists and exceeds threshold
2. Skip discovery phase
3. Go directly to refactoring protocol
4. Run all 5 phases

### Step 5: Summarize

```
=== Large File Refactoring Complete ===

Files analyzed: [N]
Files above threshold: [N]
Files refactored: [N]
Files skipped: [N]
Total time: [duration]

See full report above for details.
```
