---
id: "200"
title: "Freeze the complete evaluation seed independently of host tooling"
status: done
blocked_by: ["199"]
priority: high
tags: ["stream:orchestration", "type:fix"]
validation_criteria:
  - "The selected runner produces the original c474646 seed without invoking live tkt or the mutable general fixture generator; full asset and extra-file checks pass."
  - "Independent exact-source review and current repository verification pass, including the full model-evaluation suite."
  - "Seed provenance, historical execution limits and owned artifact disposition are recorded, and the shared recipe reflects the repair."
---

# Freeze the complete evaluation seed independently of host tooling

## What to build

After #199 pinned the dashboard, a host tkt update changed generated AGENTS.md
from 3,326 to 3,426 bytes. The fixture guard correctly stopped setup, but the
selected recipe and its integration test still depended on live tool output.
The parent observed 14/15 tests passing with one setup failure before a model
call. This ticket captures the repair already prepared in an isolated worktree;
creation waited for a green parent gate to avoid tkt auto-pushing the failing tip.

Materialize all fifteen original fixture files from frozen, hash-checked inputs,
keeping tree c474646ea61e037fcdbc1be3d2dc6c0833f5e260. Remove live tkt/generator
dependencies from this selected evaluation path; keep the general generator
unchanged. Reject unexpected files and preserve independent grading and all
historical native execution/source identities.

## Acceptance criteria

- [x] All fifteen files produce the original tree without live tkt/generator inputs, with asset hashes and extra-file rejection checked.
- [x] Independent exact-source review and current gates pass, including the complete evaluation tests.
- [x] Provenance, artifact disposition and selected recipe reflect the repair without claiming new model execution.

## Resolution (2026-11-03)

done: materialized the complete hash-checked evaluation seed independently of host tooling and live templates, retaining pre-call drift checks and historical execution provenance

### Verification
1. ✓ The selected runner produces the original c474646 seed without invoking live tkt or the mutable general fixture generator; full asset and extra-file checks pass. — "Full seed source6825896 accepted by independent critic, integrated4441fed and pushed. Frozen manifest8779B embeds14files5807B and references45998B dashboard; all15 assemble original c474646 Git tree without live tkt/generator. Perasset SHA and unexpected staged/unstaged/ignored path checks run before native invocation; no model call in setup verification."
2. ✓ Independent exact-source review and current repository verification pass, including the full model-evaluation suite. — "Independent critic15/15 pass3.25s; worker15/15 pass3.44s. Root node scripts/gate.mjs pre-merge --base d1df498 --include skill-syntax-fixtures passed model-eval15tests4.1s andsyntax; prepush doc-links/home-path/gates-coverage passed. Finalmetadata ticketgraph+syntax anddoc/home passed. Audit6876a11 integrated2ca0ea1; diffcheckclean."
3. ✓ Seed provenance, historical execution limits and owned artifact disposition are recorded, and the shared recipe reflects the repair. — "eval-frozen-seed-20261102.md records committedseed provenance and setup-only limits; actual selectedrecipe16d62e2 accepted by critic. Historical nativehashes unchanged. Keep small frozenmanifest/dashboard inGit; existingtestlifecycle removed testroots. Parent117299B setup-onlytempfixture and559B probehelper OSrecycled; original167baselines/rawrecords and prior referenceclones untouched for pending nativeaudit."
