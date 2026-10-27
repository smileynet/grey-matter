---
id: "96"
title: "Docker containment option for Codex critics (T2, only if critics must read files)"
status: backlog
blocked_by: []
tags: ["stream:tooling"]
---

# Docker containment option for Codex critics (T2, only if critics must read files)

## What to build

Proposal 15 option T2, postponed by the owner on 2026-10-27. Context:
[proposal 15](../docs/agents/proposals/15-codex-critic-containment.md) and the
[spike results](../docs/agents/research/codex-containment-spike-20261027.md). It matters only if a Codex
critic must read repo files or use tools; the default (`-s read-only`, packet in the prompt) is enforced and probed.
Produce a read-only container recipe and record the credential exposure.

## Acceptance criteria

- [ ] T2 is tested against the six adversarial checks, with filesystem or process evidence per cell.
- [ ] Credential exposure, setup cost and per-call overhead are recorded.
- [ ] The Codex row in `harnesses.md` says when to prefer the container over `-s read-only`.
