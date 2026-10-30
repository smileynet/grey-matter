---
id: "102"
title: "implement and implement-spec scale review to risk, with acceptance derived from the contract"
status: done
blocked_by: []
priority: high
tags: ["kind:enhancement"]
---

# implement and implement-spec scale review to risk, with acceptance derived from the contract

## What to build

Intent: workflow-guidance recommendations 3 and 9, plus the guide's lean routine. Source: grey-matter ticket 101, reviewing `agent-harness-research/docs/agents/research/agent-workflow-guidance.md` (commit `649a44d`, on that repo's local main).
Independent acceptance and source review caught real gaps in the Caddy study, but extra
reviewers added no distinct faults in the smaller screens. So review effort should follow
risk, not run at full depth on every change.

Today `implement` always calls `code-review`, which always runs two parallel subagents.
Change `skills/engineering/implement/SKILL.md` and `implement-spec` so that:

- the start step names the ticket's one observable outcome and its main unresolved
  assumption;
- a small, reversible change gets a spec check against the ticket;
- a consequential change (stateful behavior, a public interface, release or deploy
  tooling, security, anything hard to reverse) gets the full two-axis review;
- whichever review runs derives its expectations from the ticket or spec, not from the diff.

Keep this consistent with the standing rule "scale verification depth to reversibility
and blast radius".

## Acceptance criteria

- [x] `implement` and `implement-spec` state when the full review runs and when a spec check is enough, with the consequential cases listed
- [x] The start step names the observable outcome and the unresolved assumption
- [x] Review expectations come from the ticket or spec; the skill says so
- [x] `node scripts/check-repo.mjs` passes

## Resolution (2026-10-30)

Done in af94bfc. implement gains a Review depth section: code-review for consequential changes (stateful behavior, public interface, release or deploy tooling, security, hard to reverse; unsure counts as consequential), a spec check listing each criterion met/unmet/untested otherwise. Its start step names the observable outcome and main unresolved assumption and checks the assumption first. implement-spec's implementers do the same and its review step follows implement's Review depth by the riskiest ticket. Both write expectations from the ticket or spec before reading the diff. compass and CHANGELOG updated. No scratch artifacts kept; gate log deleted.
