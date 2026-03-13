# Loading Gotchas

- Accessing nested fields behind ID presence without `$isLoaded` checks.
- Treating `ensureLoaded()` as in-place mutation instead of resolved-copy API.
- Calling `ensureLoaded()`/`subscribe()` on union members before discriminator narrowing.
- Query-first startup in flows that require lossless update capture.
- Forgetting unsubscribe handlers and leaking duplicate listeners.
- Using `$each` broadly and paying avoidable startup latency.
