# Loading Configuration

## First Paint Policy

- Resolve only critical shell data.
- Defer non-blocking branches to follow-up loaders.

## Subscription Policy

- Register subscriptions before initial snapshot when missing updates is unacceptable.
- Enforce unsubscribe in every teardown path.

## Performance Policy

- Ban global `$each` at startup on large records/lists.
- Prefer key/index shallow load + targeted deep loads.
- Batch expensive entry hydration.

## Error-State Policy

- Define explicit UI behavior for `unauthorized`, `unavailable`, and `deleted` states.
