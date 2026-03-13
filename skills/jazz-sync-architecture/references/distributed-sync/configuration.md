# Configuration

## Sync Topology Options

### Jazz Cloud (default)

```ts
sync: {
  peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
  when: 'always', // also supports 'never' and 'signedUp'
}
```

### Self-hosted sync server

- Run: `npx jazz-run sync`
- Default endpoint: `ws://localhost:4200`

## Provider or Context Setup

### React-style provider

```tsx
<JazzReactProvider
  sync={{ peer: `wss://cloud.jazz.tools/?key=${apiKey}`, when: "always" }}
  AccountSchema={MyAccount}
>
  {children}
</JazzReactProvider>
```

### Vanilla-style browser context manager

```ts
import { JazzBrowserContextManager } from "jazz-tools/browser";

await new JazzBrowserContextManager().createContext({
  sync: { peer: `wss://cloud.jazz.tools/?key=${apiKey}` },
  storage: "indexedDB",
  AccountSchema: MyAccount,
});
```

## Environment Variables

- Vanilla: `VITE_JAZZ_API_KEY`
- React/Next.js: `NEXT_PUBLIC_JAZZ_API_KEY`
- Svelte: `PUBLIC_JAZZ_API_KEY`

## Baseline Account Schema Wiring

```ts
export const MyAccount = co
  .account({
    root: co.map({ items: co.list(Item) }),
    profile: co.profile({ name: z.string() }),
  })
  .withMigration((account) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", { items: [] });
    }
  });
```

## Evidence Anchors

- `https://jazz.tools/llms-full.txt`
  - Provider configuration (`sync.peer`, `when`, env keys)
  - Sync and storage section (cloud vs self-hosted)
  - Account migration bootstrap pattern
