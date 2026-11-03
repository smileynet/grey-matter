---
id: "212"
title: "Preflight archive proof formats and recovery consumers before transfer"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Small offline fixtures reject incompatible proof and consumer inputs before transfer and preserve separate coverage verdicts"
  - "Applicable repository gates and independent review pass with explicit recovery limits"
tags: ["stream:test-verification"]
---

# Preflight archive proof formats and recovery consumers before transfer

## Intent source

Sam requested filing the accepted Tagalog Helper archive retrospective follow-ups on
2026-11-03. During that project's ticket 213, Python reproduction proofs were initially
parsed as JSON, an SSH command failed on quoting, and Apple-optimized PNGs needed a
compatible decoder. The operation eventually passed complete restoration. Project
ticket 215 now has a small bounded preflight and synthetic regression fixtures; this
ticket captures the portable guidance rather than making grey-matter depend on it.

## Read first

- skills/meta/repository-artifact-hygiene/SKILL.md
- skills/meta/repository-artifact-hygiene/references/retention-lifecycle.md
- skills/productivity/delivery-dashboard/references/publication-preflight.md
- .tickets/205-dashboard-publication-preflight.md
- .tickets/115-preservation-evidence.md

## What to build

Add a short pointer and disclosed cold-archive reference to the existing artifact-hygiene
owner. Before a costly transfer, check the actual producer/consumer proof contract and
representative recovery formats with tiny task-owned inputs. Distinguish opaque bytes,
structured JSON and completed directory generations; verify recursively referenced
bindings before parsing reports or running supplied probes. Treat missing, changed,
unsealed, malformed or incomplete evidence as a failed or explicitly uncovered check.

Smoke-test the exact reviewed command construction and representative decoder capability,
including platform-specific formats such as Apple CgBI PNG. Bound time, output, bytes and
temporary artifacts. Record proof, command and consumer coverage separately. Preserve
the existing full post-transfer hash verification, cold restoration and distinct local
retirement authorization. A successful smoke check is not complete recovery evidence.

Prefer a small reference and realistic offline fixtures using existing project tooling.
Do not copy the historical project retirement executor, add a global command runner or
require Tagalog's Python/Node runtime across projects. Closed #205 verifies dashboard
publication inputs; it explicitly does not verify archives or remote uploads.

## Acceptance criteria

- [ ] Artifact-hygiene guidance names the typed proof and representative command/decoder preflight before costly transfer, with one maintained reference owner.
- [ ] Small offline scenarios cover mixed opaque/JSON/generation proofs, nested missing/changed/unsealed bindings and malformed required inputs; invalid proofs stop all dependent probes.
- [ ] Representative standard and platform-specific decoder scenarios distinguish compatible decoding from header recognition or a zero exit alone.
- [ ] Guidance bounds command duration/output and task-owned temporary resources while preserving separate proof, command and consumer coverage.
- [ ] Full archive verification/restoration, privacy, ownership and retirement authorization remain separate requirements; no live transfer or deletion is needed to verify this ticket.
- [ ] Applicable repository gates and independent review pass, with actual coverage limits stated.

## Related work and limits

Coordinate with #144 for nested payload membership and #139 for ticket/dashboard
projection checks. Existing #115 supplies preservation-evidence boundaries. These are
related scopes, not dependency claims. This filing contains no private media, hosts,
credentials or source manifests and is self-contained without private project access.
