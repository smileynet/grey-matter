---
id: "121"
title: "Critic probe launches Codex on Windows and says when the CLI is too old"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "probe-critic-model reaches codex when it is installed as a .cmd shim or bun global on Windows"
  - "A Codex CLI older than the documented minimum is reported as such, not as a generic failure"
tags: ["stream:tooling", "type:bug"]
---
# Critic probe launches Codex on Windows and says when the CLI is too old

## What to build

Intent source: the 2026-10-31 sync follow-up that upgraded Codex 0.139.0 to 0.166.0 on this Windows host.

- `scripts/probe-critic-model.mjs` spawns `codex` without a shell (line ~32). On Windows only a real `codex.exe` resolves, so a Codex installed as a `.cmd` shim reports `unavailable: codex is not on PATH` even though it runs from a terminal.
- bun 1.3.12 crashed while linking the upgraded package and left `~/.bun/bin/codex.bunx` empty, which made `codex` unrunnable until it was repaired by hand. The working workaround is a copied native `codex.exe`, which goes stale on the next upgrade.
- With Codex 0.139.0 the probe reported a bare HTTP 400 ("model not supported"). `docs/agents/harnesses.md` says the 6.1 models need CLI 0.159 or later; the probe never says so.

Make the probe resolve Codex the way the shell does on Windows (a `.cmd` shim or the package's own launcher), and report a CLI older than the documented minimum as its own state with the fix. Record the Windows install pitfall (bun global install, stale copied exe) in `docs/agents/harnesses.md`.

## Context

Files: `scripts/probe-critic-model.mjs` and its test, `docs/agents/harnesses.md` ("Critic model"). Ticket 92 gap 9 covers the Codex ceiling on other hosts.

## Acceptance criteria

- [ ] On Windows the probe reaches a Codex installed as a `.cmd` shim, covered by a fixture.
- [ ] A Codex CLI below the documented minimum produces a line naming the minimum version, not a raw 400.
- [ ] `docs/agents/harnesses.md` records the Windows install pitfall and the working launch path.
- [ ] `node scripts/check-repo.mjs` passes.
