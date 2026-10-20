---
id: "30"
title: "Align harness and distribution documentation with verified behavior"
status: done
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

- [x] All links to the shared glossary from the tkt conventions resolve to `GLOSSARY.md` at the repository root.
- [x] Frontmatter, probe research, ticket 14, and distribution documentation distinguish current verified behavior from historical/provisional statements.
- [x] The structure audit either covers the current inventory or is explicitly marked as a dated historical audit.
- [x] A fresh-reader check finds no conflicting claim about which harnesses were probed live.

## Resolution (2026-10-20)

Aligned harness + distribution docs with verified behavior. (1) Fixed the broken glossary links in tkt-conventions.md (../GLOSSARY.md -> ../../GLOSSARY.md; both now resolve to the repo-root GLOSSARY.md). (2) Replaced the pre-probe hedges in skill-frontmatter.md with the verified live findings and updated the Kiro row + known-wart note; updated the distribution proposal's [verify] cells to 'verified live (ticket 14)' with a dated note. (3) Marked STRUCTURE-AUDIT.md as a dated 10-skill-era snapshot pointing at the live mechanical checks. (4) Added a currency note to harness-behavior-probes.md making it authoritative over ticket 14's frozen resolution (which predates the live Claude Code/OpenCode probes). Committed 057c9fc, pushed.

### Verification
1. ✓ All glossary links in tkt conventions resolve to the repository root glossary — "Both glossary links in docs/agents/tkt-conventions.md now use ../../GLOSSARY.md; Resolve-Path confirms they resolve to D:\code\grey-matter\GLOSSARY.md, and no ../GLOSSARY.md (one-level) link remains in docs/agents."
2. ✓ Frontmatter, harness research, and distribution documents distinguish current findings from historical probe state — "skill-frontmatter.md's 'Open backlog check' + reference-impl hedges are replaced by a 'verified live (ticket 14)' section citing harness-behavior-probes.md; the Kiro table row and known-wart note now state the proven result; the distribution proposal's Kiro/OpenCode cells read 'verified live'. A grep for 'verify locally / not logged in / likely ignores' finds only historical-context mentions, no live stale claim."
3. ✓ The structure-audit scope and findings match the current skill inventory or are explicitly archived — "STRUCTURE-AUDIT.md opens with a 'Historical snapshot (dated ~2026-10, 10 skills)' marker; harness-behavior-probes.md carries a currency note superseding ticket 14's deferred-harness resolution, so a fresh reader finds one consistent account (Claude Code + OpenCode proven live), not a conflict."
