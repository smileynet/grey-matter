# Kiro Crew

Source: [ticket 128 results](../../../../docs/agents/research/harness-orchestration-primitives.md#spike-results-kiro-crew-2026-11-01)
and [prior art](../../../../docs/agents/research/kirocrew-orchestration.md).
Observed 2026-11-01 on 0.11.1/KAS; the installed conductor differed from source HEAD.

## Bind before seed

On installed 0.11.1, ordinary conductor children use `agent.acp_backend`.
`agent.member_acp_backend` applies to crewmate DMs and their own workers;
`session_create` has no backend override. Do not present it as a mixed-backend
setting for the built-in KAS conductor. Both external adapters initialized in
[ticket 155](../../../../docs/agents/research/harness-experimental-features-20261101.md#ticket-155-mixed-backend-setup-probe-2026-11-02),
but cross-harness reports, wakes and acceptance remain unverified. A
`spawn_run(backend=...)` probe exercises a different dispatch path.

Keep tkt authoritative; map each ticket to a work-ledger item. When live tools
support work_dispatch, inspect its schema and returned binding before using it.
The observed path was: create work item, session_create with explicit writable
worker agent/model, bind item to session, then session_send the filled brief.
session_create has no cwd parameter: the worker creates the prescribed worktree
from the named base SHA and works by absolute path.

Map native work_report done/question/blocked to the portable status protocol.
Arm monitor_start with work-ledger watch and yield through the native event
mechanism; work-ledger wakes were observed. session_send resumed T2's same worker.

## Host gates and acceptance

- Choose the auth owner explicitly. On Crew 0.11.1 / CLI 2.37.1 Windows,
  [ticket 186](../../../../docs/agents/research/kirocrew-orchestration.md#ticket-186-auth-owner-routing-2026-11-02)
  observed that Crew's omitted-flag host-auth argv behaves like CLI ownership;
  an external ACP host receives token requests with `--auth-method client`.
  Real Crew-vault delivery was not tested. Use a verified CLI-owned private
  probe or resolve #190 before relying on Crew-owned relay identity; never log
  tokens or silently change sign-ins to make a probe work.
- Session control and Windows sandbox availability were host blockers. Request
  only the specific missing authorization; leave persistent host configuration
  to an explicitly authorized change.
- Without YOLO every conductor shell command needed approval; unanswered prompts
  expired after 600 seconds. YOLO was global to all chats until shutdown, and
  still blocked raw main pushes. It is not an unattended production fallback.
  [Ticket 154's probe](../../../../docs/agents/research/harness-experimental-features-20261101.md#ticket-154-kas-allowlist-probe-2026-11-01)
  confirmed one deny-by-default README deletion block and a needs-human report,
  but explicitly allowed Git/npm commands still prompted. Keep interactive
  approvals available; do not assume this is an unattended pre-authorization
  path. Never script approval answers.
- KAS project-local agent specs cannot grant permissions or add MCP servers.
  Have the configuration owner materialize the policy in an authorized owner
  agent home. For disposable probes, use `KIROCREW_HOME=<probe-home>` and
  `KIRO_HOME=<probe-home>/kiro`; do not rewrite the normal user agent directory.
- Treat the fixture's tracked README deletion as needs-human **before dispatch**.
  Both spike runs deleted and merged it under YOLO; the brief did not enforce
  escalation. Real-work authorization must be read from the user, not inferred
  from a worker's done report or the ticket's title.
- A file acceptance checks existence, not correctness. pr_checks returned fail
  with no checks in the no-CI fixture. Choose a named human approval for a real
  approval boundary, or independently run the project's local gate and spec
  check; never invent hosted CI. A conductor-recorded pass is not evidence.
- Read-only reviewers were not probed. Use a tool-restricted reviewer only after
  checking its actual tools; otherwise label instruction-only isolation and use
  an available verified read-only review surface for consequential work.
- Requested model was recorded; served model was unproven. Respect host memory
  pressure as well as the portable cap: one run had to go sequential.

## Bookkeeping and chat surface

The conductor can run tkt/git/checks with authorized shell tools but lacks file
writers. Use a separately scoped bookkeeping worker for dashboard edits, after
implementation workers have settled. In PR mode its bookkeeping goes through
a PR; a denied raw push is not permission to route the same push through tkt.
The chat widget and ASCII sketch rendered; delivery-dashboard remains the
durable board. Its schema governs the visual.

Ticket 95's placement decision is **harness reference**, per
[proposal 17](../../../../docs/agents/proposals/17-orchestrator-skill.md#4-per-harness-references).
Apply the shared [ticket-state mirroring](../../../../docs/agents/kirocrew-ticket-state.md)
after each owned tracker transition. It also covers single-ticket orient/implement
sessions; absent tools add no requirements to other harnesses.

After settlement close worker sessions, inspect/remove merged worktrees and
local branches, and report any remote branches retained. Unbind fixture chats
before cleanup; active bindings caused Windows EBUSY in the earlier run.
