# Quickstart Section Template

Reusable Quickstart section for getting users productive in under 5 minutes.

## Usage

```markdown
## Quickstart

{{Single sentence describing what you'll accomplish.}}

```bash
# Installation or setup
{{command}}
```

```{{language}}
// Minimal working example
{{code}}
```

### Expected Output

```
{{Console output or expected result}}
```

**Time to complete:** {{X minutes}}
```

## Example: Package Installation

```markdown
## Quickstart

Get the Aquaria CLI installed and run your first workflow in under 5 minutes.

```bash
# Install the CLI globally
npm install -g @alcyone-labs/aquaria-cli

# Verify installation
aquaria --version
```

```typescript
// Create and run a simple workflow
import { Workflow } from "@alcyone-labs/aquaria";

const workflow = new Workflow({
  name: "hello-world",
  steps: [
    {
      name: "greet",
      action: async () => ({ message: "Hello, World!" })
    }
  ]
});

const result = await workflow.execute();
console.log(result);
// Expected: { success: true, output: { message: "Hello, World!" } }
```

### Expected Output

```
$ aquaria --version
@alcyone-labs/aquaria-cli/1.0.0 darwin-x64 node/v18.17.0
```

**Time to complete:** 3 minutes
```

## Example: Docker Setup

```markdown
## Quickstart

Run a pre-built Aquaria container and execute your first workflow.

```bash
# Pull the latest image
docker pull alcyonelabs/aquaria:latest

# Run the container
docker run -it --rm alcyonelabs/aquaria:latest --help
```

```yaml
# Create a simple workflow file
name: hello-world
version: 1.0.0
steps:
  - name: greet
    action: echo "Hello from Docker!"
```

### Expected Output

```
Usage: aquaria [command] [options]

Commands:
  run      Execute a workflow
  validate Validate workflow syntax
  init     Create a new workflow project
```

**Time to complete:** 5 minutes
```

## Example: Local Development

```markdown
## Quickstart

Clone the repository and run the example workflow locally.

```bash
# Clone the repository
git clone https://github.com/alcyonelabs/aquaria.git
cd aquaria

# Install dependencies
pnpm install

# Run the example
pnpm run example:hello-world
```

```typescript
// examples/hello-world.ts
import { run } from "../src/index.js";

async function main() {
  const result = await run({
    prompt: "Say hello",
    model: "gpt-4"
  });
  console.log(result);
}
```

### Expected Output

```
[INFO] Starting workflow execution
[INFO] Model: gpt-4
[INFO] Response: "Hello!"
[INFO] Workflow completed in 2.3s
```

**Time to complete:** 10 minutes
```

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{goal}}` | What user accomplishes | "Get the CLI installed" |
| `{{command}}` | CLI command | `npm install -g @package` |
| `{{language}}` | Code language | typescript, python, bash |
| `{{code}}` | Minimal example | See examples above |
| `{{output}}` | Expected output | Console output |
| `{{time}}` | Time estimate | 3 minutes |

## Quickstart Variations

### Single Command Quickstart

```markdown
## Quickstart

```bash
{{one-command installation}}
```
Done! You're ready to use {{product}}.
```

### API Quickstart

```markdown
## Quickstart

```typescript
import { client } from "@package";

const result = await client.doSomething();
console.log(result);
```

**Prerequisites:** Node.js 18+, API key
**Time to complete:** 2 minutes
```

## Quality Checklist

- [ ] Setup completes in under 5 minutes
- [ ] Single copy-pasteable code block
- [ ] No intermediate steps or configuration
- [ ] Expected output clearly shown
- [ ] Time estimate is accurate
- [ ] Code is runnable without modification
- [ ] No external dependencies beyond stated prerequisites
