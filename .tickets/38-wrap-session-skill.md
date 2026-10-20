---
id: "38"
title: "Add wrap-session: end-of-session orchestrator (reconcile + retro + land mechanical findings)"
status: open
blocked_by: []
priority: low
tags: ["stream:tooling"]
---

# Add wrap-session: end-of-session orchestrator (reconcile + retro + land mechanical findings)

## What to build

A user-invoked meta skill `wrap-session` that is the single closing bookend of a session:
it runs `reconcile-tickets` (groom the board) then `retro` (groom the environment), and
then adds the beat neither does alone — **landing** the cheap, unambiguous **mechanical**
findings this session (writing the check/guardrail or a project-level skill/note) instead
of only filing them as tickets. Expensive or ambiguous findings stay tickets.

## Context

Grew out of a session (2026-10-20) whose wrap had exactly this shape: reconcile the board,
retro the environment (the recurring `$env:` PowerShell trap; three concurrent-push
collisions), and then *act* on the mechanical findings rather than defer them. The
orchestration mirrors `release` (one skill composes `changelog` + `readme` + the gated
mechanics); the new leverage is retro's mechanical findings getting built this session.

Composes, does not re-spell: defers to `reconcile-tickets` (which wraps `tkt-core`) and
`retro` (which owns the mechanical-vs-judgement classification). Session-end twin of
`orient`; does not write the handoff (`handoff`) or pick the next ticket (`orient`).

Files: `skills/meta/wrap-session/SKILL.md` + `agents/openai.yaml`; indexes updated in
`skills/meta/README.md`, `skills/meta/compass/SKILL.md`, and
`docs/agents/maintenance-skills.md`.

## Acceptance criteria

- [x] `skills/meta/wrap-session/SKILL.md` exists, user-invoked (`disable-model-invocation: true`) with the Codex sidecar `agents/openai.yaml` (`allow_implicit_invocation: false`).
- [x] It orchestrates reconcile-tickets then retro by calling the Skill tool, and adds a land-now step that builds cheap/unambiguous mechanical findings (check/guardrail or project-level skill/note), deferring the rest to tickets.
- [x] Listed under User-invoked in `skills/meta/README.md`, mentioned in `compass` (Session bookends + Maintaining-this-set), and in the `maintenance-skills.md` roster.
- [x] `node scripts/check-repo.mjs` passes (invocation policy, index set-equality, links).
