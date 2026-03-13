# Configuration

## Account Schema Baseline

```ts
export const AppRoot = co.map({
  myChats: co.list(Chat),
  myBookmarks: co.optional(co.list(Bookmark)),
});

export const AccountSchema = co.account({
  profile: co.profile({ name: z.string() }),
  root: AppRoot,
});
```

## Practical Modeling Policy

- **Record + list hybrid**
  - record: O(1) key lookup and uniqueness constraints
  - list: stable rendering order and virtualization-friendly iteration
- **Optional fields for evolvability**
  - avoid hard breakage for old clients

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - account `root`/`profile` migration examples
  - schema definitions and evolution context
