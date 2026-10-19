---
id: "01"
title: "Adapt tkt as the ticket system and define required features"
status: done
blocked_by: []
priority: high
env: personal
validation_criteria:
  - "Decision recorded on how grey-matter uses tkt to model skill-review and lens work (ticket shape, tags, dependency edges, spec linkage)"
  - "A gap list exists naming tkt features we need but that are missing or awkward, each with a concrete use case"
  - "A convention doc committed describing how we create, tag, and close tickets in this repo"
spec: "01-tkt-ticket-system"
---

# Adapt tkt as the ticket system and define required features

> Proposals (draft for review):
> - [`docs/agents/proposals/01-tkt-ticket-system.md`](../docs/agents/proposals/01-tkt-ticket-system.md) (fit + initial gap list)
> - [`docs/agents/proposals/01b-tkt-gaps-and-verbiage.md`](../docs/agents/proposals/01b-tkt-gaps-and-verbiage.md) (convention workaround + verbiage alignment)
> - [`docs/agents/proposals/01c-tkt-native-gap-closure.md`](../docs/agents/proposals/01c-tkt-native-gap-closure.md) **(preferred: native tkt updates; supersedes 01b gaps 1-4)**
>
> Implementation tracked in the **tkt repo** (`D:\code\tkt` -> `smileynet/tkt`),
> tickets 192-199 (all high priority). This ticket depends on their completion.

## Context

This repo (`grey-matter`) is where we adapt a customized set of agent skills
derived from `mattpocock/skills`. The upstream skills assume an issue tracker
(GitHub Issues, GitLab, or a local `.scratch/` markdown convention) wired up by
their `setup-matt-pocock-skills` skill, and they lean on tracker features like
native blocking edges and a frontier/ready query (most visible in `to-tickets`,
`implement`, `implement-spec`, and `wayfinder`).

We are not using any of those. We use **`tkt`** (git-native ticket CLI, the
`.tickets/` contract) instead. Before the per-skill walkthrough (ticket 03) can
decide how to record its output, we need to settle how `tkt` models our work and
where it falls short.

## What to decide / build

1. **Ticket shape for this repo.** How we represent the two kinds of work we
   actually have here: per-skill review notes, and lens/research artifacts.
   Decide what goes in a ticket vs. a committed doc the ticket points at.
2. **Tagging scheme.** Settle the tag vocabulary (e.g. `skill-review`, `lens`,
   `research`, bucket tags like `engineering`/`productivity`) and the active
   context workflow (`tkt context`).
3. **Dependency edges.** How we use `blocked_by` / the `ready` frontier to
   sequence work, and whether per-skill tickets fan out from 03 or live inline.
4. **Spec linkage.** How `--spec` and committed docs under the repo relate: where
   review notes and lens docs physically live, and how a ticket references them.
5. **Gap list.** Where `tkt` is missing or awkward for how the upstream skills
   expect a tracker to behave. Concrete candidates to evaluate:
   - sub-issues / parent-child (upstream `to-tickets` and `wayfinder` lean on it)
   - richer bodies / attachments vs. pointing at committed docs
   - labels beyond tags (triage roles, `ready-for-agent`-style states)
   - any friction mapping the skills' "Skill tool" + tracker assumptions onto tkt
   Each gap needs a concrete use case drawn from a real upstream skill.

## Acceptance criteria

- [x] Decision recorded on how grey-matter uses tkt to model skill-review and lens work (ticket shape, tags, dependency edges, spec linkage)
- [x] A gap list exists naming tkt features we need but that are missing or awkward, each with a concrete use case
- [x] A convention doc committed (e.g. `docs/agents/tkt-conventions.md`) describing how we create, tag, and close tickets in this repo

## Resolution (2026-10-10)

Decided: tkt is grey-matter's tracker. Three proposals recorded (01 fit+gaps, 01b verbiage+workaround, 01c native closure as preferred). Gap list with use cases in 01c. Conventions committed in docs/agents/tkt-conventions.md and GLOSSARY.md, pointed at from CLAUDE.md. Native gap closure tracked in tkt tickets 192-199; grey-matter ticket 04 gates and documents the migration.
