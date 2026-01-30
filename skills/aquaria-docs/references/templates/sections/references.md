# References Section Template

Reusable References section for cross-linking and external resources.

## Usage

```markdown
## References

### Internal Links

- [{{Topic 1}}]({{path/to/file1.md}})
- [{{Topic 2}}]({{path/to/file2.md}})
- [{{Related Feature}}]({{path/to/file3.md}})

### External Resources

- [{{Resource Title}}]({{https://example.com}}) - {{Brief description}}
- [{{Official Documentation}}]({{https://docs.example.com}}) - {{What this covers}}

### Code Examples

- `{{path/to/example1.ts}}` - {{Description}}
- `{{path/to/example2.ts}}` - {{Description}}
- `{{path/to/test.test.ts}}` - {{Test patterns}}
```

## Example: Feature Documentation

```markdown
## References

### Internal Links

- [Workflow Engine Overview](../../concepts/workflow-engine.md) - Conceptual documentation
- [Error Handling Guide](../../guides/error-handling.md) - Retry and fallback patterns
- [Configuration Reference](../../reference/configuration.md) - All config options
- [Examples Repository](https://github.com/alcyonelabs/aquaria/tree/main/examples) - Working examples

### External Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Language documentation
- [Async/Await Patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) - MDN reference
- [JSON Schema Specification](https://json-schema.org/) - Configuration validation

### Code Examples

- `examples/workflows/basic.ts` - Simple workflow definition
- `examples/workflows/advanced.ts` - Complex workflows with branching
- `packages/aquaria-workflows/src/__tests__/workflow.test.ts` - Test patterns
```

## Example: API Documentation

```markdown
## References

### Internal Links

- [Authentication Guide](../../guides/authentication.md) - API key setup
- [Rate Limiting](../../reference/rate-limiting.md) - Limits and quotas
- [Error Codes](../../reference/errors.md) - All error types
- [Changelog](../../CHANGELOG.md) - Version history

### External Resources

- [OpenAI API Docs](https://platform.openai.com/docs) - LLM provider documentation
- [Node.js Documentation](https://nodejs.org/docs/) - Runtime environment
- [Zod Documentation](https://zod.dev/) - Schema validation library

### API Reference

- `src/orchestrator/index.ts:42` - Main orchestrator class
- `src/types/workflow.ts:15` - Workflow type definitions
- `src/tools/catalog.ts:89` - Available tools catalog
```

## Example: Troubleshooting Guide

```markdown
## References

### Internal Links

- [Deployment Checklist](../../platform/deployment-checklist.md) - Pre-deployment validation
- [Monitoring Guide](../../guides/monitoring.md) - Observability setup
- [Common Errors FAQ](../../guides/faq.md) - Frequently asked questions
- [Support Channels](../../community/support.md) - Getting help

### External Resources

- [Node.js Error Handling](https://nodejs.org/api/errors.html) - Node.js errors reference
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/) - Edge deployment
- [MDN JavaScript Error Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors) - JS errors

### Related Issues

- GitHub Issue #123: Memory leak in long-running workflows
- GitHub Issue #456: Rate limit handling improvements
- PR #789: Error message improvements (merged)
```

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{topic}}` | Link text | "Workflow Engine Overview" |
| `{{path}}` | Relative path or URL | "../../concepts/engine.md" |
| `{{description}}` | Brief link description | "Conceptual documentation" |
| `{{file}}` | Code file path | "src/orchestrator/index.ts" |

## Link Best Practices

### Internal Links

| Pattern | Example |
|---------|---------|
| Relative to current file | `[Topic](topic.md)` |
| Relative to docs root | `[Topic](../concepts/topic.md)` |
| Cross-topic reference | `[Topic](../../topic/file.md)` |

### External Links

| Pattern | Example |
|---------|---------|
| Official documentation | [TypeScript](https://www.typescriptlang.org/) |
| MDN reference | [async function](https://developer.mozilla.org/...) |
| GitHub repository | [Aquaria](https://github.com/alcyonelabs/aquaria) |
| Blog post or article | [Announcement](https://blog.example.com/...) |

## Quality Checklist

- [ ] At least 3 internal links
- [ ] External links are vetted sources
- [ ] Links are descriptive, not generic
- [ ] Code examples point to actual files
- [ ] Links are functional (verified)
- [ ] No broken or 404 links
- [ ] Links use HTTPS where possible
- [ ] Related topics are logically connected
