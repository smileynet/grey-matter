---
id: "131"
title: "Validate footprint guidance and inspector on macOS"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Every macOS row of footprint-by-os.md was run on a Mac (macOS version, chip and shell recorded) and is retagged observed, corrected, or kept with the reason it could not run."
  - "node --test scripts/inspect-footprint.test.mjs passes on macOS, including the open-file skip through lsof; a failure is fixed or filed with its output."
  - "inspect-footprint.mjs --repo <a real repo> --summary reports free space within 1% of command df -Pk and sizes that match command du -sk on an APFS volume, with the clone caveat confirmed or corrected."
  - "The research file footprint-commands-by-os-20261031.md (or a dated successor) records the commands and output; node scripts/check-repo.mjs passes."
tags: ["stream:tooling", "type:chore"]
---

# Validate footprint guidance and inspector on macOS

## Why

Ticket 110 shipped per-OS footprint guidance and a read-only inspector, but only the Linux rows
were run. The macOS rows of
[footprint-by-os.md](../skills/meta/repository-artifact-hygiene/references/footprint-by-os.md)
come from vendor docs or secondary sources, and the inspector's non-Linux paths (`lsof` for open
files, `statfs` on APFS) have never executed. The Mac is where the disk-pressure incident in
[proposal 16](../docs/agents/proposals/16-agent-footprint-guardrails.md) happened, so wrong
guidance there costs the most.

## What to check

On a Mac, from a grey-matter checkout:

- Each macOS row: `command df -Pk`, `command du -sk` on a folder holding an APFS clone
  (`cp -c`), `/usr/bin/trash` (macOS 15+) and whether Homebrew's `trash` shadows it, `lsof -w +D`,
  `stat -f %l`, `xcrun simctl list devices unavailable` / `delete unavailable` (as the user), and
  the DerivedData location.
- Which of `df`, `du`, `cat` the agent's shell aliases on that Mac.
- `node --test scripts/inspect-footprint.test.mjs` and a `--summary` run on a real repo.

Fix wrong rows and inspector bugs in place; file anything larger as its own ticket.

## Acceptance criteria

- [ ] Each macOS row is observed, corrected, or marked with why it could not run.
- [ ] The inspector's fixture test passes on macOS, or its failure is fixed or filed.
- [ ] Inspector free space and sizes agree with `command df` / `command du` on APFS.
- [ ] Commands and output are recorded in the research file; `node scripts/check-repo.mjs` passes.
