# Distributed Sync with Jazz

## Mental Model

Jazz is a local-first distributed graph of CoValues rooted in accounts.

- Account is the graph root for per-user traversal.
- `root` typically anchors private user graph.
- `profile` typically anchors public-ish identity graph.

Do not model Jazz as server-authoritative rows with cache replicas.

## Design Implications

- Eventual consistency is expected.
- Convergence is automatic for CoValue state, but domain invariants still require application logic.
- Inverse relationships are explicit; Jazz will not infer them.

## Critical Caveat

Many-to-many consistency is your responsibility:

- if A links B and B must link A, enforce both writes in domain logic
- validate and repair drift paths over time
