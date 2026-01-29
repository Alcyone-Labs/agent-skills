# Conventional Commits Specification

## Summary

The Conventional Commits specification provides easy rules for creating explicit commit history.

## Specification

### Commit Message Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

**Required. Must be one of:**

| Type       | Description                                    |
| ---------- | ---------------------------------------------- |
| `feat`     | New feature for user                           |
| `fix`      | Bug fix for user                               |
| `docs`     | Documentation only                             |
| `style`    | Code style (formatting, semicolons, etc)       |
| `refactor` | Code change neither fixes bug nor adds feature |
| `perf`     | Code change improving performance              |
| `test`     | Adding or correcting tests                     |
| `chore`    | Build process or auxiliary tool changes        |

### Scope

**Optional.** Provides contextual information:

```
feat(parser): add ability to parse arrays
fix(api): handle null response
refactor(core): simplify state management
```

Common scopes for this codebase:

- `bookmarks`, `feeds`, `labels`, `tabs`, `library`
- `schema`, `hooks`, `components`, `utils`
- `jazz`, `aquaria`, `sync`
- `ui`, `styles`, `theme`

### Description

**Required.** Must:

- Use imperative mood: "change" not "changed" or "changes"
- Not capitalize first letter
- Not end with period

```
✅ feat: allow provided config object to extend other configs
❌ feat: Allow provided config object to extend other configs
❌ feat: allows provided config object to extend other configs
❌ feat: allow provided config object to extend other configs.
```

### Body

**Optional.** Must:

- Begin with blank line after description
- Use word wrap at 72 characters
- Explain motivation and contrast with previous behavior

### Footer

**Optional.** Must:

- Begin with blank line after body
- Contain token followed by colon or hash

**Breaking Change:**

```
BREAKING CHANGE: environment variables now take precedence
```

**Referencing Issues:**

```
Closes #123
Fixes #456
Refs #789
```

## Examples

### With description and breaking change footer

```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for
extending other config files
```

### With `!` to draw attention to breaking change

```
feat!: send an email to the customer when a product is shipped
```

### With scope and `!` to draw attention to breaking change

```
feat(api)!: send an email to the customer when a product is shipped
```

### With both `!` and BREAKING CHANGE footer

```
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

### With no body

```
docs: correct spelling of CHANGELOG
```

### With scope

```
feat(lang): add Polish language
```

### With multi-paragraph body and multiple footers

```
fix: prevent racing of requests

Introduce a request id and reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```
