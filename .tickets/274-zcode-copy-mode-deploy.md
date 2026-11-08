---
id: "274"
title: "Add ZCode harness entry to deploy.mjs and install-agents-md"
status: in_progress
blocked_by: []
validation_criteria:
  - "deploy.mjs installs grey-matter skills to ~/.zcode/skills; check and audit stay clean with a ZCode home present"
  - "install-agents-md.mjs manages a ~/.zcode/AGENTS.md block (install + drift round-trip)"
  - "harnesses.md section and live-probe entry added; gate.mjs pre-merge passes"
  - "Version minor-bumped per the release contract (new distribution target)"
tags: ["stream:tooling", "kind:enhancement"]
---
## What to build

Add ZCode Desktop as a supported harness in the distribution pipeline. The
spike (ticket 273, results in
[docs/agents/research/zcode-plugin-compat-20261108.md](../../docs/agents/research/zcode-plugin-compat-20261108.md))
settled the delivery route as plugin-primary — but the harness-table entry is
still required either way, because ZCode unconditionally reads
`~/.agents/skills`: root selection and the duplicate-discovery audit must
account for it, exactly like the codex entry.

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
- Companion tickets: **280** owns the `refreshZcode` plugin-refresh step
  (supersedes the optional bullet this ticket originally carried); **281**
  documents the ZCode distribution surface. This ticket is the harness-table
  foundation only.

## Acceptance criteria

- [ ] `deploy.mjs` installs grey-matter skills to `~/.zcode/skills`; `deploy.mjs check` and `audit` stay clean with a ZCode home present
- [ ] `install-agents-md.mjs` manages a `~/.zcode/AGENTS.md` block (install + drift detection round-trip)
- [ ] `harnesses.md` section and live-probe entry added; `node scripts/gate.mjs pre-merge` passes
- [ ] Version minor-bumped per the release contract (new distribution target)
