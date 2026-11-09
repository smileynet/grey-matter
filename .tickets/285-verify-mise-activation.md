---
id: "285"
title: "Verify mise activation and tkt resolution in a fresh shell (owner)"
status: open
blocked_by: []
validation_criteria:
  - "mise --version succeeds in a fresh PowerShell"
  - "tkt --version succeeds in a fresh PowerShell with current hash"
tags: ["triage:ready-for-human"]
---
## What to build

Owner action on this machine (agent cannot complete it): open a fresh
PowerShell and run `mise --version` and `tkt --version`. If mise is missing or
errors, reinstall it (`winget install jdx.mise`) and re-activate it in the
shell profile. If both print versions, the toolchain environment is healed.

Context: on 2026-11-08 the agent session found mise-generated shims that exec
`mise x -- <tool>` while `mise.exe` was not findable on PATH, breaking every
shimmed tool at once (symptom: `command not found`). The tkt CLI no longer
depends on the shims (installed to ~/.local/bin, tkt ticket 280), but other
mise-managed tools still do.

## Acceptance criteria

- [ ] `mise --version` succeeds in a fresh PowerShell (or mise was reinstalled and now succeeds)
- [ ] `tkt --version` succeeds in a fresh PowerShell and prints 0.4.0 with a current hash
