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
2. **Codex sandbox**: `-s read-only` fails to start shell commands on randomserver (bubblewrap, `RTM_NEWADDR: Operation not permitted`). Decided 2026-10-27: Codex critics default to `-s read-only` with the packet in the prompt (enforced); otherwise no sandbox, guarded by prompt and a clean-tree check (see harnesses). Optional: investigate the unprivileged-namespace restriction so the sandbox shell could work.
3. **Inability to review**: a critic that cannot read its input must not return a verdict. Add this to the critic prompts and the findings format (an `UNABLE TO REVIEW` result) when ticket 90 lands.
4. **Override that defeats a pin**: `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` silently ran a pinned Opus critic on Haiku. Make the critic dispatch check the recorded model against the pin and fail the review if they differ.
5. **opencode errors**: a missing model returns only "Unexpected server error". Consider reading the log reference, or accept it.
6. **opencode ceiling**: its `opencode` provider key is expired; critics use the owner's z.ai plan. Refresh the key or confirm z.ai stays the choice.
7. **Context isolation**: Kiro loads global steering into a fresh session; confirm whether a Kiro critic should run with `--agent` set to a bare agent.
8. **Claude accepts a nonexistent model** (sync probe 2026-10-28, macOS host, claude 2.1.310): `probe-critic-model.mjs` reports `missing-model: FAIL`, the harness accepted a model name that does not exist instead of erroring. A requested pin therefore proves nothing on its own; the same fix as gap 4 (check the recorded model against the pin) covers it.
9. **Codex ceiling unreachable on this host** (same probe, codex 0.164.0): the configured provider endpoint returns 404 "model does not exist" for `gpt-6.1-sol`, so Codex critics cannot run at the ceiling here. Point Codex at a provider that serves the ceiling model, or record the host as below ceiling. **Resolved on the Windows host 2026-10-31:** Codex 0.139.0 was below the 0.159 minimum; after upgrading to 0.166.0 the probe ran on `gpt-6.1-sol` at ceiling. Other hosts still need the check. The probe's Windows launch and old-CLI reporting are ticket 121.

## Acceptance criteria

- [ ] Each listed gap is resolved or recorded here as accepted, with a reason.
