---
id: "30"
title: "Align harness and distribution documentation with verified behavior"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "All glossary links in tkt conventions resolve to the repository root glossary"
  - "Frontmatter, harness research, and distribution documents distinguish current findings from historical probe state"
  - "The structure-audit scope and findings match the current skill inventory or are explicitly archived"
tags: ["type:chore", "stream:tooling"]
---

# Align harness and distribution documentation with verified behavior

## What to build

The durable documentation must give a fresh agent one accurate account of harness behavior,
distribution, and the repository's review/audit scope, without stale provisional claims or
broken navigation.

## Context

Found during the 2026-10-19 repository review. `docs/agents/tkt-conventions.md` links
`../GLOSSARY.md`, which resolves to a nonexistent `docs/GLOSSARY.md`; the glossary is at
the repository root. `docs/agents/skill-frontmatter.md` still contains a pre-probe
backlog stating Codex/Kiro behavior is unverified, while ticket 14 and
`docs/agents/research/harness-behavior-probes.md` record live results. Ticket 14 itself
says Claude Code/OpenCode were deferred, although the research records later live probes.
The distribution proposal and `docs/agents/skill-reviews/STRUCTURE-AUDIT.md` also retain
historical claims without declaring their scope.

Read first: `docs/agents/tkt-conventions.md`, `GLOSSARY.md`,
`docs/agents/skill-frontmatter.md`, `docs/agents/research/harness-behavior-probes.md`,
`.tickets/14-spike-harness-behavior-proofs.md`, and
`docs/agents/proposals/03-distribution-packaging.md`.

## Out of scope

Do not rerun harness probes unless a documentation contradiction cannot be resolved from
the existing recorded evidence.

## Acceptance criteria

- [ ] All links to the shared glossary from the tkt conventions resolve to `GLOSSARY.md` at the repository root.
- [ ] Frontmatter, probe research, ticket 14, and distribution documentation distinguish current verified behavior from historical/provisional statements.
- [ ] The structure audit either covers the current inventory or is explicitly marked as a dated historical audit.
- [ ] A fresh-reader check finds no conflicting claim about which harnesses were probed live.
