# Build Patterns

## Choose the Smallest Truthful Shape

- Docs-only: `SKILL.md` plus focused `references/` when the skill is guidance-first.
- Command-bearing: add `bin/` when the skill exports user-facing commands.
- Runtime/binary-bearing: add `scripts/`, `runtime/`, and manifest runtime metadata only when provisioning is real.

## When Split `references/`

- Nuanced APIs/config/lifecycle/gotchas
- > 1 subsystem/product
  > No: Simple checklists fit SKILL.md

## 5-File Topic Set

- README.md: overview decision tree
- api.md: verbatim signatures
- configuration.md: schemas keys
- patterns.md: multi-step flows
- gotchas.md: pitfalls bugs

## Workflow A-E

A. Clarify: name/repo/platforms/topics
B. Research: APIs/config/issues verbatim
C. Design: pick package shape, manifest needs, references layout
D. Write the smallest set of files that keeps the skill truthful
E. Assemble `SKILL.md`, optional `README.md`, optional adapters; validate install/runtime claims

## Best Practices

- Bullets > prose; density max
- Verbatim APIs/keys; no invention
- Privacy: no secrets/keys hardcoded
- Examples: 2-3 concrete file-based clusters
- kebab-case; SKILL.md CAPITALIZED
- Treat `agent-skills` and `.agents/...` as the canonical install story.
- Treat `commands/` and `install.sh` as optional compatibility layers, never the core architecture.
- If the skill provisions binaries or dependencies, document where they live and how install/update/reset rebuilds them.
