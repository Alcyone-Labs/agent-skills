---
description: Build Jazz-powered Chrome extensions with E2E encrypted sync
---

If $ARGUMENTS contains `--update-skill`:

- Check for local install at `.opencode/skills/sauve-jazz-extension/`
- Check for global install at `~/.config/opencode/skills/sauve-jazz-extension/`
- If neither exists, run: curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/skill-forge/main/install.sh | bash -s -- sauve-jazz-extension
- Stop

skill({ name: 'sauve-jazz-extension' })

Analyze $ARGUMENTS to determine task type:

**Task Types:**

- "add feature" | "new entity" | "create mutation" → Feature implementation
- "sync issue" | "not updating" | "stale data" → Debugging sync
- "schema" | "migration" | "add field" → Schema design
- "test" | "testing" | "write test" → Testing patterns

**For Feature Implementation:**

1. Read references/architecture/patterns.md
2. Read references/schemas/README.md
3. Read references/data-flow/README.md
4. Implement: schema → service worker handler → popup feature → UI

**For Sync Debugging:**

1. Read references/troubleshooting/README.md
2. Read references/sync-patterns/README.md
3. Check trackLocalMutation() is called before Jazz operations
4. Verify clientId is passed in mutations
5. Test with multiple popup instances

**For Schema Design:**

1. Read references/schemas/README.md
2. Read references/architecture/gotchas.md
3. Use co.record for O(1) lookup
4. Add optional fields only
5. Bump CURRENT_SCHEMA_VERSION

**For Testing:**

1. Read references/testing/README.md
2. Mock jazz-tools/worker
3. Use fake-indexeddb
4. Clean state between tests

Execute task following Skill rules and examples in SKILL.md.
