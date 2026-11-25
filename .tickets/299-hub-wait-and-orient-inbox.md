---
id: "299"
title: "Add serve-hub.mjs --wait reactive mobile wakeup and orient unread-inbox check"
status: in_progress
blocked_by: []
priority: medium
tags: ["stream:tooling"]
---

# Add serve-hub.mjs --wait reactive mobile wakeup and orient unread-inbox check

## What to build

Implement Tier 1 session signaling from spike #298 (`docs/agents/research/mobile-decision-inbox-spike-20261125.md`):

1. Add `waitForInbox()` and CLI `--wait DIR_OR_SLUG [--timeout SECONDS] [--config FILE]` to `skills/productivity/delivery-dashboard/scripts/serve-hub.mjs` (using `fs.watch` + gentle fallback check, exit `0` with JSON submission on arrival, exit `124` on timeout; never mutates repo files). Also accept directory paths (like `.`) in `--inbox`.
2. Add unit tests in `skills/productivity/delivery-dashboard/scripts/serve-hub.test.mjs` covering pre-existing pending arrival, live `POST /api/inbox/<slug>` wakeup, timeout (`124`), and directory-path slug resolution.
3. Add a passive unread-inbox check to `skills/meta/orient/SKILL.md` (when `~/.config/grey-matter/hub.json` exists, check `--inbox .` and surface pending mobile answers before unrelated frontier work).
4. Document `--wait` in `skills/productivity/delivery-dashboard/SKILL.md`, `references/hub-serving.md`, and `skills/engineering/orchestrate/references/tool-scripts.md`.

## Acceptance criteria

- [ ] `serve-hub.mjs --wait <dir-or-slug> [--timeout SEC]` returns immediately on pre-existing pending items, wakes up cleanly when a new `POST /api/inbox/<slug>` arrives, and exits `124` on timeout.
- [ ] `serve-hub.test.mjs` verifies pre-existing arrival, live `POST` wakeup, timeout exit `124`, and directory-path `--inbox` resolution.
- [ ] `orient/SKILL.md`, `delivery-dashboard/SKILL.md`, `hub-serving.md`, and `tool-scripts.md` document `--wait` and passive unread-inbox pickup, and all pre-push / pre-merge gates pass.
- [ ] Deployed across harnesses via `node scripts/deploy.mjs`.
