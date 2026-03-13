# API Reference

## Worker Bootstrap APIs

- `startWorker({ AccountSchema, syncServer, accountID, accountSecret })`
- `startWorker({ ..., asActiveAccount: false })`

## Multi-Surface Reading APIs

- `useAccount(AccountSchema, { resolve })`
- `useCoState(Schema, id, { resolve, unstable_branch })`
- `value.$jazz.ensureLoaded({ resolve })`
- `value.$jazz.subscribe(listener)`

## Branch and Merge APIs

- `unstable_branch: { name }`
- `value.$jazz.branchName`
- `value.$jazz.isBranched`
- `value.$jazz.unstable_merge()`

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - server worker setup and credentials handling
  - branch creation, merge scope, and account/group caveats
