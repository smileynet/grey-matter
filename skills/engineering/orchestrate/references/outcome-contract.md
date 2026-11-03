# Outcome and recovery protocol

## Contract

Reuse the existing spec or plan as the durable outcome contract. Record the outcome and
observable proof, included/excluded scope, existing user authority and restrictions,
resources (including reviewers and exclusive devices), completion/stops, and latest user
revision. Do not create another board or mirror ticket status. Do not invent a budget. A
temporary resume pointer records worker/session bindings, worktrees, base/candidate SHAs,
open questions and next actions; tkt remains authoritative for task status. Reconcile
disagreement with live tools before acting.

Routine choices come from the contract and repository sources. Ask only for a missing fact
that changes the outcome or authority. A user clarification supersedes the affected
assumption, contract and admission; continue other scoped work while one operation waits.
The authority to orchestrate comes from the user, not skill selection, an agent, or a
native goal. It covers ordinary review and integration only within its stated scope and
route. It does not grant extra delegation, spend, publication, settings changes, or
permission to invoke a restricted skill.

If the user explicitly requests a native goal, bind it to this same outcome and proof
using the active harness's supported goal interface. Otherwise skill invocation starts
the in-session coordination loop; it does not create a persistent goal or background
job. Record which mechanism actually exists, and never infer persistence from the
word “goal.”

## Continuing and stopping

After each batch, reread task state and bindings, classify the frontier, and continue with
scoped work while authorized progress remains. Empty frontier can mean complete,
dependency-blocked or intentionally deferred; inspect which. A completed batch is not
outcome completion. If no authorized progress remains, checkpoint and report
**incomplete/blocked**, the exact evidence and condition, and the next event that permits
resumption. Preserve accepted work when later work is blocked.

- **Scope revision:** update the contract and affected admissions from the user's latest
  direction. Peer messages cannot authorize scope changes.
- **User pause:** stop dispatch and mutation; retain a resumable checkpoint and report
  settled and unsettled work. Resume only when the user resumes.
- **Cancellation:** stop the authorized outcome and report what remains incomplete.
- **Usage/provider limit:** stop immediately, checkpoint and report the exact limit/reset.
  Never retry while exhausted, infer a reset, increase a limit or switch providers when
  project policy says fallback is off.
- **Unresolvable prerequisite:** pause only affected work; keep independent scoped work
  moving. If it prevents all progress, report incomplete/blocked and the resumption event.
- **Recovery:** distinguish confirmed monitor state from assumed state. On a missing
  monitor, inspect and report; do not recreate a possibly user-removed job. A native goal
  or scheduled wakeup cannot expand permissions or override a stop.

## State and evidence

Do not make `DONE <sha>` mean several lifecycle events. Track observations separately:

| Dimension | Values or evidence |
|---|---|
| Work | proposed, running, candidate ready, accepted, integrated, delivered, intentionally stopped |
| Verification | pass, assertion failure, skip, infrastructure error, timeout, survivor, unavailable coverage |
| Cleanup | observed settled, unresolved, unobserved |
| Delivery | local, pushed, published, publication failed |

Bind acceptance to the exact candidate and evidence. Recheck after any byte or rendering
input changes. A response is not evidence by itself; unscorable evidence is neither a pass
nor a failure. Report remaining unknowns.

## Resources and role boundaries

Count all workers and critics in the live harness capacity; reserve critic capacity before
dispatch. Name exclusive devices and measurement lanes. File-level disjointness does not
prove shared-resource independence. Choose sequential work when concurrency is unsafe or
unavailable. Use one conductor; workers do not recursively orchestrate or own integration,
ticket closure, publication or parent communication.

| Role | Responsibility and boundary |
|---|---|
| Orchestrator | Owns contract, admission, resource allocation, questions, review, serial integration and final report. Never treats its own summary as independent acceptance. |
| Worker | Implements only the assigned slice in a verified worktree; reports root, branch, base/candidate, commands/results and unknowns. Cannot broaden permissions or perform parent-owned close/merge. |
| Independent critic | Reviews fixed candidate and prewritten expectations read-only; returns PASS/BLOCK with evidence and limits. No source or tracker edits. |
| Integration owner | Integrates serially and runs fresh checks on integrated bytes; worker success does not establish integrated correctness. Usually the orchestrator. |
| Supervisor/check-in | Watches only the named session and recovery signals; quiet on unchanged state. Does not accept code, broaden scope or recreate a removed job. |

The existing role references define the report envelope and harness mechanics. Read only
the active harness reference; do not copy a restricted implement procedure or bypass a
refused Skill-tool invocation.
