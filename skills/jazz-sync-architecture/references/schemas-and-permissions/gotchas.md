# Gotchas

- **Treating `co.list` as unique set**
  - Lists allow duplicates; enforce uniqueness via `co.record` when required.

- **Modeling many-to-many without maintenance logic**
  - Jazz will not auto-maintain consistency across both relation sides.

- **Hiding identity boundaries**
  - Blurring account `root` and `profile` semantics creates permission leaks and migration confusion.

- **Skipping explicit ownership at creation**
  - Default ownership may be correct for simple cases but can become wrong for collaboration and sharing requirements.

- **Assuming account ownership stays flexible**
  - Account-owned values are rigid and are a poor fit for future collaboration.

- **Assuming schema mutations are free**
  - Every published field shape affects long-term compatibility and migration load.

## Evidence Anchors

- `/Users/nemb/Downloads/llms-full.txt`
  - many-to-many and uniqueness caveats
  - schema evolution implications
  - group-first ownership guidance
