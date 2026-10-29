---
id: "99"
title: "Repository artifact hygiene tests fail on Windows (newline filename, path separators)"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Each failure is reproduced on Windows and marked confirmed, rejected or obsolete with evidence before code changes."
  - "'policy globs cover newline-containing Git paths' runs on Windows without writing a newline filename to disk (e.g. git update-index --cacheinfo), or skips on win32 with the reason stated."
  - "'caller Git context cannot redirect...' compares repository paths in one form on every platform, and the chosen form is the one inspect-artifacts.mjs documents for scope.repository."
  - "node scripts/check-repo.mjs invariant 13 passes on Windows and still passes on macOS/Linux."
---

# Repository artifact hygiene tests fail on Windows (newline filename, path separators)

## What to build

TBD

## Acceptance criteria

- [ ] TBD
