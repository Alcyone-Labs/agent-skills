# Implementation Patterns

## 1. Local-first write, sync-second confirmation

```ts
const task = Task.create({ title: "Draft architecture", done: false });
task.$jazz.set("done", true);

// Optional guardrail for tests or must-persist flows
await task.$jazz.waitForSync();
```

Use this when UX must feel instant but you still need deterministic persistence
checkpoints.

## 2. Deep resolve for stable component boundaries

```ts
const me = useAccount(MyAccount, {
  resolve: {
    root: {
      projects: {
        $each: { tasks: true },
      },
    },
  },
});
```

Use this when child components need fully loaded nested fields at first render.

## 3. Ownership-first creation flow

1. Create owner group
2. Create CoValue with explicit owner
3. Attach reference from account root graph

```ts
const group = co.group().create();
const item = Project.create({ name: "Q1 Plan" }, { owner: group });
me.root.projects.$jazz.push(item);
```

## 4. ID-driven collaboration routes

- Put CoValue IDs in URLs or route state
- Load/subscribe by ID
- Let peers join same collaborative node directly

```ts
const sharedId = new URLSearchParams(location.search).get("id");
const project = useCoState(Project, sharedId!, { resolve: { tasks: true } });
```

## 5. Record key discovery then on-demand item hydration

- Shallow-load record to get keys fast
- Hydrate specific records lazily as needed
- Reserve `$each` for genuinely immediate full-list reads

## Evidence Anchors

- `https://jazz.tools/llms-full.txt`
  - Deep resolve + `$each` examples
  - `waitForSync` usage and subscription examples
  - CoRecord loading strategy guidance
