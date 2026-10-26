---
id: "86"
title: "crew-research freeze commit is local-only: a push-policy hook blocks pushes to smileynet/crew-research"
status: open
blocked_by: []
validation_criteria:
  - "Decision recorded: request repo approval through the push-policy tool, or accept the freeze as local-only"
  - "If approved: the freeze commit is on origin/main"
tags: ["stream:migration", "type:decision"]
---

# crew-research freeze commit is local-only: a push-policy hook blocks pushes to smileynet/crew-research

## Observed (2026-10-22)

The crew-research freeze (README + AGENTS.md banner: never run `init`, it would undo the
cutover) is commit `54be9e3`, rebased onto origin/main, but `git push` is blocked:
"push to an unapproved public repository" (corporate push-policy hook)
(`git@github.com:smileynet/crew-research.git`). The freeze still protects this host (the
banner is in the local checkout), but other clones never see it.

## What to build

Owner decision: request approval for `git@github.com:smileynet/crew-research.git` through the push-policy
tool (personal project) and push, or accept the freeze as local-only and say so here.

## Acceptance criteria

- [ ] Decision recorded: request repo approval, or accept the freeze as local-only
- [ ] If approved: the freeze commit is on origin/main
