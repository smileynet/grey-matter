---
id: "273"
title: "Spike: install grey-matter's Claude plugin in ZCode, record runtime behavior"
status: done
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

- [x] `plugins validate` result on the checkout recorded verbatim (pass or exact messages)
- [x] Install from the local marketplace observed; skill count verified (all 50 appear via `skills list` / Settings → Skills) — proves array-of-bucket-roots semantics
- [x] Skill-to-skill references under `plugin:skill` qualified naming checked (compass routes to a sibling by name) — validated statically: plugin skills register bare-name aliases (`grey-matter:compass`, alias `compass`), so sibling references by bare name resolve; live model turn deferred (headless `-p` requires a TUI-selected model), user redirected the live test to cheat-sheet and directed proceeding
- [x] tkt dependency behavior recorded: auto-installed, prompted, or exact blocker
- [x] Update friction observed: edit one skill description, run `plugins update` (or UI), record whether the cached copy refreshes
- [x] 92-skill picker watch-item noted (42 personal + 50 plugin skills in one session)

## Observations (2026-11-08, headless CLI run)

Full detail in
[docs/agents/research/zcode-plugin-compat-20261108.md](../../docs/agents/research/zcode-plugin-compat-20261108.md)
§ Spike results. Summary: validate passes as-is; install yields 50 skills with
bare-name aliases (`grey-matter:compass`, alias `compass`); tkt dependency is
advisory (no block, no auto-install, manual install works); refresh recipe is
`plugins marketplace update` + `plugins update` (same-version content refresh
confirmed by marker round-trip); `uninstall` needs `--force`
non-interactively; headless `-p` needs a TUI-selected model, so the live
compass-routing check (AC 3) and the picker glance are the two remaining
session-level observations — both plugins are left installed and clean at HEAD
for that pass.

## Resolution (2026-11-08)

done: spike validated the existing Claude plugin in ZCode end-to-end headlessly; refresh recipe and dependency semantics recorded in docs/agents/research/zcode-plugin-compat-20261108.md; grey-matter@0.1.0 and tkt@0.4.0 left installed and byte-identical to HEAD

### Verification
1. ✓ plugins validate result on the checkout recorded verbatim — "zcode plugins validate: 'Plugin manifest is valid: ~/code/grey-matter' (verbatim, bundled CLI 0.17.1)"
2. ✓ Install from local marketplace observed; all 50 skills appear (array-of-bucket-roots proven) — "zcode plugins install grey-matter@grey-matter -> 'Installed plugin grey-matter@grey-matter (0.1.0) [enabled]', skills: 50; array-of-bucket-roots proven"
3. ✓ Skill-to-skill references under plugin:skill qualified naming checked (compass routes to sibling) — "skills list: 'grey-matter:compass (user/plugin; alias compass)' — bare-name aliases registered so sibling references resolve; live model turn deferred (headless -p needs TUI-selected model), user redirected test to cheat-sheet and directed proceeding"
4. ✓ tkt dependency behavior recorded: auto-installed, prompted, or exact blocker — "Dependency advisory: install succeeds without tkt marketplace (no prompt/warning); marketplace add does not auto-install; manual 'plugins install tkt@tkt' succeeds (0.4.0)"
5. ✓ Update friction observed: plugins update refreshes the cached copy or exact limitation recorded — "Refresh mapped by marker round-trip: plugins update alone no-ops on stale snapshot; marketplace update + plugins update re-copies same-version content; version bump propagates; uninstall needs --force; stale version cache dirs linger"
6. ✓ 92-skill picker watch-item noted — "109 skills discovered headlessly (42 personal + 50 plugin + 17 official); interactive picker glance folded into ongoing use"
