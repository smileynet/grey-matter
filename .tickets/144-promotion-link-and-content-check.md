---
id: "144"
title: "Artifact hygiene rewrites relative links and screens privacy and copyright when promoting scratch"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Moved files keep working links"
  - "Promotion screens private and third-party material"
  - "Nested whole-artifact contents are reconciled with authored exclusions and reviewed unique or unknown payload before promotion or archive transfer"
tags: ["stream:tooling"]
---

# Artifact hygiene rewrites relative links and screens privacy and copyright when promoting scratch

## Origin

Field report from philippines-trip, 2026-11-01. Promoting 73 research captures from `.scratch/research/` into `.memory/research/...` broke two relative links that had been written for the old location (`../../.memory/...`); a writing review that claimed "links resolve" had to be redone. Promotion also needed a privacy screen (booking/reservation terms were all public venue facts) and a copyright screen (raw menus, charters and saved pages were left local).

## Acceptance criteria

- [ ] repository-artifact-hygiene's promotion step rewrites or checks relative links after a move and fails on broken ones.
- [ ] It screens promoted text for private data patterns and flags third-party raw documents (PDF, saved HTML, menu/charter dumps) to keep local with a cited source instead.
- [ ] A provenance README template for promoted capture folders.

## Accepted nested-archive follow-up — 2026-11-03

Sam requested filing the Tagalog Helper archive retrospective in grey-matter. Extend this
existing content-screening scope rather than creating a near-duplicate artifact ticket.
The source project's archive proposal excluded audio in its wording, but an old app
bundle contained 339 MP3 files, including 13 without a byte-identical retained-source
match. Those 13 were preserved privately before local retirement. The lesson concerns
recursive membership and preservation disposition, not permission to scan unrelated data.

Before proposing promotion or whole-directory transfer, reconcile all nested contents
with the authored exclusions, including app/package bundles. Expose media, databases and
unknown classes, compare actual retained-source hashes when claiming duplicate bytes,
and record an explicit disposition for unique or unknown payload. Filename extensions
are classification signals, not proof of purpose, recovery or disposability. Keep private
manifests private. Retain this ticket's original relative-link and provenance work.

Read the existing artifact-hygiene owner and inspectors first. The Git inspector's
documented no-worktree-walk boundary stays intact: private/ignored trees require their
own explicit scope or a project-owned adapter. Closed #181/#184 already own the
preservation-first prune recipe and stale preservation-state recheck; do not reopen or
duplicate those outcomes. #212 separately owns proof/decoder compatibility.

- [ ] A tiny nested app-bundle scenario exposes duplicate and unique media, a database and unknown content before promotion/transfer.
- [ ] A contradiction with an authored exclusion or an unreviewed unknown blocks the proposed move; unique content retains an explicit reviewed disposition.
- [ ] The guidance preserves separately scoped private/ignored inspection, the existing inspector's read-only/no-fetch behavior, and distinct transfer/deletion authorization.
- [ ] Applicable content-screening fixtures and repository gates pass without copying private data or performing a real archive.
