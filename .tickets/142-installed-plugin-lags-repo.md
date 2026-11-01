---
id: "142"
title: "Installed plugin lags the repo so orient routes to skills that are not installed"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Version gap confirmed or rejected"
  - "orient falls back when a routed skill is missing"
tags: ["stream:tooling"]
---

# Installed plugin lags the repo so orient routes to skills that are not installed

## Origin

Field report from philippines-trip, 2026-11-01. `orient` told the session to start the pick with `implement` and to use `compass`, but this session's installed grey-matter plugin did not offer `implement`, `implement-spec`, `handoff` or `wrap-session`, although all exist in `skills/` in this repo. The handoff dead-ended and the agent improvised.

## Acceptance criteria

- [ ] Confirm or reject the version gap (installed plugin version vs repo skills) with evidence.
- [ ] If confirmed: release, or make orient/compass check the installed skill list and fall back (e.g. to tkt-work) when a routed skill is missing.
- [ ] verify-tkt-usage or a similar check flags skills that reference uninstalled skills.
