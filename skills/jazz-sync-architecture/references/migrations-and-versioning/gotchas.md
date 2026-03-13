# Gotchas

- **Assuming CoMap migrations can be async**
  - CoMap migrations run synchronously; async logic belongs elsewhere.

- **Ignoring write-permission constraints**
  - Readers cannot run write migrations; design forward-compatible schema paths.

- **Breaking published schemas**
  - Renaming/removing/changing field types can strand old clients.
  - Add fields instead; prefer optional defaults.

- **Failing to load before checking nested keys**
  - `has()` on unloaded nested structures can lead to incorrect migration logic.
  - Use `ensureLoaded()` before nested migration checks.

- **Version field drift without observability**
  - Without version checks and diagnostics, silent drift can persist in production.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - CoMap migration sync-only note
  - migration permission caveats
  - add-only schema guidance
