# Jazz Schema and Migrations

This skill helps you evolve Jazz schemas without stranding older clients.

## What it covers

- CoValue constructor choice by access/update pattern
- Ownership and sharing boundaries at creation time
- Account vs CoMap migration lifecycle differences
- Versioning and additive evolution policy
- Mixed-version compatibility with optional fields and discriminated unions

## Guardrails

- Prefer additive changes.
- Make new fields optional by default.
- Use explicit version fields.
- Assume some clients cannot run migration writes.
