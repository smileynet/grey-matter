---
id: "281"
title: "Document ZCode as a distribution surface (onboarding, refresh, maintenance)"
status: done
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

- [x] distribution-maintenance.md carries a ZCode section covering onboarding, refresh contract, and maintenance, consistent with spike evidence
- [x] Onboarding decision (scripted vs documented) recorded with rationale
- [x] Doc links resolve; `node scripts/gate.mjs pre-merge` passes on the changed docs

## Resolution (2026-11-08)

done: ZCode is a documented distribution surface covering onboarding, the advisory-dependency rule, the deploy-owned same-version refresh, and maintenance caveats, with the scripted-vs-documented onboarding call recorded

### Verification
1. ✓ distribution-maintenance.md carries a ZCode section covering onboarding, refresh contract, and maintenance, consistent with spike evidence — "distribution-maintenance.md gains a ZCode plugin section: manifest reuse (no .zcode-plugin), onboarding commands incl. explicit tkt@tkt install, deploy-owned refresh contract, maintenance notes (--force uninstall, TUI model default, session-start loading), cross-links to harnesses.md and the research doc"
2. ✓ Onboarding decision (scripted vs documented) recorded with rationale — "Onboarding decision recorded with rationale: two documented CLI commands over a script (rare owner-run setup; deploy.mjs already owns refresh and detection; Kimi documented-registration precedent)"
3. ✓ Doc links resolve; gate.mjs pre-merge passes on the changed docs — "gate.mjs pre-merge ok on the changed docs; intro paragraph updated to name the ZCode refresh; verified line cites tickets 273-281 and the live 0.1.0->0.2.0 refresh"
