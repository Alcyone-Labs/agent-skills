# Sauve Jazz Extension Skill

Sauve-specific implementation guide for Jazz-powered Chrome extension architecture.

## Install

From this repository root:

```bash
./skills/sauve-jazz-extension/install.sh --local
```

Or if `agent-skills` is already available:

```bash
agent-skills install sauve-jazz-extension --local
```

## Scope of this skill

Use this skill for Sauve-specific implementation details:

- MV3 service worker as canonical Jazz runtime
- popup proxy context and message protocol contracts
- labels/collections systems and source-specific flows
- Sauve testing and troubleshooting playbooks

## Route generic Jazz topics to focused skills

- runtime + WASM compatibility: `jazz-runtime-wasm-compat`
- loading + subscriptions: `jazz-loading-subscriptions`
- schema evolution + migrations: `jazz-schema-migrations`
- cross-domain architecture: `jazz-sync-architecture`
- worker/proxy architecture baseline: `jazz-sauve-worker-proxy`

## Canonical structure

```text
skills/sauve-jazz-extension/
├── SKILL.md
├── README.md
├── agent-skills.json
├── install.sh
├── bin/sauve-jazz-extension
├── references/
└── commands/
```
