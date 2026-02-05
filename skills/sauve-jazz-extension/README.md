# Sauve Jazz Extension Skill

Build features for Jazz-powered Chrome extensions with service worker architecture, E2E encrypted sync, and real-time data flow.

## Quick Start

```bash
# Install skill
curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/skill-forge/main/install.sh | bash -s -- sauve-jazz-extension

# Use with OpenCode
/sauve-jazz-extension help me add a new bookmark feature

# Use with Gemini CLI
gemini -c sauve-jazz-extension "Debug sync issue where UI doesn't update"
```

## What This Skill Covers

- **Architecture**: Service worker as sole Jazz client, proxy pattern for popup, proxy mode first
- **Data Flow**: Query/mutation/subscription patterns, serialization
- **Sync Patterns**: Real-time updates, optimistic UI, conflict resolution
- **Schemas**: CoValue design, migrations, namespace patterns
- **Testing**: Unit/integration/E2E test patterns
- **Troubleshooting**: Common sync issues, debugging techniques
- **Labels/Collections**: Hierarchical labels and UI ↔ SW update flow

## Core Principles

1. **Service Worker Only**: Never create Jazz context in popup
2. **Proxy Mode First**: Always check `isProxyMode()`; route through service worker
3. **Message Protocol**: All data flows through typed messages
4. **Track Mutations**: Always call `trackLocalMutation()` before Jazz operations
5. **Optimistic UI**: Update immediately, confirm or rollback
6. **Schema Evolution**: Additive only, versioned migrations

## File Structure

```
skills/sauve-jazz-extension/
├── SKILL.md                      # Main skill manifest
├── README.md                     # This file
├── references/
│   ├── architecture/             # Service worker pattern, proxy context
│   ├── data-flow/                # Query/mutation/subscription flows
│   ├── sync-patterns/            # Real-time sync, optimistic UI
│   ├── testing/                  # Test patterns for Jazz
│   ├── troubleshooting/          # Common issues and fixes
│   ├── schemas/                  # CoValue patterns, migrations
│   └── message-protocol/         # Message types, handlers
└── commands/
    ├── opencode/sauve-jazz-extension.md
    └── gemini/sauve-jazz-extension.toml
```

## Common Tasks

### Add New Entity Type

1. Add to schema in `popup/jazz/schemas/`
2. Add mutation handler in `background/jazz-message-handler.ts`
3. Add feature function in `popup/jazz/features/`
4. Use in UI components

### Debug Sync Issues

1. Check `trackLocalMutation()` is called before Jazz operations
2. Verify `clientId` is passed in mutations
3. Ensure port connections are maintained
4. Test with multiple popup instances

### Add Schema Field

1. Add field as `.optional()` to CoValue
2. Bump `CURRENT_SCHEMA_VERSION`
3. Add migration if needed
4. Test with old data

## Examples

See `SKILL.md` for detailed examples:

- Adding a new entity type
- Fixing sync issues
- Implementing optimistic UI

## References

- [Jazz Documentation](https://jazz.tools/docs)
- [Chrome Extension MV3](https://developer.chrome.com/docs/extensions/mv3/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
