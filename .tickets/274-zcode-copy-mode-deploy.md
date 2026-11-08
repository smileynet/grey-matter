---
id: "274"
title: "Add ZCode harness entry to deploy.mjs and install-agents-md"
status: done
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

- [x] `deploy.mjs` installs grey-matter skills to `~/.zcode/skills`; `deploy.mjs check` and `audit` stay clean with a ZCode home present
- [x] `install-agents-md.mjs` manages a `~/.zcode/AGENTS.md` block (install + drift detection round-trip)
- [x] `harnesses.md` section and live-probe entry added; `node scripts/gate.mjs pre-merge` passes
- [x] Version minor-bumped per the release contract (new distribution target)

## Resolution (2026-11-08)

done: ZCode is a deploy.mjs harness (own root ~/.zcode/skills, reads ~/.agents/skills, plugin detection, audit inventory) with install-agents-md managing ~/.zcode/AGENTS.md and harnesses.md documenting it; plus a codex-absent refresh skip guard found during verification; vendored deployer synced to tkt (committed+pushed)

### Verification
1. ✓ deploy.mjs installs grey-matter skills to ~/.zcode/skills; check and audit stay clean with a ZCode home present — "Live deploy on this machine maps 'zcode <- ZCode plugin grey-matter@grey-matter' (plugin is the copy, no ~/.zcode/skills created); sandbox tests cover the no-plugin path installing to ~/.zcode/skills and explicit-false fallback; audit counts 'zcode grey-matter@grey-matter: 50 cached skills' with no skill seen twice"
2. ✓ install-agents-md.mjs manages a ~/.zcode/AGENTS.md block (install + drift round-trip) — "install-agents-md created ~/.zcode/AGENTS.md (2423 B block), rerun reports current, list reports installed"
3. ✓ harnesses.md section and live-probe entry added; gate.mjs pre-merge passes — "harnesses.md gains the ZCode section, standing-rules row and non-interactive test commands; node scripts/gate.mjs pre-merge: 2/2 selected checks ok (kimi-plugin-package, agent-guidance); node --test scripts/deploy.test.mjs: 3 new ZCode tests pass, no failures"
4. ✓ Version minor-bumped per the release contract (new distribution target) — "v0.2.0 in .claude-plugin/.codex-plugin/.kimi-plugin manifests (new distribution target, minor bump); deploy.mjs check --static OK; Claude re-registered with readFromFolder + folderVersion 0.2.0; codex plugin refreshed to 0.2.0; audit's 3 unowned-dir findings proven pre-existing via worktree audit at 406148b"
