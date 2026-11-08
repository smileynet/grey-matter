---
id: "283"
title: "Document register_personal.sh Windows .cmd failure; capture upstream bug report"
status: in_progress
blocked_by: []
validation_criteria:
  - "harnesses.md Kimi section documents symptom and .py workaround"
  - "ticket body carries paste-ready bug report"
  - "close-out records upstream-report outcome"
tags: ["type:chore"]
---
## What to build

Record the Kimi plugin-builder `register_personal.sh` Windows failure and its
workaround in the Kimi section of `docs/agents/harnesses.md`, and capture the
bug report text so the owner can submit it through the client's feedback
channel (the plugin-builder is bundled with the desktop client; no public
issue tracker is known to us).

**Bug (observed 2026-11-08):** `register_personal.sh` aborts with
`Error: the kimi-daimon at DAIMON_RUNTIME_BINARY_PATH is not executable: ...\kimi-daimon.cmd`.
Its executability test (`-x`-style) rejects the Windows `.cmd` launcher under
Git Bash. The sibling `register_personal.py` works correctly on the same
machine and was used successfully for both registrations.

**Workaround (document this):** on Windows, use
`python scripts/register_personal.py <plugin-dir>` instead of the bash script.

**Upstream report:** the agent cannot submit client feedback; the ticket body
carries the report text for the owner to paste. Closing records whether the
owner submitted it (link/channel reference) or decided not to.

## Acceptance criteria

- [ ] `harnesses.md` Kimi section documents the failure symptom and the `.py` workaround
- [ ] Ticket body carries a paste-ready bug report (symptom, repro, expected/actual)
- [ ] Close-out records the upstream-report outcome (submitted / declined)
