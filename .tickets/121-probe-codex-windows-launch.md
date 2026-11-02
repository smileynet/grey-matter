---
id: "121"
title: "Critic probe launches Codex on Windows and says when the CLI is too old"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "On Windows the probe reaches a Codex installed as a `.cmd` shim, covered by a fixture."
  - "For a model with an officially documented CLI minimum, an older CLI reports that model-specific minimum; unknown floors remain unresolved rather than inferred."
  - "`docs/agents/harnesses.md` records the Windows install pitfall and the working launch path."
  - "`node scripts/gate.mjs pre-merge` passes."
tags: ["type:bug","stream:test-verification"]
---
# Critic probe launches Codex on Windows and says when the CLI is too old

## What to build

Intent source: the 2026-10-31 sync follow-up that upgraded Codex 0.139.0 to 0.166.0 on this Windows host.

- `scripts/probe-critic-model.mjs` spawns `codex` without a shell (line ~32). On Windows only a real `codex.exe` resolves, so a Codex installed as a `.cmd` shim reports `unavailable: codex is not on PATH` even though it runs from a terminal.
- bun 1.3.12 crashed while linking the upgraded package and left `~/.bun/bin/codex.bunx` empty, which made `codex` unrunnable until it was repaired by hand. The working workaround is a copied native `codex.exe`, which goes stale on the next upgrade.
- With Codex 0.139.0 the probe reported a bare HTTP 400 ("model not supported"). At filing,
  `docs/agents/harnesses.md` generalized a CLI 0.159 minimum to 6.1 models. The current
  model-specific primary-source correction is recorded below.

Make the probe resolve Codex the way the shell does on Windows (a `.cmd` shim or the package's own launcher), and report a CLI older than the documented minimum as its own state with the fix. Record the Windows install pitfall (bun global install, stale copied exe) in `docs/agents/harnesses.md`.

## Context

Files: `scripts/probe-critic-model.mjs` and its test, `docs/agents/harnesses.md` ("Critic model"). Ticket 92 gap 9 covers the Codex ceiling on other hosts.

## Acceptance criteria

- [x] On Windows the probe reaches a Codex installed as a `.cmd` shim, covered by a fixture.
- [x] For a model with an officially documented CLI minimum, an older CLI reports that model-specific minimum; unknown floors remain unresolved rather than inferred.
- [x] `docs/agents/harnesses.md` records the Windows install pitfall and the working launch path.
- [x] `node scripts/gate.mjs pre-merge` passes.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: reproduce native Windows shim/package-launch behavior with owned CLI fixtures, and qualify
unsupported-version diagnostics independently. Treat the old model/CLI minimum in the incident as
historical; reverify the current governing requirement before encoding it. The POSIX critic fixtures
skip on Windows, so those results do not establish this acceptance.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Primary-source correction 2026-11-02

Worker and root checked [OpenAI's model documentation](https://learn.chatgpt.com/docs/models).
Its 0.159.0 CLI floor applies explicitly to GPT-6.1 Terra. The page gives Sol CLI usage but
does not establish a Sol minimum. Encode only a documented model-specific floor; an
unsupported/access response for Sol must remain unresolved with availability/client guidance,
not be diagnosed as a proven old-CLI cause. Keep the chosen critic model unchanged and use
owned CLI fixtures; this ticket authorizes no live model call or harness upgrade.

## Delegated implementation 2026-11-02

Worker commits 6c2c6a2 and 61aed5f added Windows shim launch fixtures and model-specific
minimum diagnostics. Critic found a downstream cmd argument-injection risk; the corrected
public model-ID boundary rejects metacharacters before launcher/version invocation.
Renewed Spec/Standards/security review accepted the correction. Native Windows fixtures
passed five tests; eleven POSIX tests skipped and are not Windows execution evidence.
Root integrated the source and observed all 19 pre-merge commands pass. Canonical deploy
check and deployment subsequently passed, installing 50 skills. No model was switched or
CLI upgraded. Unknown Sol floors and unsupported/access responses remain unresolved.

The first red fixture accidentally resolved the installed Codex through inherited PATH.
It ran for 30 seconds and returned not-authenticated; provider/network contact is unknown,
and no successful model result was observed. The worker stopped, isolated PATH/home/config,
cleared inherited API/runtime overrides, and required a fake-launch receipt thereafter.
This incident is not evidence of a successful live probe. Retain the owned worker checkout
and dependency junction through final stream integration cleanup.

## Resolution (2026-11-02)

done: Windows Codex shim probing and model-specific CLI diagnostics shipped, reviewed, merged, pushed and deployed. Initial inherited-PATH fixture launched installedCLI and returned unauthenticated; provider/network contact unknown, corrected fixture isolation thereafter. No live successful model proof claimed. Evidence promoted in ticket/source; retain t121-worker/dependency junction and shared test-verification artifacts through final stream cleanup. Dashboard visual acceptance pending.

### Verification
1. ✓ On Windows the probe reaches a Codex installed as a `.cmd` shim, covered by a fixture. — "Native Windows owned .cmd shim fixtures5pass;11POSIXskips. Critic injection finding fixed with model-ID validation before launcher/version; fake receipt required. Initial accidental installedCLI returned not-authenticated after30s; provider contact unknown, no successful model run."
2. ✓ For a model with an officially documented CLI minimum, an older CLI reports that model-specific minimum; unknown floors remain unresolved rather than inferred. — "Official OpenAI model guide supports Terra0.159.0 floor only; fixtures cover model-specific minimum and unknown Sol availability remains unresolved. No CLI upgrade or model switch."
3. ✓ `docs/agents/harnesses.md` records the Windows install pitfall and the working launch path. — "Harness guidance documents Windows shim/install pitfall and working launch path; independent Spec/Standards/security critic accepted corrected source."
4. ✓ `node scripts/gate.mjs pre-merge` passes. — "Root integrated full premerge19/19 commands passed; canonical deploy check/default passed50skills. Native and skipped outcomes distinguished in ticket."
