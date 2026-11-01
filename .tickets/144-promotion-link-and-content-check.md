---
id: "144"
title: "Artifact hygiene rewrites relative links and screens privacy and copyright when promoting scratch"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Moved files keep working links"
  - "Promotion screens private and third-party material"
tags: ["stream:tooling"]
---

# Artifact hygiene rewrites relative links and screens privacy and copyright when promoting scratch

## Origin

Field report from philippines-trip, 2026-11-01. Promoting 73 research captures from `.scratch/research/` into `.memory/research/...` broke two relative links that had been written for the old location (`../../.memory/...`); a writing review that claimed "links resolve" had to be redone. Promotion also needed a privacy screen (booking/reservation terms were all public venue facts) and a copyright screen (raw menus, charters and saved pages were left local).

## Acceptance criteria

- [ ] repository-artifact-hygiene's promotion step rewrites or checks relative links after a move and fails on broken ones.
- [ ] It screens promoted text for private data patterns and flags third-party raw documents (PDF, saved HTML, menu/charter dumps) to keep local with a cited source instead.
- [ ] A provenance README template for promoted capture folders.
