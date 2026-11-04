---
id: "166"
title: "Refresh harnesses.md to the installed harness versions (first harness-changelog review)"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Harness overview versions and paths agree with current observed identities or state an explicit evidence limit"
  - "Changed command examples are verified without model calls or bypassing security holds"
  - "Documentation checks and applicable repository gates pass"
tags: ["stream:tooling","epic:outcome-orchestration"]
---

# Refresh harnesses.md to the installed harness versions (first harness-changelog review)

## What to build

Bring [harnesses.md](../docs/agents/harnesses.md) up to the versions recorded in [versions.json](../docs/agents/harness-surfaces/versions.json), working from the proposals in [the first harness-changelog review](../docs/agents/research/harness-changelog-review-20261101.md):

- **Codex:** the install is bun, not an fnm `.ps1` shim, at 0.166.0.
- **Claude Code:** bash examples call `claude.exe`, because the bare `claude` wrapper needs zsh. Version 2.1.316.
- **kiro-cli:** 2.37.0. Point to [kiro.md](../docs/agents/harness-surfaces/kiro.md) for flags rather than the kiro.dev CLI page.
- **agy:** version references settled at 1.4.12.
- **Crush:** installed (0.93.1); its user-level rules path is still unverified.

Each claim changed is re-probed on this machine, not copied from the review.

## Acceptance criteria

- [x] Every version and binary path in harnesses.md matches versions.json, or says why it differs.
- [x] Each changed test command was run once and its output read.
- [x] `node scripts/gate.mjs pre-push` passes.

## Outcome-driven orchestration coordination

Proposal 19 approved. This ticket retains harness-overview version refresh; #206 handles bounded observed reference contradictions. Preserve the Agy execution hold; do not run a broad harness probe to refresh this note.

## Resolution (2026-11-04)

Refreshed harness overview and portable executable paths from current observations, preserving explicit version/provenance/runtime limits and security holds. Independent Standards and Spec accepted exact integrated bytes; version/path/gate evidence and publication copies of reviews promoted under docs/agents/research/evidence/harness-166-20261104. Worker raw help/version/logs and original reviews retained parent-owned through authorized queue settlement and useful-proof disposition. Existing148/private171 histories remain separately protected; no model probes, settings changes or historical experiments restarted.

### Verification
1. ✓ Harness overview versions and paths agree with current observed identities or state an explicit evidence limit — "PASS: observed Codex0.166.0, Claude2.1.316, Kiro2.37.1 and Crush0.93.1; portable PATH observations promoted. Kiro manifest/reference2.37.0 gap explicit, Agy1.4.12 last-recorded under hold, Codex package/copy provenance and Crush global rules path remain unknown."
2. ✓ Changed command examples are verified without model calls or bypassing security holds — "PASS: five changed help qualifications printed the documented command grammar; no model invocation or Agy execution. Ordinary configured permission boundaries replace required bypass advice; historical containment failures remain recorded."
3. ✓ Documentation checks and applicable repository gates pass — "PASS: exact integrated b1b677f documents match independently reviewed6c2a783 blobs; explicit node scripts/gate.mjs pre-push passed2 selected checks, pre-merge syntax passed1, no skips. Final evidence push doc-links/home-path2 PASS. Guidance deployed50 with Agy/Crew skipped."
