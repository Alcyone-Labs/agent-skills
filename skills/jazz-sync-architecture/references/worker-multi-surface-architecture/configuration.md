# Configuration

## Worker Bootstrap Baseline

```ts
const { worker } = await startWorker({
  AccountSchema: MyWorkerAccount,
  syncServer,
  accountID: process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
});
```

## Surface Loading Policy

- Shell loads should request only the account/root/profile branches needed for first paint.
- Heavy records, lists, feeds, and nested references should load later via targeted resolve or `ensureLoaded()`.

## Branch Scope Policy

- Keep branch resolve exhaustive enough to cover every CoValue that must merge together.
- Avoid mixing branch-local reads with unrelated out-of-branch loads unless you pass the same branch context explicitly.

## Security Policy

- Store worker credentials in server/worker environment variables only.
- Do not expose worker account secrets to browser bundles, extension popups, or client-side logs.
