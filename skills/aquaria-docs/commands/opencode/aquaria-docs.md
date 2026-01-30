# /aquaria-docs

Create or validate Aquaria project documentation following strict documentation principles, templates, and quality gates.

## Usage

```
/aquaria-docs create <topic> --template <type>
/aquaria-docs validate <file.md>
/aquaria-docs scaffold <topic>
```

The command supports arbitrary documentation requests passed via $ARGUMENTS.

## Options

| Option | Description |
|--------|-------------|
| `--template` | Template type: base, guide, api-reference, design-doc, cli-reference, troubleshooting |
| `--topic` | Documentation topic/path |
| `--skip-validation` | Skip quality gate checks |

## Examples

### Create New Documentation

```
/aquaria-docs create user-auth --template guide
```

Creates `docs/user-auth/user-auth-guide.md` using `guide.md` template.

### Validate Existing Documentation

```
/aquaria-docs validate docs/building/steps/templating.md
```

Runs quality checklist against the file.

### Scaffold Documentation Structure

```
/aquaria-docs scaffold workflows
```

Creates `docs/workflows/` with README.md and template files.

## Quality Gates

Every documentation file must pass:

- [ ] Template used correctly
- [ ] All 5 mandatory sections present
- [ ] Quickstart code is runnable
- [ ] Examples have expected outputs
- [ ] `pnpm run spellcheck` passes
- [ ] `pnpm run linkcheck` passes

## Related Commands

- `/aquaria-cloudflare-ops`: Cloudflare-specific documentation
- `/skill-forge`: General skill creation

<user-request>
$ARGUMENTS
</user-request>
