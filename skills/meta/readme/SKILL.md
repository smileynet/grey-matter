---
name: readme
description: "Keep README.md honest and current: what the project is, how to install and use it, its status. Use at release time or when the README has drifted from reality."
---

# Readme

Keep `README.md` an accurate front door. Where the changelog is **history** (what changed,
version by version), the README is **current state**: what the project is, how to install
and use it, where to start, and its status *right now*. It drifts silently as the project
moves, this skill catches the drift.

Invokable on its own, and called by `release` to catch drift before a release ships.

## What to check (against reality, not against the old README)

Read the README, then verify each claim against the actual repo:

- **Identity**: does the one-liner still describe what the project is? (scope creep or
  pivots go stale here first).
- **Install / usage commands**: run or trace every command the README gives. A command
  that no longer exists, changed flags, or moved paths is the highest-value fix (a broken
  install line is the worst drift). Cross-check against the real scripts/entrypoints.
- **Feature / contents list**: does it match what's actually in the repo now? New
  top-level capabilities missing; removed ones still listed.
- **Structure/pointers**: do the links resolve and point where they claim? (dir names,
  doc paths, the "start here" pointer).
- **Status**: is the stated maturity/version honest? A "v0.1.0" or "early" line that's
  months behind the real state misleads.

## How to fix

- **Correct, don't pad.** Fix the stale claim; don't bloat the README with everything.
  A README earns trust by being short and true, not exhaustive.
- **Match the repo's voice.** Keep the existing tone and structure; this is maintenance,
  not a rewrite, unless the README is genuinely wrong about what the project is.
- **Report what changed.** When called by `release`, surface the drift you fixed (or
  found and left) so it's visible in the release prep, not silent.
- Full-bodied READMEs (diagrams, badges) follow `docs/agents/report-format.md`; most
  READMEs are plain markdown and stay that way.

## It's working if

- Every command in the README actually works as written.
- The one-liner and feature list match what the repo is and does today.
- Every link resolves.
- Nothing stale survives: no "coming soon" for a thing that shipped, no dead pointer.
