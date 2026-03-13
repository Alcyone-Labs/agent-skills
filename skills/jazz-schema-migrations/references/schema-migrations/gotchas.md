# Schema Gotchas

- Non-additive schema changes during mixed-client rollout.
- Expensive migration logic that runs on every load without early exit.
- Assuming all clients can write migrations.
- Forgetting to load nested fields before migration checks.
- Ignoring many-to-many consistency as an application-level responsibility.
