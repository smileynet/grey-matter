---
id: "281"
title: "Document ZCode as a distribution surface (onboarding, refresh, maintenance)"
status: open
blocked_by: ["274", "280"]
validation_criteria:
  - "distribution-maintenance.md carries a ZCode section covering onboarding, refresh contract, and maintenance, consistent with spike evidence"
  - "Onboarding decision (scripted vs documented) recorded with rationale"
  - "Doc links resolve; gate.mjs pre-merge passes on the changed docs"
tags: ["stream:tooling", "type:chore"]
---
## What to build

ZCode documented as a first-class distribution surface, consistent with the
spike evidence (ticket 273 /
[research doc](../../docs/agents/research/zcode-plugin-compat-20261108.md)):

- `docs/agents/distribution-maintenance.md` ZCode section:
  - one-time onboarding: add the checkout as a local-directory marketplace,
    install grey-matter, install `tkt@tkt` explicitly (the dependency is
    advisory in ZCode — nothing blocks and nothing auto-installs);
  - the refresh contract: `plugins marketplace update` + `plugins update`
    (same-version content refresh), the version-bump alternative, and
    "Restart zcode to apply" for a running Desktop;
  - maintenance notes: `uninstall` needs `--force` in non-interactive shells,
    superseded version cache dirs linger, headless `-p` requires a
    TUI-selected model.
- Decide scripted onboarding vs. two documented CLI commands (Kimi's
  `register_personal.sh` precedent vs. the CLI being fully scriptable);
  record the call with rationale in the section.
- Cross-link the harnesses.md ZCode section (ticket 274) and the research doc.
- Record the deliberate non-goal: no dedicated `.zcode-plugin/plugin.json` —
  the `.claude-plugin/` manifest validates and loads identically (spike
  verified), so a second manifest is drift surface only.

## Acceptance criteria

- [ ] distribution-maintenance.md carries a ZCode section covering onboarding, refresh contract, and maintenance, consistent with spike evidence
- [ ] Onboarding decision (scripted vs documented) recorded with rationale
- [ ] Doc links resolve; `node scripts/gate.mjs pre-merge` passes on the changed docs
