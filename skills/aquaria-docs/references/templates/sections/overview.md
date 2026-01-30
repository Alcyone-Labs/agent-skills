# Overview Section Template

Reusable Overview section that works across all documentation types.

## Usage

```markdown
## Overview

{{1-paragraph purpose statement.}}

### Prerequisites

- {{Prerequisite 1}}
- {{Prerequisite 2}}
- {{Prerequisite 3}}

### What You'll Learn

By the end of this document, you will:

- {{Learning outcome 1}}
- {{Learning outcome 2}}
- {{Learning outcome 3}}
```

## Example: Feature Documentation

```markdown
## Overview

The Workflow Engine provides a declarative way to define and execute multi-step workflows. It handles state management, error recovery, and parallel execution automatically.

### Prerequisites

- Node.js 18 or higher
- TypeScript 5.0+
- Understanding of async/await patterns

### What You'll Learn

By the end of this guide, you will:

- Create workflow definitions using the declarative API
- Configure error handling and retry policies
- Monitor workflow execution with built-in tracing
```

## Example: API Documentation

```markdown
## Overview

The `AgenticOrchestrator` class coordinates autonomous agent execution. It manages agent lifecycle, tool dispatch, and state persistence across multiple execution rounds.

### Prerequisites

- `npm install @alcyone-labs/aquaria`
- LLM API key configured in environment
- Understanding of tool calling patterns

### What You'll Learn

- Initialize the orchestrator with custom configuration
- Register tools and capabilities
- Execute multi-round agent conversations
```

## Example: Troubleshooting Guide

```markdown
## Overview

This guide covers common issues encountered when running Aquaria in production environments. Each issue includes symptoms, root cause analysis, and resolution steps.

### Prerequisites

- Access to logs and traces
- Understanding of deployment configuration
- Permission to modify runtime settings

### What You'll Learn

- Diagnose workflow failures from logs
- Identify configuration issues
- Apply appropriate fixes
```

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{purpose}}` | 1-paragraph description | "The Workflow Engine provides..." |
| `{{prerequisite}}` | Required knowledge/setup | Node.js 18+ |
| `{{outcome}}` | What user will achieve | "Create workflow definitions" |

## Variations

### Minimal Overview (No Prerequisites)

```markdown
## Overview

{{1-paragraph purpose statement.}}

### What You'll Learn

- {{Outcome 1}}
- {{Outcome 2}}
```

### Technical Overview (For Architects)

```markdown
## Overview

{{Technical description of the system/component.}}

### System Context

{{How this fits into the larger system.}}

### Key Concepts

- {{Concept 1}}: {{Brief explanation}}
- {{Concept 2}}: {{Brief explanation}}

### Prerequisites

- {{Technical prerequisite 1}}
- {{Technical prerequisite 2}}
```

## Quality Checklist

- [ ] Purpose statement is specific, not generic
- [ ] Prerequisites are actionable (not "understand X")
- [ ] Outcomes are measurable
- [ ] Language matches target audience
- [ ] No code examples in Overview section
