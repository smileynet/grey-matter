---
id: "258"
title: "Validate and insert one delivery-dashboard entry before the full check"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "One command validates a single entry against the strict rules and inserts it only on pass"
tags: ["stream:tooling", "kind:enhancement"]
---
## What to build

A way for agents to add a `gm-entries` entry that is validated before insertion: `add-entry.mjs ENTRY.json`, or a `check-dashboard.mjs --entry FILE` mode beside the current `<file> [--repo] [--strict]`.

## Intent and context

Source: android-helper session retrospective, 2026-11-07 (plan finalized after two critic rounds). Filed from android-helper; no work done here.

android-helper agents inserted entries into docs/status.html by hand (an ad hoc script), and the strict check rejected them late, three times:
- a "changes" line over 100 characters;
- a visual step state `blocked` (only done|now|next is allowed);
- a commit hash in a change line.

One failing state was committed because a pipe hid the checker's exit code.

## Acceptance criteria

- [ ] A single entry is validated against the same rules as check-dashboard --strict, reporting each rule broken
- [ ] The entry is inserted (newest first) only on pass; the dashboard is untouched otherwise
- [ ] Fixtures cover the three observed rejections