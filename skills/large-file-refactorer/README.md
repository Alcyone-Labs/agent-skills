# Large File Refactorer

Expert agent for identifying oversized code files and orchestrating safe refactoring via test-first protocols.

## What This Skill Does

- **Scans codebases** to find files exceeding size thresholds (default: 500 lines)
- **Analyzes** file structure, complexity, and test coverage
- **Prioritizes** files by business impact and refactoring risk
- **Orchestrates** refactoring using a 5-phase test-first protocol
- **Reports** comprehensive results and recommendations

## Key Features

- **Test-First Approach**: Never refactor without adequate test coverage
- **Safe Refactoring**: Verification at each step prevents regressions
- **Smart Prioritization**: P0-P3 scoring focuses effort on high-value targets
- **Comprehensive Reporting**: Before/after metrics and actionable recommendations

## Installation

### Global Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/large-file-refactorer/main/install.sh | bash -s -- --global
```

### Local Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/large-file-refactorer/main/install.sh | bash -s -- --local
```

### With Selective Agent Targeting

```bash
# OpenCode only
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/large-file-refactorer/main/install.sh | bash -s -- --global --opencode

# Multiple agents
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/large-file-refactorer/main/install.sh | bash -s -- --global --opencode --gemini
```

## Usage

### Find Large Files

```
Find files larger than 300 lines
```

### Scan and Refactor

```
Refactor all large files in the src/ directory
```

### Specific File

```
Refactor src/core/UserManager.ts
```

### Dry Run

```
Analyze codebase for large files but don't refactor yet
```

## The Refactoring Protocol

This skill implements a rigorous 5-phase protocol:

1. **Assessment** (5-10 min): Analyze file structure, identify modules, check test coverage
2. **Test Coverage** (15-30 min): Write comprehensive tests (CRITICAL - no skip allowed)
3. **Refactoring** (20-40 min): Split file into logical modules, update imports
4. **Verification** (5-10 min): Run tests, compare to baseline, ensure no regressions
5. **Documentation** (5 min): Add JSDoc, document module structure

## File Structure

```
skills/large-file-refactorer/
├── SKILL.md                          # Main skill manifest
├── README.md                         # This file
└── references/
    └── refactoring-protocol/
        ├── README.md                 # Protocol overview
        ├── patterns.md               # Common refactoring patterns
        └── gotchas.md                # Pitfalls and error handling
```

## License

MIT
