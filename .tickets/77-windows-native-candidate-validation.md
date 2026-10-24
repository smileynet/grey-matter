---
id: "77"
title: "Validate native release candidates on Windows"
status: open
blocked_by: ["69"]
spec: "release-readiness"
priority: high
validation_criteria:
  - "The exact candidate identities, archive SHA-256 values, native OS/architecture and client versions are recorded in committed evidence."
  - "Both plugin packages load with expected namespaces and exactly-once catalogs in every applicable native harness; unavailable clients are explicit blockers or approved exclusions."
  - "Native install, upgrade, repeated deploy, enable/disable and foreign-content preservation controls have command/output evidence."
  - "Applicable product, syntax, resource, invocation-policy and hook checks pass; unsupported checks are not counted as executed."
  - "A cited platform report and machine-readable evidence are committed, linked to ticket 70 and contain no publication or real user-state mutation."
tags: ["stream:tooling"]
---

# Validate native release candidates on Windows

## What to build

TBD

## Acceptance criteria

- [ ] TBD
