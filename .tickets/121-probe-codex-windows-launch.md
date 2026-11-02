---
id: "121"
title: "Critic probe launches Codex on Windows and says when the CLI is too old"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "On Windows the probe reaches a Codex installed as a `.cmd` shim, covered by a fixture."
  - "A Codex CLI below the documented minimum produces a line naming the minimum version, not a raw 400."
  - "`docs/agents/harnesses.md` records the Windows install pitfall and the working launch path."
  - "`node scripts/gate.mjs pre-merge` passes."
tags: ["type:bug","stream:test-verification"]
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
- [ ] `node scripts/gate.mjs pre-merge` passes.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: reproduce native Windows shim/package-launch behavior with owned CLI fixtures, and qualify
unsupported-version diagnostics independently. Treat the old model/CLI minimum in the incident as
historical; reverify the current governing requirement before encoding it. The POSIX critic fixtures
skip on Windows, so those results do not establish this acceptance.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.
