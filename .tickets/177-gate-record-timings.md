---
id: "177"
title: "gate.mjs --record writes measured timings into gates.json"
status: done
blocked_by: []
validation_criteria:
  - "--record updates only measurements for passed checks, to 0.1 seconds with the local date and supported host name, preserving other bytes."
  - "Failed, skipped and timed-out checks retain their old measurements."
  - "Gate CLI regression fixtures cover recording and node scripts/gate.mjs pre-merge passes."
tags: ["stream:test-verification"]
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

- [x] `node scripts/gate.mjs <stage> --record` rewrites `measured` (seconds to 0.1, today's date, host
      `win`/`mac`/`linux`) for each check that passed in that run, and leaves every other byte unchanged.
- [x] A failed, skipped or timed-out check keeps its old `measured`.
- [x] `scripts/gate.test.mjs` covers both; `node scripts/gate.mjs pre-merge` passes.

## Local preparation 2026-11-02

Reserved by the test-optimization chat. Native `tkt claim` auto-pushes this branch, which currently
contains unverified #137/#176 changes. The local lifecycle edit avoids publishing them while required
gates are timing out under host memory pressure. Publish the claim with the verified work; do not close
until the required checks pass.

## Verification 2026-11-02

Six focused public CLI fixtures cover byte-preserving replacement/insertion, failed/skipped/timeout
retention, mixed outcomes across pushed tips, concurrent manifest edits and invalid UTF-8. Both
review axes found no remaining findings. Candidate `67320db` passed the complete gate-runner in
29.8 s through `node scripts/gate.mjs pre-merge --base d62347c` (19 selected commands complete).
The hostile-config pre-release run also completed all 28 commands; Windows platform skips remain.
No scratch artifact belongs exclusively to this ticket; shared gate evidence lives with #137/#176.

## Resolution (2026-11-02)

done: gate --record records only successful measurements while preserving manifest formatting. Standards/spec reviews found no remaining findings. Docs deployed; shared evidence promoted under docs/agents/research/evidence/test-optimization-20261102.json and owned scratch recycled. Current deployment packages kept until next deploy.

### Verification
1. ✓ --record updates only measurements for passed checks, to 0.1 seconds with the local date and supported host name, preserving other bytes. — "Public CLI fixtures verify replacement/insertion changes only measured bytes, preserves CRLF/Unicode and surrounding fields, writes 0.1-second precision/local date/host, and rejects concurrent edits or invalid UTF-8."
2. ✓ Failed, skipped and timed-out checks retain their old measurements. — "CLI fixture covers failed, skipped and timed-out retention; multi-tip fixture preserves prior measurement when any judged tip fails."
3. ✓ Gate CLI regression fixtures cover recording and node scripts/gate.mjs pre-merge passes. — "Six focused CLI fixtures pass; fresh node scripts/gate.mjs pre-merge --base d62347c completed 19 commands with gate-runner 29.8s. Full hostile-config pre-release completed 28 commands; Windows platform skips remain."
