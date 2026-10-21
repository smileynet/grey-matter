# 0001 — adopt-project's adoption boundary: calls triage, recommends wayfinder

**Status:** accepted (2026-10-21)

## Context

`adopt-project` (ticket 40) brings the grey-matter workflow into an existing repo. It
orchestrates other skills; the question was *which* it runs as part of its workflow versus
which it only points at. The name promises a *fully adopted* project, so under-scoping
(leaving the user a to-do list of further skills to run) would betray it — but over-scoping
would swallow neighbouring skills' jobs and sprawl.

## Decision

adopt-project is **bounded by "derivable from the repo as it is."** Everything that can be
characterized or captured from existing code, history, and conventions is in scope and
**called inline**: `init-project` (plumbing), `domain-modeling`/`game-modeling`
(glossary-from-code), the conformance-audit skill (ticket 42), and `triage` (existing-backlog
capture into a triaged frontier). The end state is a fully adopted, workable repo.

`wayfinder` is **recommended, not called.** It generates *new* work toward a forward
destination — that is building *in* the adopted repo, not adopting it, and it needs a
destination adoption cannot infer from existing code. That seam — where the next step requires
a future the repo doesn't yet contain — is where adoption ends.

## Why

Calling triage but only recommending wayfinder is the non-obvious part. The test is the
boundary rule: triage captures what *already exists* (derivable); wayfinder plans what
*doesn't exist yet* (not derivable). "Fully adopted" means the existing project is fully
represented and operable under the workflow, not that its future has been planned. Keeping
adopt-project a composer (call the capability skills, don't reimplement them) also matches the
deep-module discipline used across the skill set.

## Considered

- *Recommend triage too (don't call it):* rejected — leaves a half-adopted repo with an empty
  board, contradicting the name.
- *Call wayfinder too:* rejected — would stall mid-flow waiting for a destination, or invent one.
