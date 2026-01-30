# Examples Section Template

Reusable Examples section with varying complexity levels.

## Usage

```markdown
## Examples

{{Introductory sentence.}}

### Basic Example

```{{language}}
{{code}}
```

**Input:** {{Input description}}
**Output:** {{Expected output}}

### Advanced Example

```{{language}}
{{code}}
```

**Input:** {{Input description}}
**Output:** {{Expected output}}
**Notes:** {{Important considerations}}

### Real-World Example

```{{language}}
{{code}}
```

**Use Case:** {{When to use this pattern}}
**Considerations:** {{Production concerns}}
```

## Example: Feature Usage

```markdown
## Examples

The following examples demonstrate different complexity levels, from basic usage to production-ready patterns.

### Basic Example

```typescript
import { Workflow } from "@alcyone-labs/aquaria";

const workflow = new Workflow({
  name: "simple-greet",
  steps: [
    {
      name: "greet",
      action: async () => ({ message: "Hello!" })
    }
  ]
});

const result = await workflow.execute();
console.log(result);
// Input: Empty input, workflow with one step
// Output: { success: true, output: { message: "Hello!" } }
```

### Advanced Example

```typescript
import { Workflow } from "@alcyone-labs/aquaria";

const workflow = new Workflow({
  name: "advanced-greet",
  steps: [
    {
      name: "get-user",
      action: async (ctx) => {
        const user = await ctx.db.query("SELECT * FROM users WHERE id = ?", [ctx.input.userId]);
        return { user };
      }
    },
    {
      name: "format-greeting",
      action: async (ctx) => {
        const { user } = ctx.getOutput("get-user");
        return { message: `Hello, ${user.name}!` };
      }
    },
    {
      name: "send-notification",
      action: async (ctx) => {
        const { message } = ctx.getOutput("format-greeting");
        await ctx.notify.send({ message });
        return { sent: true };
      }
    }
  ],
  errorHandling: {
    retry: { maxAttempts: 3 }
  }
});

const result = await workflow.execute({ userId: "user-123" });
// Input: { userId: "user-123" }
// Output: { success: true, output: { sent: true } }
// Notes: Steps can reference previous outputs via ctx.getOutput()
```

### Real-World Example

```typescript
import { Workflow, PanicMode } from "@alcyone-labs/aquaria";

async function productionNotificationWorkflow(input: { userId: string; type: string }) {
  const workflow = Workflow.create({
    name: "prod-notifications",
    panicMode: PanicMode.STOP_AFTER_10_FAILURES,
    steps: [
      {
        name: "validate-input",
        action: async (ctx) => {
          if (!input.userId || !input.type) {
            throw new Error("Missing required fields");
          }
          return { validated: true };
        }
      },
      {
        name: "fetch-template",
        action: async (ctx) => {
          const template = await ctx.cache.get(`templates:${input.type}`);
          return { template };
        }
      },
      {
        name: "render-and-send",
        action: async (ctx) => {
          const { template } = ctx.getOutput("fetch-template");
          const rendered = template.render(ctx.input);
          await ctx.notify.send({ message: rendered });
          return { sent: true };
        }
      }
    ]
  });

  try {
    const result = await workflow.execute();
    return result;
  } catch (error) {
    console.error("Workflow failed:", error);
    throw error;
  }
}

// Use Case: Production notification system with panic mode
// Considerations: Panic mode prevents cascade failures, cache reduces DB load
```

## Example: API Client

```markdown
## Examples

Basic to advanced usage of the Aquaria client library.

### Basic Example

```typescript
import { Client } from "@alcyone-labs/aquaria";

const client = new Client({ apiKey: process.env.API_KEY });
const result = await client.complete("Say hello");
// Input: "Say hello"
// Output: "Hello!"
```

### Advanced Example

```typescript
import { Client } from "@alcyone-labs/aquaria";

const client = new Client({
  apiKey: process.env.API_KEY,
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000
});

const result = await client.complete({
  prompt: "Explain quantum computing",
  system: "You are a technical writer",
  stream: false
});
// Input: Prompt + system instruction
// Output: Complete response
// Notes: Temperature affects creativity, maxTokens limits response length
```

### Real-World Example

```typescript
import { Client } from "@alcyone-labs/aquaria";

class ContentGenerator {
  private client: Client;

  constructor(apiKey: string) {
    this.client = new Client({ apiKey });
  }

  async generateBlogPost(topic: string): Promise<string> {
    const outline = await this.client.complete({
      prompt: `Create an outline for a blog post about: ${topic}`,
      system: "You are a technical content strategist. Create detailed outlines."
    });

    const content = await this.client.complete({
      prompt: `Expand this outline into a comprehensive blog post:\n${outline}`,
      system: "Write in markdown. Include code examples. Be thorough."
    });

    return content;
  }
}

// Use Case: Automated technical content generation
// Considerations: Rate limits, content quality review, token costs
```

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{intro}}` | Section intro | "The following examples..." |
| `{{language}} | Programming language | typescript, python, bash |
| `{{code}}` | Example code | Full code block |
| `{{input}}` | Input description | "{ userId: '123' }" |
| `{{output}}` | Expected output | "{ success: true }" |
| `{{notes}}` | Additional notes | "Steps execute in order" |
| `{{use-case}} | When to use | "Production notification system" |
| `{{considerations}}` | Production notes | "Rate limits apply" |

## Quality Checklist

- [ ] At least 2 examples, maximum 3
- [ ] Examples increase in complexity
- [ ] All examples are runnable
- [ ] Input/output clearly documented
- [ ] Basic example has no external dependencies
- [ ] Advanced example shows real patterns
- [ ] Real-world example is production-ready
- [ ] Code is properly formatted
- [ ] No commented-out code
