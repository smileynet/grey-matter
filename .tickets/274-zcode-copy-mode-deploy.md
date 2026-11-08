---
id: "274"
title: "Add ZCode harness to deploy.mjs (copy mode) and install-agents-md"
status: open
blocked_by: []
validation_criteria:
  - "deploy.mjs installs grey-matter skills to ~/.zcode/skills; check and audit stay clean with a ZCode home present"
  - "install-agents-md.mjs manages a ~/.zcode/AGENTS.md block (install + drift round-trip)"
  - "harnesses.md section and live-probe entry added; gate.mjs pre-merge passes"
  - "Version minor-bumped per the release contract (new distribution target)"
tags: ["stream:tooling", "kind:enhancement"]
---
## What to build

Add ZCode Desktop as a supported harness in the distribution pipeline, copy
mode, per the research verdict in
[docs/agents/research/zcode-plugin-compat-20261108.md](../../docs/agents/research/zcode-plugin-compat-20261108.md):

- `scripts/deploy.mjs` `HARNESSES()` entry: own root `~/.zcode/skills`,
  reads `~/.agents/skills`, project dirs `.zcode`/`.agents`; plugin detection
  (ZCode plugin cache / `~/.zcode/cli/config.json`) so root selection and the
  duplicate-discovery audit treat an installed plugin as ZCode's copy.
- `scripts/deploy.test.mjs` coverage for the new entry.
- `scripts/install-agents-md.mjs` KNOWN target: `~/.zcode/AGENTS.md` (user
  instruction file; managed block, same budget rules).
- `docs/agents/harnesses.md` ZCode section + live-probe script entry.
- Release contract: new distribution target → minor version bump
  (`.claude-plugin/plugin.json` version authority).
- Optional (only if the spike ticket confirms low friction): a `refreshZcode`
  step mirroring `refreshCodex`, via
  `node /Applications/ZCode.app/Contents/Resources/glm/zcode.cjs plugins update`
  when the plugin is installed.

## Acceptance criteria

- [ ] `deploy.mjs` installs grey-matter skills to `~/.zcode/skills`; `deploy.mjs check` and `audit` stay clean with a ZCode home present
- [ ] `install-agents-md.mjs` manages a `~/.zcode/AGENTS.md` block (install + drift detection round-trip)
- [ ] `harnesses.md` section and live-probe entry added; `node scripts/gate.mjs pre-merge` passes
- [ ] Version minor-bumped per the release contract (new distribution target)
