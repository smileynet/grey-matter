---
id: "133"
title: "Validate footprint guidance and inspector under WSL 2"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Every WSL 2 row of footprint-by-os.md was run in a WSL 2 distro (WSL version, distro, Windows build recorded) and is retagged observed, corrected, or kept with the reason it could not run."
  - "With the Windows drive's free space below the distro's own df figure, inspect-footprint.mjs --summary reports the lower (Windows) figure and the floor finding follows it."
  - "Deleting a large file inside the distro is measured on the Windows side before and after wsl --manage --set-sparse true, and the reclaiming guidance matches what was observed."
  - "node --test scripts/inspect-footprint.test.mjs passes inside WSL 2; the research file records the commands and output, and node scripts/check-repo.mjs passes."
tags: ["stream:tooling", "type:chore"]
---

# Validate footprint guidance and inspector under WSL 2

## Why

Ticket 110 decided that under WSL the free-space floor uses the lower of the distro's free space
and its Windows drive's, because the distro's `df` reports the virtual disk's maximum. The
inspector implements this by also reading `/mnt/c`, and the global rule names it, but neither was
run under WSL. The WSL rows of
[footprint-by-os.md](../skills/meta/repository-artifact-hygiene/references/footprint-by-os.md),
including how `ext4.vhdx` gives space back, come from docs.

## What to check

In a WSL 2 distro, from a grey-matter checkout on the Linux filesystem:

- `command df -Pk` inside the distro against `/mnt/c` and `powershell.exe -NoProfile -c "(Get-Volume C).SizeRemaining"`.
- That the inspector detects WSL and takes the minimum, including when the distro's disk lives on
  a drive other than C (fix or file if `/mnt/c` is the wrong drive).
- Space given back to Windows after a delete, before and after sparse mode.
- `node --test scripts/inspect-footprint.test.mjs` and a `--summary` run.

Fix wrong rows and inspector bugs in place; file anything larger as its own ticket.

## Acceptance criteria

- [ ] Each WSL 2 row is observed, corrected, or marked with why it could not run.
- [ ] The inspector reports the lower of the distro and Windows free space.
- [ ] Reclaiming guidance matches measured behaviour with and without sparse mode.
- [ ] The fixture test passes under WSL 2; output recorded; `node scripts/check-repo.mjs` passes.
