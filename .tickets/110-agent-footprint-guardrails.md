---
id: "110"
title: "Keep agent footprint bounded while work runs, not only at ticket close"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "global/AGENTS.md carries the three footprint lines and stays under the 3,072 B budget; node scripts/check-guidance.mjs and node scripts/install-agents-md.mjs (dry run) show only that change."
  - "repository-artifact-hygiene has a While you work section, a description trigger on disk-growing actions, and references/footprint-by-os.md for macOS, Linux, Windows and WSL; no second skill states the rule."
  - "scripts/inspect-footprint.mjs reports size, owning ticket status, exact-path citations with a keep list, hard links and open files; skips active worktrees; takes a quiet floor (15 minutes by default, 24 hours for agent state); its fixture test goes red on each seeded problem and green once clean."
  - "A citation that appears after the list was made turns a removal into a 'keep list changed' result."
  - "conformance-audit flags a pytest project with no tmp_path_retention_policy and tracked manifests that cite .scratch paths."
  - "orient prints free space and, under 40 GiB, the three largest uncommitted footprints."
  - "docs/agents/test-environment-ladder.md defines tiers 0-5 with cost, what only each tier catches and default cadence; tdd, implement, implement-spec, the game-native-design engine references, init-project and conformance-audit point at it."
  - "node scripts/check-repo.mjs passes."
tags: ["type:feature", "stream:tooling"]
---

# Keep agent footprint bounded while work runs, not only at ticket close

## What to build

Implement [proposal 16](../docs/agents/proposals/16-agent-footprint-guardrails.md) after its
decisions are made. Ticket 97's close rule stays the owner of the retention policy; this adds the
rule at the time of creation, the read-only inspector, the always-on lines, and the checks for
adopted repos.

## Decisions (settled 2026-10-31)

Recorded in full in the proposal's Decisions section.

1. Owner: `repository-artifact-hygiene`, no new skill; triggers name the kind of action, and size
   is measured after the first attempt, never predicted.
2. Numbers: fixed 500 MiB per attempt, latest 3 attempts, 20 GiB floor, optional 5 GiB per-ticket
   cap, overridable by inspector flags; no disk-size scaling. WSL checks the lower of the distro
   and its Windows drive; on Windows, files over the Recycle Bin cap are listed, never deleted.
3. Always-on: three lines in `global/AGENTS.md`, worded the same for every OS, under budget.
4. `--dedupe` stays opt-in.
5. `orient` line now: free space; three largest uncommitted footprints under 40 GiB.
6. Conformance: pytest retention only (plus `.scratch` citations in tracked manifests).
7. Per-OS commands in `references/footprint-by-os.md`; the inspector reports a missing probe as
   partial coverage.
8. The test-environment ladder (proposal P7) is built in this ticket.

The port source (`removal-final.py`) is untracked on the Mac and absent from the Linux host, so
the inspector is written from the proposal's description of its logic.

## Context

During 2026-10-23 to 2026-10-30 one Mac received 166 GiB of new files, 69 GiB of them in code
folders, and free space fell to 0.18 GiB while tickets were still open. The close rule alone cannot
help while a ticket is open. See the proposal's evidence section.

## Resolution (2026-10-31)

done: three always-on footprint rules (global/AGENTS.md, OS-neutral); repository-artifact-hygiene While you work section, per-OS reference and read-only inspect-footprint.mjs with 7 fixture tests wired into check-repo group 13; conformance-audit pytest and .scratch-citation checks; orient free-space line; test-environment ladder (proposal P7, folded in by user decision) with pointers from six skills. Proposal 16 decisions recorded 2026-10-31. Port source removal-final.py was absent from this host, so the inspector follows the proposal's description of its logic. Artifacts: four research files promoted to docs/agents/research/*-20261031.md; scratch gate logs deleted; nothing kept. Not verified: Windows and macOS command rows (docs or secondary sources, marked in the reference); install-agents-md run as dry run only; deploy.mjs not run because the branch is unmerged.

### Verification
1. ✓ global/AGENTS.md carries the three footprint lines and stays under the 3,072 B budget; node scripts/check-guidance.mjs and node scripts/install-agents-md.mjs (dry run) show only that change. — "global/AGENTS.md 1913 B of 3072 B; node scripts/install-agents-md.mjs --dry-run: 4/4 targets 'update', diff is only the three + lines; node scripts/check-guidance.mjs: 1 error + 5 judgment, identical to the baseline from 11506bd (spellbook config path), no new finding"
2. ✓ repository-artifact-hygiene has a While you work section, a description trigger on disk-growing actions, and references/footprint-by-os.md for macOS, Linux, Windows and WSL; no second skill states the rule. — "repository-artifact-hygiene SKILL.md: While you work section (7 rules + inspector), description branch 'before a build, test run, simulator, download, clone or copy of tracked files grows the disk', references/footprint-by-os.md covers Linux, macOS, Windows, WSL and tool caches; no other skill states the rule (orient, conformance-audit and the ladder point at it)"
3. ✓ scripts/inspect-footprint.mjs reports size, owning ticket status, exact-path citations with a keep list, hard links and open files; skips active worktrees; takes a quiet floor (15 minutes by default, 24 hours for agent state); its fixture test goes red on each seeded problem and green once clean. — "node --test scripts/inspect-footprint.test.mjs: 7/7 pass (size, ticket status, exact-path keep list, hard link, open file via /proc, epoch file, active worktree skip, prune, quiet floor 15m/24h, cap and floor red, clean tree green); mutation: disabling open-file or recheck detection turned 1 test red each, restored 7/7"
4. ✓ A citation that appears after the list was made turns a removal into a 'keep list changed' result. — "test 'a citation added after the list was made turns removal into keep list changed': outcome 'keep list changed', finding keep-list-changed, CLI exit 1"
5. ✓ conformance-audit flags a pytest project with no tmp_path_retention_policy and tracked manifests that cite .scratch paths. — "test 'conformance flags pytest without retention and tracked .scratch citations': finding true, then false after adding tmp_path_retention_policy; conformance-audit SKILL.md maps pytestRetention to the safe tier and scratchCitations to needs-judgment"
6. ✓ orient prints free space and, under 40 GiB, the three largest uncommitted footprints. — "orient SKILL.md runs inspect-footprint.mjs --summary; on this host it printed 'free 17.3 GiB (floor 20.0 GiB: under, stop adding data); largest uncommitted: <three scratch folders with sizes>' and exited 1"
7. ✓ docs/agents/test-environment-ladder.md defines tiers 0-5 with cost, what only each tier catches and default cadence; tdd, implement, implement-spec, the game-native-design engine references, init-project and conformance-audit point at it. — "node scripts/check-repo.mjs: exit 0, all 16 groups ok (baseline: group 3 failed on proposal 16's own .scratch citation, fixed); group 13 30/30 tests pass"
8. ✓ node scripts/check-repo.mjs passes. — "docs/agents/test-environment-ladder.md: tiers 0-5 with cost, what only each catches, default cadence and a when-to-run table; linked from tdd, implement, implement-spec, game-native-design godot.md and unreal.md, init-project, conformance-audit; docs consistency check passes"
