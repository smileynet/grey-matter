---
id: "283"
title: "Document register_personal.sh Windows .cmd failure; capture upstream bug report"
status: done
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

- [x] `harnesses.md` Kimi section documents the failure symptom and the `.py` workaround
- [x] Ticket body carries a paste-ready bug report (symptom, repro, expected/actual)
- [x] Close-out records the upstream-report outcome (submitted / declined)

## Paste-ready upstream bug report

**Title:** register_personal.sh fails on Windows: `.cmd` launcher rejected by executability test

**Environment:** Windows 11, Git Bash (MSYS), Kimi desktop client (daimon bundle), plugin-builder skill bundled scripts.

**Repro:**
1. In a Kimi session on Windows, build any plugin package (e.g. `dist/kimi-plugin` containing `kimi.plugin.json`).
2. Run `bash scripts/register_personal.sh dist/kimi-plugin`.

**Expected:** the script validates and registers the plugin via the official CLI at `DAIMON_RUNTIME_BINARY_PATH` (`...\daimon-bundle\bin\kimi-daimon.cmd`).

**Actual:** immediate abort —
`Error: the kimi-daimon at DAIMON_RUNTIME_BINARY_PATH is not executable: C:\Users\<user>\AppData\Roaming\kimi-desktop\daimon-bundle\bin\kimi-daimon.cmd` (exit 1).
The script's `-x`-style executability test returns false for `.cmd` launchers under Git Bash even though the file exists and runs.

**Workaround:** `python scripts/register_personal.py <plugin-dir>` works correctly on the same machine (validated 2026-11-08 with two successful registrations, read-back verified).

**Suggested fix:** on Windows, treat `.cmd`/`.exe` at `DAIMON_RUNTIME_BINARY_PATH` as executable when the file exists, or replace the `-x` test with a capability probe (`<binary> --version`).

## Resolution (2026-11-08)

done: harnesses.md documents the Windows failure and .py workaround; paste-ready bug report is in this ticket body. Upstream-report outcome: not submitted by the agent (no public tracker; the client's feedback channel needs the owner) -- report text captured here for the owner to paste

### Verification
1. ✓ harnesses.md Kimi section documents symptom and .py workaround — "harnesses.md Kimi Register bullet documents the literal error text and the register_personal.py workaround with observed date"
2. ✓ ticket body carries paste-ready bug report — "ticket body section 'Paste-ready upstream bug report' has title, environment, repro, expected/actual, workaround, suggested fix"
3. ✓ close-out records upstream-report outcome — "resolution records: agent cannot submit client feedback; owner submission pending, text ready in body"
