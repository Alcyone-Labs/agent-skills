# Router Operating Model

`jazz-all-skills` exists to prevent incorrect first fixes.

The router does not solve deep domain work itself. It identifies where the truth most likely lives.

## Classification Inputs

Capture these before routing:

- Runtime topology (browser, service worker, dedicated worker, edge, native/webview)
- Symptom surface (startup failure, stale UI, migration drift, authorization/deletion state)
- Change context (new schema rollout, runtime migration, worker refactor)

## Routing Heuristics

- Failures that differ by environment first: runtime skill.
- Failures that differ by load depth or sequence: loading skill.
- Failures after model changes/version rollout: schema migration skill.
- Failures tied to worker authority boundaries, branch scope, or multi-surface sync: sync architecture skill.
- Failures with multiple competing hypotheses: sync architecture skill.
