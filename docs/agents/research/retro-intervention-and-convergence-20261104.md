# Retro intervention and loop convergence (2026-11-04)

## Decision

**Adapt** the Kiro Crew convergence idea into a small reassessment prompt in
[`retro`](../../../skills/engineering/retro/SKILL.md) and its
[convergence reference](../../../skills/engineering/retro/references/convergence.md).
Do not add a numeric diff threshold, round limit, new validator, global hook, or CI
mechanism. In a review-fix or qualification/debugging loop, note diagnostic progress,
repaired behavior, and repeated preparation without progress. Diff growth is a reason to
explain scope, not a verdict. The orchestrator makes the first proportionality decision;
the existing [escalation contract](../../../skills/engineering/orchestrate/references/escalation.md)
still owns unresolved decisions.

## Evidence and scope

The parent-retained private retrospective `retro-orchestration-trace-20261104.md` describes
an 85,981,115-byte, 32,844-record trace sampled record-by-record, with focused rereads at
records 19,679, 22,809, and 31,623–32,807. The broad extraction was truncated; coverage
is partial, and earlier monitor exchanges were not fully sampled. The missed-wake
admission has nearby same-agent activity, but the trace does not show the exact native
call or the preceding idle state. Treat it as evidence-limited, not proof of a missing
mechanism or a deterministic contract failure.

Three orchestration work sequences were compared using their retained tickets, source
history, and evidence reports. This is a source/evidence review, not a fresh replay of
those sessions or a fresh run of their checks:

| Sequence | Before and after | What a growth signal would say |
| --- | --- | --- |
| #236 Claude owned-stream repair | Some historical cases reported `PROTOCOL_ORDER` or `UNEXPECTED_RECORD` faults, but their specific offending frames were not retained; their exact protocol causes remain unproved. A separate older case lacked a launch baseline, so its descendant cleanup was also unproved. Do not attribute these gaps to duplicate initialization. A later source/diagnostic pass addressed strict handling of an identical initialization re-emission; the separate v10 case observed `system_init_repeated` as status without resetting the active input or resolving readiness again, then accepted two correlated turns. This does not retroactively explain or repair the older failed intent. See [#236](../../../.tickets/236-claude-owned-stream-transport.md), its [qualification report](session-messaging-claude-owned-20261104.md), and commits `38dec5e` / `2f83117` (250 insertions across three files). | The normalization change would trip a raw size threshold. Its separate observed v10 behavior and regression rationale matter; the exact causes of some earlier faults remain unproved. |
| #237 Kiro owned-ACP close repair | A successful two-turn native run still ended its update pump as `DISCONNECTED`. Source inspection localized the mismatch to owner-requested stop being reported as an unexpected exit. The focused correction distinguishes `CLOSED`, preserves earlier protocol faults, and adds a regression; no second native run was needed. See [#237](../../../.tickets/237-kiro-owned-acp-transport.md), its [qualification report](session-messaging-kiro-owned-20261104.md), and commits `455f606` / `b70520f` (52 insertions across three files). | Small growth corresponds to a specific corrected behavior. Counts alone do not establish whether the repair is proportionate. |
| #179 orchestration retrospective | The retained trace reported repeated agent activity and an admitted over-elaborate process, while existing Codex guidance already distinguishes messaging a running agent from waking an idle one. The exact tool call and prior idle state are absent. The retrospective routed dashboard refresh and concurrency findings to existing owners and proposed no new wake mechanism. See the parent-retained `retro-orchestration-trace-20261104.md`, [Codex harness guidance](../../../skills/engineering/orchestrate/references/harness-codex.md), and [#179 outcome](session-messaging-outcome-20261104.md). | No code diff is the right outcome while the alleged trigger is unproved. Repeating preparation without new evidence is a reason to reassess, not an instruction to add a retry guard. |

These cases support a qualitative signal, not a universal numeric one: at reassessment,
name what new evidence was learned, what behavior now works or remains broken, and what
preparation repeated without changing either. Then inspect the actual diff and explain
new code, files, flags, or abstractions against the concrete blocker and acceptance
condition. The samples are different parts of one orchestration workstream, not a
representative estimate across all project sessions.

## Intervention choice scenarios

These offline examples check routing logic only; no scenario was executed against a live
project or used to add a project-specific schema or policy.

| Evidence | Class | Proportionate response |
| --- | --- | --- |
| A cleanup proposal labels a retained-looking directory ambiguous, but its current consumers and recovery value are unknown. | Contextual judgment. | Use artifact hygiene's ownership and retention criteria to inspect consumers and recovery need; preserve the uncertainty in the recommendation. Do not invent a universal retention validator. This follows the judgment boundary recorded in [#247](../../../.tickets/247-cleanup-review-scenarios.md). |
| A session registry has the wrong version or malformed `sessions` data. | Observable data-contract defect. | Reuse the boundary validation in `session-messages.mjs` and its existing test suite; if a demonstrated persisted-data path is uncovered, extend that owning fixture rather than add another checker. Source inspection confirms validation exists; it does not establish a fresh malformed-registry test result. A malformed-data example does not justify a second schema engine. |
| A check already exists, but a code path that should invoke it never reaches the command. | Missing execution path, if the caller contract requires it. | Wire the existing command into that owning workflow or document its invocation at the actual change point. Do not create another check. For example, `check-tool-guidance.mjs` has its own test but is not selected by `scripts/gates.json`; its owner documents an on-demand invocation when adding an operator. First establish whether the change required that manual command and whether the caller omitted it. Add a stage gate only if the check independently meets [local-gate admission](../local-gates.md#admitting-a-check). |
| A report says the worker wake was missed, but the trace lacks exact call and prior idle-state evidence; existing harness guidance already names the running/idle distinction. | Unverified trigger; possible existing guidance not followed, not yet proven. | Preserve the evidence limit, inspect the available native event/source, and make no new rule or validator from the admission alone. Reassess only if the exact failure becomes observable. |

This preserves #251's intervention distinctions: missing guidance, ignored guidance,
missing execution path, and actual contract defect call for different responses. It also
preserves #117's distinction between source inspection and a freshly executed check.

## Prior art and fit

Kiro's article describes comment severity tiers, repeated review rounds in which fixes
attracted further comments, and a later readiness signal that requires expected checks to
have run and passed ([Kiro engineering, Oct. 26, 2026](https://kiro.dev/blog/software-factory-stability/)).
Kiro Crew's current [CI and review guidance](https://github.com/kirodotdev/KiroCrew/blob/main/docs/ci/ci-and-reviews.md#over-engineering-resistance)
also gives findings a concrete trigger and observable outcome, and routes proportionality
judgment to its review process. These are prior art, not authority. Its multi-reviewer
pipeline, CI readiness aggregation, and repository-specific reviewer policy rely on
KiroCrew's own infrastructure; grey-matter chose the existing `implement` blocker rule,
local-gates admission contract, and orchestrator escalation boundary instead. No clone
or new model call was used.

## Acceptance evidence

- **#225 current behavior:** `implement` already limits same-ticket work to blocking
  findings, and `local-gates.md` already applies proportionality to checks. These do not
  directly cover code growth inside an iterative review or qualification loop; the
  convergence pointer fills that narrow gap.
- **#225 signal and replay:** three retained sequences above were compared by actual
  trigger, behavior, and changed files. The Claude normalization change is not attributed
  to the earlier unexplained protocol failures; it is supported by its distinct
  initialization behavior, regression rationale, and later bounded observation. The Kiro
  case shows a focused repair; the wake case remains unproved and receives no mechanism.
  This is source/evidence inspection, not a new execution result.
- **#225 rule:** one convergence reference is linked from `retro`, `orchestrate`, and
  `implement`; it has no numeric cap. The orchestrator remains first decision-maker under
  escalation. Reachable crash, security, and data-loss repair remains complete-work scope.
- **#251 routing:** the four scenarios above distinguish contextual judgment, ignored
  guidance (only when observed), a missing execution path, and a contract defect. Existing
  checks are reused, and an unwired check is not automatically a new gate.
- **Checks:** no scenario-specific tests or new validator were added. Historical fixture
  results are identified as recorded in their source reports; this report does not claim
  to have rerun them. Current documentation and syntax checks are reported separately in
  the implementation handoff.
