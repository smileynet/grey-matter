---
id: "273"
title: "Spike: install grey-matter's Claude plugin in ZCode, record runtime behavior"
status: in_progress
blocked_by: []
validation_criteria:
  - "plugins validate result on the checkout recorded verbatim"
  - "Install from local marketplace observed; all 50 skills appear (array-of-bucket-roots proven)"
  - "Skill-to-skill references under plugin:skill qualified naming checked (compass routes to sibling)"
  - "tkt dependency behavior recorded: auto-installed, prompted, or exact blocker"
  - "Update friction observed: plugins update refreshes the cached copy or exact limitation recorded"
  - "92-skill picker watch-item noted"
tags: ["stream:tooling", "type:research"]
---
## What to build

Nothing durable. A throwaway live trial of the existing Claude Code plugin in
ZCode Desktop, answering the residual unknowns from
[docs/agents/research/zcode-plugin-compat-20261108.md](../../docs/agents/research/zcode-plugin-compat-20261108.md)
that static research could not resolve. Observations land on this ticket and in
that doc; no repo changes ship from the spike itself.

Method: `zcode plugins validate` on the checkout, then add the checkout as a
local-directory marketplace, install grey-matter (with the `tkt` marketplace
present for the dependency), verify via `zcode plugins list` /
`zcode skills list` plus a fresh session. Uninstall afterwards; the plugin
route is optional surface — the copy-mode integration ticket is the primary
path and does not depend on this spike's outcome.

## Acceptance criteria

- [ ] `plugins validate` result on the checkout recorded verbatim (pass or exact messages)
- [ ] Install from the local marketplace observed; skill count verified (all 50 appear via `skills list` / Settings → Skills) — proves array-of-bucket-roots semantics
- [ ] Skill-to-skill references under `plugin:skill` qualified naming checked (compass routes to a sibling by name)
- [ ] tkt dependency behavior recorded: auto-installed, prompted, or exact blocker
- [ ] Update friction observed: edit one skill description, run `plugins update` (or UI), record whether the cached copy refreshes
- [ ] 92-skill picker watch-item noted (42 personal + 50 plugin skills in one session)
