---
id: "250"
title: "Scope the home-path gate to introduced leaks instead of historical evidence"
status: done
blocked_by: []
validation_criteria:
  - "Reproduce and confirm the existing full-tree failure on unchanged historical files before selecting a scoped fix."
  - "Unrelated clean pushes are not blocked by baseline paths; introduced home-path leaks still fail and historical evidence is preserved."
tags: ["stream:tooling", "kind:bug"]
---
## What to build

The all-checks review confirmed that scripts/check-home-path.mjs was introduced after an actual leak (21add82), not as a spike. Keep its purpose. Its always-on full-tree scan currently returns225 findings for unchanged historical data on this Mac, causing unrelated ticket/doc pushes to fail. The scanner walks every tracked file and only allowlists two Windows evidence files. Compare introduced paths or lines against the pushed base instead of requiring historical records to be rewritten. Preserve new-leak detection, failure honesty, and historical evidence. Sources: scripts/check-home-path.mjs, scripts/check-home-path.test.mjs, scripts/gates.json, docs/agents/local-gates.md.

## Acceptance criteria

- [x] Confirm the baseline scope failure with evidence and select a bounded correction.
- [x] Regression fixtures show new leaks rejected and unrelated historical evidence preserved without blocking clean changes.

## Resolution (2026-11-04)

done: one cheap pre-push guard now inspects added text in exact outgoing commit ranges, including intermediate commits and per-ref/new-ref history. Historical unchanged lines and renames no longer block unrelated work. Retired the ambient whole-checkout cleanliness assertion and filename exemptions; kept deterministic source-scoped fixtures. Whole-tree inventory is explicit --all only. Runner reference advanced to4 for its range contract. Artifact-hygiene remains an independent deferred Mac follow-up under175 and was explicitly skipped; no new host/platform gate was added. Small verification logs retained through next successful sync.

### Verification
1. ✓ Reproduce and confirm the existing full-tree failure on unchanged historical files before selecting a scoped fix. — "Before change, the full-tree checker returned exit1 with225 existing findings on a clean tree. After change the outgoing candidate scan examined1 commit,5 files and302 added lines with0 leaks; historical evidence files were not rewritten."
2. ✓ Unrelated clean pushes are not blocked by baseline paths; introduced home-path leaks still fail and historical evidence is preserved. — "Focused checker/runner suite35 passed,1 explicit platform skip. Fixtures cover old paths and same-file edits, new/previously exempt filenames, renames, merges, root/new refs, multi-ref pushes, invalid scope and reverted intermediate leaks. Pre-merge19 checks passed with only deferred artifact-hygiene skipped; all7 pre-push checks and the actual git push passed with no skips."
