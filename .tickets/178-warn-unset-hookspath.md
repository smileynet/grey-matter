---
id: "178"
title: "Warn when grey-matter's own clone has no core.hooksPath, so pushes skip the pre-push stage"
status: done
blocked_by: []
validation_criteria:
  - "Default deploy/list prints one opt-in warning for this clone when its tracked pre-push hook is not selected, and stays quiet when selected."
  - "The warning never changes Git configuration and stays silent in consumer projects."
  - "node scripts/gate.mjs pre-merge passes."
tags: ["stream:tooling"]
---
# Warn when grey-matter's own clone has no core.hooksPath, so pushes skip the pre-push stage

## Intent source

Session retro, 2026-11-01. A static check failed and a chained command committed and pushed anyway;
the pipe and `;` traps recurred three times (docs/agents/windows-powershell-gotchas.md). The tracked
`.githooks/pre-push` would have blocked it, but it only runs once a clone sets
`git config core.hooksPath .githooks`, which proposal 18 keeps opt-in and nothing reminds anyone of.

## Context

Changing Git config stays the user's call (AGENTS.md working rhythm). The fix is a warning, not an
installer: `node scripts/deploy.mjs` (run after every guidance change) or the `orient` skill prints
one line when this checkout's `core.hooksPath` is not `.githooks`, naming the command to opt in.

## Acceptance criteria

- [x] With `core.hooksPath` unset in a grey-matter checkout, the chosen command prints one warning
      naming `git config core.hooksPath .githooks`; with it set, it prints nothing.
- [x] It never changes Git config itself, and stays silent in consumer projects.
- [x] `node scripts/gate.mjs pre-merge` passes.

## Local preparation 2026-11-02

Reserved locally alongside #177 while publishing the branch is gated on the unfinished #137/#176
verification. See [the local claim rationale](177-gate-record-timings.md#local-preparation-2026-11-02).

## Verification 2026-11-02

The new unset-hook regression failed before implementation, then all three focused hook tests
passed. They verify exactly one warning, byte-identical Git config, silence for relative/absolute
selected paths, consumer packs and nested vendored packs. Both review axes found no findings.
Candidate `67320db` completed all 19 pinned-base pre-merge commands; full hostile-config pre-release
also completed all 28, including deployer in 86.0 s. No Git configuration was changed by the warning.
The warning runs only on default install/list, preserving machine-readable check/audit output.
Focused test fixtures clean themselves; shared evidence belongs to #137/#176.

Deployment initially stopped on tkt's vendored-engine drift. Its clean checkout was fast-forwarded
to upstream, the canonical deployer copied to `tools/deploy.mjs`, and the applicable Node tooling
fixtures passed again (38 pass, one platform skip). Companion commit `3841188` is pushed. Both
packs then deployed successfully; the existing generic-icon warning remains advisory.

## Resolution (2026-11-02)

done: advisory opt-in hook reminder on default own-checkout deployment/listing. Both review axes clear. Canonical deployer synchronized to tkt; both packs deployed. Promoted verification evidence and recycled owned scratch; current deployment packages retained until next deploy. Optional strict host audit still reports three existing unowned-root findings and 46 inventory-only overlap notices; no duplicate/error finding, user-managed skills preserved.

### Verification
1. ✓ Default deploy/list prints one opt-in warning for this clone when its tracked pre-push hook is not selected, and stays quiet when selected. — "Focused unset-hook fixture failed before implementation, then passed. Default install/list warns exactly once for this checkout and recognizes relative/absolute selected tracked hook paths."
2. ✓ The warning never changes Git configuration and stays silent in consumer projects. — "Focused tests assert byte-identical Git config and silence in consumer and vendored packs; all three pass. No real repository configuration was changed."
3. ✓ node scripts/gate.mjs pre-merge passes. — "Candidate 67320db: pinned-base pre-merge completed 19 commands; hostile-config pre-release completed 28 commands. Companion tkt tooling: 38 pass, one platform skip after fast-forward and vendored sync; commit 3841188 pushed."
