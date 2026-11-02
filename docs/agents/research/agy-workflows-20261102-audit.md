# Audit: native agy workflow spike (2026-11-02)

## Score: 0.93 / high

The central runtime findings are supported by primary local evidence: the captured native calls, actual fixture Git objects and independent test output. The report appropriately leaves model identity unresolved. This audit used the receipt and selected observable tool events, not private model reasoning. Re-review confirmed that the source guide corrections now match the receipt.

## Per-claim verdicts

| Claim | Verdict | Check |
| --- | --- | --- |
| Native `run_workflow` can fan out two fixture jobs to separate registered Git worktrees and return typed results | **Supported** | Case 19's exact `Script` invokes `parallel` with two `workspace="branch"` agents and a strict schema. Parent output contains two typed results. Both child transcripts show actual Git roots and common directory. Independent `git worktree list --porcelain` and commit inspection corroborate distinct registered worktrees. This supports this bounded run; no timing capture proves the jobs overlapped in wall-clock time. |
| A worker can ask a question, receive a controller answer, then continue in the same native conversation | **Supported** | Case 19 has T2 finish `QUESTION` in child `f8513d97-51a8-4f40-a9f0-2814205478b3`, then receive the scripted `welcomeBack` answer and finish `DONE` with commit `5fa6cededfcff9581a19d9da32d017fd5eb6667b`. This is a scripted fixture answer, not a human UI handoff test. |
| Native finish validates the declared schema | **Supported** | Case 13's child first submitted a numeric `marker` and an extra property. The observable native error named both violations; the corrected object then completed. This is a positive and negative validator control. |
| `pipeline` returned sequential typed results | **Supported** | Case 20's native `run_workflow` output lists FIRST then SECOND as done and returns both objects. This was a marker control, not code review or merge. |
| Independent review, merge and fixture tests succeeded | **Supported** | The preserved verification records show exact changed paths for both commits, successful merges, `npm.cmd test` with 3 passed and 0 failed/skipped/cancelled/todo, and an empty `git status --short`. These checks were run by the outer controller, as the report says. |
| The probe establishes autonomous production ticket orchestration | **Unsupported if inferred** | Admission of the held jobs and the scripted follow-up were fixture instructions. No GitHub remote, autonomous admission decision, native review/merge stage, or real ticket closure was exercised. The report explicitly limits its conclusion, which is correct. |
| Per-role `flash`/`pro` settings establish the served model or prove that `pro` is ignored | **Unsupported; report correctly withholds this conclusion** | Requests and opaque `gen_metadata` labels are captured, but neither a documented field contract nor decoded served-model field was found. Similar labels are observations, not served-model identity. Keep the limitation and #194 follow-up. |
| SDK docs document `parallel`, `pipeline`, typed workflow primitives and `run_workflow` | **Supported, scope-limited** | Current first-party [SDK changelog v0.1.22](https://antigravity.google/docs/changelog) calls these beta Python SDK workflow primitives and `agent.beta.run_workflow()`. It does not specify equivalence with the CLI tool; the source guide correctly separates them. |
| CLI custom-agent docs describe workspace discovery and model tier metadata | **Supported, surface-qualified** | Current [Custom subagents docs](https://antigravity.google/docs/subagents) list `.agents/agents/...`, frontmatter including `model` (`inherit`, `flash`, `pro`), and the CLI's `invoke_subagent`. The docs establish the subagent control, not workflow `agent(type_name=...)` routing. |

## Findings for the producer

1. **Resolved in the updated guide:** its introduction now points to the completed 20-case receipt, and it replaces the pending probe/rerun language with observed case 17 and 19 outcomes.
2. **Still important and accurately recorded:** the workflow script calls `parallel`, and separate roots/results were observed, but no start/end timestamps prove simultaneous execution. The updated guide explicitly avoids a wall-clock overlap claim.
3. **Resolved in the final guide:** case 04 is identified as profile selection, case 06 as a native call denied by permission enforcement, and cases 10/11/19/20 as successful workflow execution. The case 01 statement now correctly says the planner declined an advertised tool, without implying absence.

The findings file has verifiable claims and passes the silent-stub check. The trial did not alter the public SDK or establish served model identity.

## Re-review and cleanup disposition (2026-11-02)

The source-guide introduction, pending-rerun wording and case 04/06 capability wording were corrected. The final [receipt cleanup record](evidence/agy-workflows-20261102.json) lists the fixture, private probe, Python temporary link directory and four native worktree-parent directories as recycled with absence verified. It records the probe directory as 1,136,732 bytes. The native histories/databases retained through #194 total 6,816,238 bytes; the 91,648-byte Python hardlink was moved into the retained case `be551703-5692-4940-841f-6a57daa1b754` history after Windows rejected recycling it. Global settings remained unchanged. The receipt explicitly says the earlier partial-cleanup per-path sizes were not saved, so those unknown sizes are not represented as zero.

I rechecked the final source guide against the promoted receipt. All three findings above are resolved; no audit finding remains for the producer.
