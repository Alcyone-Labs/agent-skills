# Implementation Patterns

## Pattern 1: Canonical store + derived indexes

Use one canonical record plus lightweight secondary views:

1. Write the canonical CoValue once.
2. Add list/record indexes for UI grouping or ordered display.
3. Rebuild derived indexes when drift is detected.

This keeps write paths simple while preserving fast reads.

## Pattern 2: Ownership-first collaboration setup

```ts
const group = Group.create();
group.addMember(otherAccount, "writer");

const sharedDoc = Document.create({ title: "Spec" }, { owner: group });
```

## Pattern 3: Set-like relations with records

When uniqueness matters, prefer `co.record` keyed by referenced ID/hash instead of list duplicates.

## Pattern 4: Defensive many-to-many maintenance

- If using lists at both ends of a relation, update both ends in one app-level transaction flow.
- Add repair/validation jobs for backfill consistency.

## Pattern 5: Group-first defaults

- Let default or explicit creation paths produce group-owned values.
- Reserve account ownership for rigid private data that should never gain collaborators.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - many-to-many and uniqueness guidance
  - group ownership and inline creation rules
