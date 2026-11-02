# Kiro Crew Mate recovery: source guide

**Date:** 2026-11-02. **Target runtime:** installed Kiro Crew 0.11.1 on Windows.
The installed package under `%USERPROFILE%/AppData/Local/Programs/KiroCrew/`
is the primary source for the live spike. Its
`dashboard/mate_thread_wakes.py` SHA-256 is
`3d28987f8fbe48ba73f60b358e4e74aefd9ed0330d9d9bcb4b65ff0ad41c1c47`.
The local `.references/kirocrew` checkout is different: `cbf3ecce` / 0.12.0.
Do not treat its restart behavior or tests as proof of 0.11.1 behavior.

## What the installed code says

**Observed in installed source, not yet demonstrated in a live gateway:** a
worker's turn end can send a report to the Mate that created it. The module
docstring says, “after a restart or a revive,” it can establish that relation
from “the crew log's gateway-written session tree”; “transcript metadata alone
wakes nobody.” A live test should inspect the persisted parent edge, because a
similar transcript label does not prove the gateway accepts the worker as Mate-owned.

In `dashboard/mate_thread_wakes.py`, `_lineage_names(slot_key, creator_key)` calls
`session_control_parts.session_tree._slot_tree_parent(slot_key)` and returns true
only when the tree is known and its parent equals the creator. `reporting_creator`
first requires the worker's `_created_by`; it then accepts an in-process witness
or that persisted lineage and requires the creator slot to exist and be a Mate
thread. If the tree is unknown, unavailable, or unseeded, the installed code
returns false. Source excerpt: “An unknown tree (crew log off, projection
unseeded) answers False.”

The turn-end hook records a report only when `reply_text is not None`. It calls
`_record_report`, which retains at most one latest excerpt per worker and schedules
a flush. An idle Mate receives one hidden turn; if the Mate is busy, the report
waits for that turn to finish. The module describes pending reports as in-memory
gateway state. Thus the supported restart scenario to test is a worker that is
restored and finishes a turn after restart: the parent edge survives, but a
pending report itself is not described as durable.

`dashboard/mate_welcome.py::dispatch_hidden_turn` refuses to start a hidden turn
while shutdown/restart is underway. A report emitted during gateway drain is a
different case from one emitted by a resumed worker after the new gateway is
serving.

## Live probe discriminator

Use a private `KIROCREW_HOME` and a separate `KIRO_HOME`, after checking both
resolvers in the installed version. Sign in only through the previously verified
CLI-owned path. Create or confirm a Mate, spawn one worker from that Mate, and
record opaque slot/session keys plus the persisted crew-log parent edge. Restart
the isolated gateway while the child is still resumable. After startup, verify
that the worker session is actually revived and the same child-to-Mate edge is
known; then let that worker finish with a unique harmless marker. Observe a new
Mate-thread turn containing the report marker and the stored worker report. A
relisted Mate chat or surviving transcript alone is not a wake.

Run a control where the worker finishes before restart, then restart and inspect
whether that report is redelivered. The source describes pending reports as
process memory, so failure to redeliver that pre-restart pending entry is
consistent with the code. Keep this control separate from post-restart resumed
worker behavior. Capture startup, session-resume and report/turn timestamps so
the observer can distinguish a real report-triggered wake from a welcome, a
scheduled check-in, or manual chat.

## Can't verify from source alone

- Whether the installed 0.11.1 gateway restores a particular Mate worker after a
  real process restart, including its ACP session identity.
- Whether that resumed worker's turn end reaches the Mate hook and starts a
  Mate turn in the new process.
- Whether report notifications or any worker-to-Mate wake works when the crew
  log or its session-tree projection is disabled or incomplete.
- Whether the task's selected CLI authentication actually authorizes the model
  turn used in the probe. A source-level auth branch does not prove credentials
  or model access.

**Source records:** installed package files beneath
`%USERPROFILE%/AppData/Local/Programs/KiroCrew/resources/backend-dist/kirocrew-backend/Lib/site-packages/kiro_crew/`:
`dashboard/mate_thread_wakes.py`, `dashboard/mate_welcome.py`, and
`dashboard/session_control_parts/session_tree.py`. The separate 0.12.0 reference
checkout includes `test/test_mate_thread_wakes.py`, whose restart-drain test
explicitly suppresses a wake during shutdown; that is a useful test-design hint,
not evidence about installed 0.11.1.
