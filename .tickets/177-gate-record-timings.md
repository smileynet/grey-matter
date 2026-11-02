---
id: "177"
title: "gate.mjs --record writes measured timings into gates.json"
status: in_progress
blocked_by: []
validation_criteria:
  - "--record updates only measurements for passed checks, to 0.1 seconds with the local date and supported host name, preserving other bytes."
  - "Failed, skipped and timed-out checks retain their old measurements."
  - "Gate CLI regression fixtures cover recording and node scripts/gate.mjs pre-merge passes."
tags: ["stream:tooling"]
---
# gate.mjs --record writes measured timings into gates.json

## Intent source

Session retro, 2026-11-01. Every `measured` value in `scripts/gates.json` was patched by hand with
PowerShell `.Replace()` on the JSON text after a gate run; `docs/agents/windows-powershell-gotchas.md`
already records `json.dump` reformatting this same file. Admission rule 3 in
`docs/agents/local-gates.md` requires a measured, dated time per check, so the edit recurs on every
admission and re-measure, and vendoring projects inherit the chore.

## Context

`scripts/gate.mjs` already prints each check's time and warns when it exceeds `measured`; it has no
way to write it. Keep the file's formatting: replace only each recorded check's `measured` object.

## Acceptance criteria

- [ ] `node scripts/gate.mjs <stage> --record` rewrites `measured` (seconds to 0.1, today's date, host
      `win`/`mac`/`linux`) for each check that passed in that run, and leaves every other byte unchanged.
- [ ] A failed, skipped or timed-out check keeps its old `measured`.
- [ ] `scripts/gate.test.mjs` covers both; `node scripts/gate.mjs pre-merge` passes.

## Local preparation 2026-11-02

Reserved by the test-optimization chat. Native `tkt claim` auto-pushes this branch, which currently
contains unverified #137/#176 changes. The local lifecycle edit avoids publishing them while required
gates are timing out under host memory pressure. Publish the claim with the verified work; do not close
until the required checks pass.
