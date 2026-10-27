---
id: "92"
title: "Fix the gaps the critic model spike found"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Each listed gap is resolved or recorded as accepted with a reason"
tags: ["stream:tooling", "type:chore"]
---

# Fix the gaps the critic model spike found

## What to build

Gaps from the [critic model spike](../docs/agents/research/critic-model-spike-20261027.md). Resolve each or record it as accepted with a reason:

1. **Kiro CLI**: Claude Opus 5.5 is absent from `--list-models` (best is Opus 4.5), Kiro keeps no model record and its subagents cannot take a model. Recheck on each Kiro upgrade; the probe reports it.
2. **Codex sandbox**: `-s read-only` fails on randomserver (bubblewrap, `RTM_NEWADDR: Operation not permitted`). Decided 2026-10-27: Codex critics use `--dangerously-bypass-approvals-and-sandbox`, read-only by prompt plus a clean-tree `git status` check (see harnesses). Optional: investigate the unprivileged-namespace restriction so the sandbox could return.
3. **Inability to review**: a critic that cannot read its input must not return a verdict. Add this to the critic prompts and the findings format (an `UNABLE TO REVIEW` result) when ticket 90 lands.
4. **Override that defeats a pin**: `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` silently ran a pinned Opus critic on Haiku. Make the critic dispatch check the recorded model against the pin and fail the review if they differ.
5. **opencode errors**: a missing model returns only "Unexpected server error". Consider reading the log reference, or accept it.
6. **opencode ceiling**: its `opencode` provider key is expired; critics use the owner's z.ai plan. Refresh the key or confirm z.ai stays the choice.
7. **Context isolation**: Kiro loads global steering into a fresh session; confirm whether a Kiro critic should run with `--agent` set to a bare agent.

## Acceptance criteria

- [ ] Each of the seven gaps is resolved or recorded here as accepted, with a reason.
