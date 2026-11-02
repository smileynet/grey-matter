---
id: "152"
title: "Scope project commit gates to vital, changed parts and bound verification scratch"
status: in_progress
blocked_by: []
priority: high
validation_criteria:
  - "init-project and adopt-project scaffold a change-scoped commit gate: an authored path-to-check scope file plus a small mechanical selector, not a full suite on every commit."
  - "The guidance states the defaults: gate files run the gate's own tests, dependency pins run everything, docs/tickets/art run nothing, and the full gate runs before a release or device build."
  - "conformance-audit flags a pre-commit hook that runs the full suite unconditionally, and a scratch directory with unbounded run history."
  - "Critic and reconcile guidance says an owner's explicit decision ends a deliberation chain; heavy evidence belongs to data and acceptance risk, not tooling ergonomics."
  - "Guidance tells agents that a hook failing on a check unrelated to the change is a gate-scope bug: propose moving the check to a later stage instead of debugging or time-boxing it in the hook."
  - "node scripts/gate.mjs pre-merge passes."
---

# Scope project commit gates to vital, changed parts and bound verification scratch

## Intent source

Owner request on 2026-10-31 from a tagalog-helper session: "fix the precommit gate: it should be laser focused on only vital project parts and only when those parts change", then "file ticket with grey-matter on gate issues and cleanup".

## What happened (evidence from tagalog-helper)

- Its pre-commit hook ran the full 32-stage host profile on every commit: 6–8 minutes, including docs-only, dashboard and ticket commits, and every `tkt new` and `tkt close`. About 75% of that was Python, mostly three native-worker suites (about 250s) that only matter when persistence Swift files change.
- Reducing it had stalled behind five tickets of pilots, ledgers, identity binding and critic gates: #172 publication-only shadow pilot, #174 promotion decision, #175 setup profiling, #176 result reuse, and #167 candidate integrity. The process treated a tooling-ergonomics change like a data-integrity risk.
- The fix, in tagalog-helper commit `bf9726e`:
  - `scripts/commit-scope.json` names vital areas (deck, Python/TypeScript mirror, engine, native persistence, iOS bundle, gate) with path globs and catalog stage ids. `scripts/commit_gate.py` (about 90 lines) matches staged paths and runs only those stages through the existing runner.
  - Dependency pins run full. Gate files run the gate's own tests. Everything else commits with no checks.
  - Result: docs commits take 0.3s, the gate's own change took 43s, and full stays available via `scripts/check.sh`.
- Cleanup: tagalog-helper `.scratch` reached 32 GB. Every gate run directory (35 kept) and every prepared Simulator run (about 57 MB of app each, plus derived data) was kept forever. #97 defined a retention rule, but nothing in an adopted repo enforces it.

### Addendum (2026-11-01, philippines-trip retro)

grey-matter's own pre-push hook blocked ticket-only commits on a footprint test (#151). Sam: "it's a matter of not gating things that aren't critical", not time limits. A hook that fails on a check unrelated to the change is a gate-scope bug.

## What to build

- **init-project and adopt-project:** a reference pattern for change-scoped commit gates. It covers:
  - a scope file shape (`areas[].paths`, `areas[].stages`, `full_triggers`);
  - a selector that only reads staged paths and calls the project's existing runner;
  - a forced-full override;
  - the release/full-gate rule.
  Keep judgment (which areas are vital) in the authored scope file, per the automation boundary.
- **conformance-audit:** detect an unconditional full-suite pre-commit hook. Measure scratch size and stale run families against #97's bounded-history rule.
- **Critic, reconcile and implement guidance:** proportionality. An owner's explicit decision closes a deliberation chain. Do not create pilot or decision tickets for reversible tooling changes. Reserve multi-stage evidence for learner data, acceptance and release risk.

## Acceptance criteria

- [ ] The scaffolded pattern and its defaults are documented with a worked example (tagalog-helper's scope file can seed it).
- [ ] conformance-audit reports unconditional full hooks and unbounded scratch, with the measured size.
- [ ] The proportionality rule is in the owning skill and referenced, not restated, by the others.
- [ ] `docs/agents/local-gates.md` (or the owning skill) tells agents: when a hook fails on a check unrelated to the change, propose moving that check to a later stage; do not debug or time-box it in the hook.
- [ ] `node scripts/gate.mjs pre-merge` passes.

## Out of scope

Result caching and automatic risk scoring. Per-project vital-area choices stay authored in each project.

## Progress 2026-11-01 (proposal 18 steps 3 and 4, commit 636afaa)

- Done: the change-scoped pattern is `gates.json` plus a vendored `gate.mjs` (scope prefixes,
  `full_triggers`, `SKIP`, a stage per check); docs, tickets and art match no scope and run
  nothing; dependency pins and gate files are full triggers. `local-gates.md` documents it with an
  illustrative example shaped on tagalog-helper (its real `commit-scope.json` is not in the local
  clone, so the values are not its own). Pre-commit is not a stage at all.
- Done: `conformance-audit` reads the phase line, the vendored `gate.mjs` version and the
  local-gates findings list (blocking or full-suite pre-commit, over-budget or unscoped checks,
  hosted CI on every push, scratch that keeps every run).
- Done: the proportionality rule ("changing a gate is a reversible tooling change") lives in
  `local-gates.md`.
- Left: pointers to that rule from the critic and `reconcile-tickets` guidance, and
  `conformance-audit` reporting scratch with its measured size (it names the finding but does not
  yet call `inspect-footprint.mjs` for the size).
- The last criterion now reads `node scripts/gate.mjs pre-merge`; `check-repo.mjs` is retired.

## Found 2026-11-01 (retro of session b4dc5e5f)

`node scripts/gate.mjs pre-push` run before committing printed `0 of 5 check(s) selected (0 changed path(s))` and exited 0 while the working tree held unjudged changes, which reads as a pass. When nothing is selected and `git status --porcelain` is non-empty, it should say that uncommitted changes were not checked.
