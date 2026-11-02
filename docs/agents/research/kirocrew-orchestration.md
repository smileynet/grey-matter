# Kiro Crew orchestration: conductors and crewmates

**Question:** what can a harness-portable orchestrator skill learn from Kiro Crew's conductor and crewmate agents? The skill has one session pick open, unblocked, non-overlapping tickets, dispatch workers and reviewers, accept and close the work, and keep the human informed.

**Source:** `.references/kirocrew` (github.com/kirodotdev/KiroCrew, Apache-2.0), shallow clone at `cbf3ecce`, 2026-10-31. Agent configs installed locally in `~/.kiro/agents/kirocrew-*.json`. Paths below are relative to `src/kiro_crew/` unless they start with `docs/`.

**Status:** prior art, not authority. Every rule below is a candidate for grey-matter to accept or reject.

**Observed:** the ticket 128 spike (2026-11-01, Kiro Crew 0.11.1) ran the orchestrate loop through the built-in conductor. Results, including where the conductor departed from the rules below (it skipped `accept_eval.py` in one run and merged a README deletion without escalating), are in [harness orchestration primitives](./harness-orchestration-primitives.md#spike-results-kiro-crew-2026-11-01).

**Version mismatch:** the installed `kirocrew-conductor.json` is older than repo HEAD. Its prompt lacks the `work_dispatch` paragraph that `agent_parts/spec_prompts.py:84-88` contains. Read the repo for current behavior.

**Method:** two research subagents read the material. Every quoted snippet below was then re-read at the cited line by the session that wrote this note. Confidence markers:

| Marker | Meaning |
|---|---|
| **H** | Verbatim, re-checked at the cited line |
| **M** | Reported by a subagent with a line citation, not re-checked |
| **I** | Inferred |

## Where things live

- **System prompts.** These are Python strings in `agent_parts/spec_prompts.py`: conductor (61-365), work-ledger protocol (423-445), pipeline conductor (448-539), worker (542-599), security conductor (602-698).
- **Operating procedures.** These are builtin skills: `builtin_skills/goal-conductor/SKILL.md`, `pipeline-conductor/SKILL.md`, `security-conductor/SKILL.md` and `sage-review/SKILL.md`. `goal-ledger-conductor` is a deprecated alias.
- **Ledger server.** `mcp_work.py`. The dispatch wrapper is in `mcp_dashboard_session_tools.py:686-747`.
- **Decisions and RFCs.** `docs/decisions/`, `docs/request-for-change/rfc-conductor-*.md`, `docs/reference/ledger-conductor-sequence.md`.

## KAS under Kiro Crew 0.11.1 (2026-11-02)

This section traces the KAS backend in the installed Kiro Crew 0.11.1 package,
compares it with the installed Kiro CLI 2.37.1 and KAS engine package 0.66.70,
and checks the available local engine directories. The installed files are the
versioned primary source for Crew behavior; Kiro's current V3 docs are the
primary source for the public CLI/ACP contract. File paths below are relative
to `kiro_crew/` in Crew's installed Python package, or are linked public docs.
**Source-traced** means read from installed code, not a running session.
**Observed** means a direct local read or earlier runtime probe. Confidence is
high for those narrow statements and lower where explicitly marked.

### What KAS is

KAS means **Kiro Agent Server** in Kiro Crew's source. It is Kiro's V3 agent
engine exposed to a host such as Kiro Crew over ACP. Crew sends newline-framed
JSON-RPC through the child process's standard input/output; it does not call
the engine's private model loop. Kiro describes V3 as the shared harness used
by its IDE, web and CLI: “CLI V3 uses the same unified agent harness as Kiro IDE
and Kiro Web.” ([Kiro V3 overview](https://kiro.dev/docs/cli/v3/), current page,
updated 2026-10-31.) That is Kiro's product statement; the observations below
concern Crew's adapter.

**Public architecture, documented rather than locally exercised.** Kiro's
[engineering account](https://kiro.dev/blog/one-agent/) (2026-08-03) describes
the harness as a “standalone server process”. The client owns presentation;
the server owns conversation execution, tools, context and model interaction.
Clients can supply native tools, such as IDE file operations, instead of the
server's built-ins. ACP connects a client to the agent; MCP connects the agent
to external tools. The engine runs beside the code locally or remotely, rather
than moving local files and commands into the model provider's infrastructure.

Kiro's [turn description](https://kiro.dev/docs/how-kiro-works/) (updated
2026-10-23) says: “Context is assembled.” It describes a loop that collects
prompt/history/steering and attachments, calls the selected model, checks
proposed tools against policy and hooks, executes permitted tools, and feeds
results back until completion. Compaction manages growing context. This is the
product's documented architecture, not a model/tool execution test in this
research.

The current [permission reference](https://kiro.dev/docs/permissions/)
describes “deny > ask > allow > evaluate”. Its rules target capabilities such
as filesystem reads/writes, shell and MCP across scopes. Parent and subagent
policies both constrain subagent tool calls. User and workspace policies live
outside the repository; workspace trust and built-in invariants can still
require consent. Network host rules inside an enabled sandbox are a documented
first-match exception. This current native policy system should not be
confused with Crew's translation of older agent fields or its additional
approval gates below.

### Crew can reach the same engine in two ways

**Relay through `kiro-cli` (the default).** Crew launches the CLI's ACP
subcommand with `--agent-engine v3`. Installed `acp/kas_transport.py` says:
“the relay forwards ACP frames to KAS in both directions,” and defines
`KAS_RELAY_SUBCMD = "acp"`, `KAS_RELAY_ENGINE = "v3"`. `kiro-cli` therefore
owns how the extracted engine is found and launched. Crew does not locate or
spawn the CLI's internal engine files itself.

Authentication is intended to have two owners on this route. With CLI
ownership, Crew adds `--auth-method cli`; Kiro CLI resolves the token from its
own sign-in. Crew's `acp/kas_transport.py` says: “Who answers the engine's
credential callback is a per-spawn choice.” It intends to select Crew-vault
ownership by omitting the flag, then answer `_kiro/auth/getAccessToken` itself.
There is a compatibility question in the installed versions: **observed**
`kiro-cli acp --help` on CLI 2.37.1 says authentication defaults to `cli`,
and `client` is the value that forwards token requests to the ACP client.
Crew 0.11.1 omits the flag for its host-owned case. That help/source mismatch
means the intended callback path is not established by these two artifacts;
it does not by itself demonstrate an authentication failure. A fresh
`initialize`/auth callback probe would settle whether Crew launches a sibling
binary with different defaults or whether the CLI default changed underneath
this Crew build. The Crew-bundle route below has no such ambiguity in source:
Crew is always its auth owner.

**Crew's own pinned bundle.** With `agent.kas_bundle = true`, Crew launches
the KAS ACP server using its own installed Node runtime. The command is
`node --experimental-wasm-modules <acp-server.js> --transport=stdio
--auth=acp-callback`. Crew's `acp/kas_bundle.py` resolves the exact engine
version pinned by that Crew release; it verifies downloaded artifacts against
a SHA-256-pinned manifest. This route does not use the `kiro-cli` binary or its
credential store. Crew is always the auth owner here.

The engine version is distinct from the CLI version. **Observed on this host:**
`kiro-cli --version` returned `2.37.1`; its extracted KAS directory for that
CLI release contained `@kiro/agent` version `0.66.70`. Kiro Crew's own
`~/.kiro/crew/engines/kas` directory was absent. The local Crew config omitted
`agent.kas_bundle`, whose installed default is `false`. This confirms that the
Crew-bundled route was not installed/enabled here; it does not prove what route
every Crew installation uses. The CLI help/source auth mismatch above remains
unresolved and may affect the relay auth callback path. Kiro's release docs confirm that V3 has its own
ACP launch: “`kiro-cli acp --agent-engine=v3`” ([ACP migration guide](https://kiro.dev/docs/cli/v3/acp-migration/),
current page). Kiro also warns that ACP protocol version alone does not tell
you whether the server is V2 or V3 because “both negotiate version 1.” Use the
engine-selection argument or negotiated feature surface, not protocol version,
to identify it.

### Session lifecycle and agent selection

Crew's KAS harness is a client adapter around shared Crew runtime code. The
installed `acp/harness/kas.py` declares `PROTOCOL_VERSION_KAS = 1` and says the
agent definition is sent in `session/new`, “not from a flag.” The source-traced
flow is:

1. Crew selects the relay or its own bundle and starts the ACP process.
2. The client and server exchange `initialize` and capability information.
3. Crew resolves and projects the requested agent definition into the session
   start data under `_meta.kiro.customAgents`.
4. Crew creates or reloads the session, then selects the requested agent with
   `session/set_mode`. The harness treats this response as the confirmation;
   there is no `--agent` launch flag to assume worked.
5. Prompts, tool requests, permission requests and update notifications flow
   over ACP. Crew's runtime routes them to the owning session and its approval
   handlers.
6. On resume, Crew sends the custom agent definitions again. The KAS source
   explains that KAS keeps the registered batch for the session lifetime and
   that resuming without it can make the requested mode disappear.

Crew also chooses models per session over ACP instead of pinning `--model` to
the long-lived process. Kiro's V3 ACP guide likewise says to read the server's
advertised configuration options and use `session/set_config_option` for model
or effort. It says: “The running server's advertisement is authoritative.”
([ACP migration guide](https://kiro.dev/docs/cli/v3/acp-migration/), current
page.) Model names, extension methods and modes can vary by account/release.

**Observed initialize-only relay probe (2026-11-02).** The relay was started
with `--agent-engine v3 --auth-method cli`; it returned an `initialize`
response, protocol version 1, and exited cleanly. It made no reverse auth
request. Its response advertised `session/list`, `loadSession`, close/delete/
fork, MCP HTTP/SSE, and Kiro extensions for memory, context, compacting,
workflows, source providers and local/cloud-sandbox execution targets. These
are advertised surfaces only: the probe sent no `session/new` and no prompt,
so it did not exercise model access, tools or those methods. This CLI-owned
auth probe also does not resolve whether Crew's omitted flag correctly selects
the client-owned callback path. Local logging paths were removed from the
[sanitized handshake receipt](evidence/kas-initialize-20261102.json); no token
or model response was obtained or retained.

### Tools, MCP and custom agent profiles

KAS does not mean “Kiro Crew's orchestration tools are built into the engine.”
Crew supplies its own capabilities through MCP servers and ACP session data.
The KAS adapter's `session_mcp_servers()` returns the requested server array
unchanged; a separate Crew session-MCP layer resolves the servers, applies
trust and injects Crew's own servers. `kirocrew-work`, for example, exposes
`work_brief` and `work_report`. Other dashboard and filesystem/session-control
tools are also Crew-side services. KAS itself hosts its agent/tool loop and
connects to the declared MCP servers.

An owner-level agent profile can contribute prompt, tools, MCP servers,
permissions, hooks and other supported settings, but Crew applies a governance
ceiling before sending it. A project checkout is a trust boundary: the KAS
adapter's `PROJECT_SPEC_HONOURED_KEYS` is only `name`, `description`, `prompt`,
`tools`, `excludedTools` and `model`. Its comments explain that excluded fields
could otherwise make KAS launch commands, auto-approve calls, or read files.
Thus a project-local spec can describe an agent, but cannot itself grant
permissions or start its MCP server through this projection.

Approval is split between what the engine can see and what Crew authorizes.
Crew projects some eligible grants into KAS's session agent definition, then
records which tools it auto-approved. Tools that remain ask-gated can be
approved by Crew's gate after its own checks. The gate can also apply Crew's
KAS-specific shell `denyByDefault` allowlist and write `fallbackAction: deny`
allowlist. MCP `autoApprove` is not blindly copied through; the installed
`kas_agents.py` removes that key from the projected server entries. These are
source-level behaviors, not a claim that every profile or tool combination
has been experimentally validated.

### Sandboxing and practical limits

ACP is a protocol boundary, not an OS sandbox. The KAS server has its own
sandbox facilities, but Crew's relay command does not pass KAS's `--sandbox`
argument. Crew therefore relies on the sandboxing of the launched relay where
one exists, plus its own command/file permission gates. On this Windows host,
Kiro Crew reports that it has no OS-level sandbox backend; the relay route does
not turn KAS into process isolation. Crew's policy denial can still block a
particular tool call, but that is not equivalent to containing arbitrary code
or protecting host credentials from a compromised process.

**Observed in the earlier ticket 154 probe:** with the owner-scoped KAS profile
and YOLO off, the tested README deletion was blocked by KAS policy and the
worker reported `BLOCKED needs-human`; intended allowlisted shell commands
still prompted. That establishes one policy outcome, not complete sandboxing
or unattended pre-authorization. See [ticket 154's audited findings](./harness-experimental-features-20261101.md#ticket-154-kas-allowlist-probe-2026-11-01).

### What is directly known here

- **Source-traced, installed Kiro Crew 0.11.1:** relay and bundle launch
  contracts; ACP session selection; model/agent data sent per session; Crew's
  custom-agent projection, MCP injection point and permission gate.
- **Observed local state:** Kiro CLI 2.37.1 and its extracted KAS engine
  package 0.66.70 exist; Crew's own KAS bundle directory is absent and the
  omitted bundle setting defaults off.
- **Observed ACP runtime in ticket 155:** both external Claude and Codex ACP
  adapters initialized under ACP protocol version 1. That was their own
  protocol test, not a KAS session. KAS also advertises protocol version 1 by
  source; this environment's KAS session itself was not freshly started for
  this note.
- **Not established:** actual KAS model output in a new session for this note;
  which auth owner a particular user's next spawn will select without checking
  its current vault; every projected tool's behavior; a supported Windows OS
  sandbox for relay KAS; and cross-harness `work_report`/wake/acceptance.

This is a point-in-time description, not a promise that Kiro CLI or Crew will
keep the same KAS build, config keys or ACP extensions. For protocol clients,
follow the running server's `initialize` capabilities and use the versioned
Kiro/ACP documentation for the matching server generation.

The [independent scoped audit](kirocrew-orchestration-kas-20261102-audit.md)
found the claims supported (trust 0.95), with the actual Crew-owned auth callback
path still untested. After audit, the 9,752-byte private probe (script, raw
handshake and disposable Kiro home/logs) was recycled; its path was confirmed
absent. Existing CLI/engine installations were referenced in place and left
untouched; their removal was outside this research. The durable sanitized
receipt above contains no private logging paths or credential values.

## Vocabulary

| Kiro Crew term | Meaning | Closest grey-matter term |
|---|---|---|
| **conductor** | Owns one goal. Plans, dispatches, verifies, decides the next round. "Never does the work." | orchestrator |
| **worker** (crew member) | A session that owns exactly one item and reports as data | worker / implementer subagent |
| **Mate** (code: `crewmate`) | The user's standing teammate: a conductor agent plus a worker agent (`docs/decisions/2026-10-15-the-standing-teammate-agent-is-called-a-mate.md`) | (none) |
| **item** | One unit in the work ledger, with an acceptance bar | ticket |
| **work ledger** | Item store. The conductor writes some fields, the worker others, and the server derives the rest | tkt plus the orchestrator's dispatch log |
| **session ledger** | The conductor's own resume pointer: `goal`, `phase`, `next`, `tried` | handoff note |
| **patrol** | The conductor's wake loop, triggered by worker reports | the orchestrator's wait/monitor loop |
| **round** | One batch of dispatches, from the go-ahead to a round report | frontier pass |
| **acceptance evaluator** | A deterministic checker over a closed set of condition kinds | reviewer gate plus `tkt close` checks |

## Findings

### 1. The orchestrator never does an item's work (H)

- **Source:** `agent_parts/spec_prompts.py:78-80`. "Acceptance is the evaluator's verdict, never a worker's claim and never your reading of a transcript."
- **Tooling.** The goal conductor has no file-writing tool, and its shell is used only for its scripts.
- **Enforcement varies.** The mate conductor keeps its shell and file writers, so there the rule is carried by the prompt alone. A prompt rule is weighed by the model, not guaranteed (`docs/request-for-change/rfc-mate-owned-agent-config.md:239-248`, M).
- **Small goals.** With fewer than two qualifying items, the conductor does the work itself (`builtin_skills/goal-conductor/SKILL.md:78-79`, H): "Fewer than two qualifying candidates means the goal does not need you."

### 2. An item qualifies only if it is independent, assertable and long-running (H)

- **Source:** `goal-conductor/SKILL.md:56-77`.
- **Assertable** means the completion condition can be named before dispatch, as one of `pr_checks`, `pr_merged`, `file` or `human_approval`.
- "There is deliberately no 'run this command' kind." CI's verdict on the PR is the one that counts.
- An item whose completion cannot be stated as one of these is treated as needs-human, rather than inventing a condition.

### 3. "Done" is a claim; acceptance is a separate verdict (H)

- **Evaluate only items reporting `done`** (`goal-conductor/SKILL.md:431-443`). A world-state check passes early on a stub file or a PR that went green before its last commit, and "Evaluating that item returns a genuine `pass` on unfinished work."
- **Two-phase acceptance** (`:473-485`). "The worker's claimed `pr` is never read as the bar." The conductor promotes it after looking at it. Otherwise a worker "could point it at anybody's already-green pull request".
- **Verify the green independently** (`pipeline-conductor/SKILL.md:1227-1236`, H). "Never trust a worker's GREEN (workers believe their own summaries)." Check runs on the claimed head SHA, newest run per lane. "a green on yesterday's head is not green."
- **Retry limits.** Three acceptance failures close the item `rejected`. Two rounds in a row with nothing accepted means ask the user (`goal-conductor/SKILL.md:536-567, 666-668`, M).

### 4. Record the dispatch before starting the worker (H)

- **Source:** `goal-conductor/SKILL.md:243-249`. "an unbound running worker is neither visible nor recoverable."
- **Order:** create the item, then the session, then bind, then seed.

### 5. The brief is the worker's whole contract (M)

- **Source:** `goal-conductor/SKILL.md:211-241`. The seed names the observable outcome or invariant and nearby inputs to test.
- **Optional break attempt.** The seed may ask for a fresh subagent that sees the change but not the worker's reasoning, to try once to break it.
- **Name the procedure.** Workers get no per-message skill matching, so a seed that wants a procedure followed must name it (`:218-223`; `docs/architecture/context-management.md:589-605`).
- **Set the worker's agent explicitly** (`:272-278`, H). A child left on the default inherits the conductor's agent and cannot write files, so "the item would look stalled rather than misconfigured". Every harness has an equivalent: a child spawned with the parent's restricted tools or approvals.

### 6. The pipeline worker brief closes known failure modes clause by clause (M; selected clauses H)

Source: `pipeline-conductor/SKILL.md:847-1024`. The brief says "keep every clause — each one closes a failure mode." Its clauses:

- **Own exactly one item, and never contact the human directly.** The conductor reports.
- **Preflight against overlapping open PRs, branches and worktrees.** If the work is already covered, report `STANDDOWN: <reason>`, and never adopt another session's work in progress. A disproven premise also means STANDDOWN. A design decision means `PROPOSAL:`, without building it.
- **Use one worktree and branch per worker.** Run targeted tests by path.
- **Never commit from the shared checkout** (`:905-914`, H): "one `git commit -a` there … sweeps that staged work into your PR."
- **Never `git stash`.** All worktrees share one stash list.
- **Do not merge, and do not arm auto-merge.**
- **Start every turn with exactly one status prefix:** `WORKING`, `PR`, `GREEN`, `BLOCKED`, `STANDDOWN` or `PROPOSAL`. A `BLOCKED` carries evidence plus 2-4 options and stays until a ruling arrives.
- **"If a mutation does not redden, suspect the harness"** (`:891-904`, H). This catches tests that import the shared checkout instead of the worktree.

### 7. Status is structured data, not transcript (H)

- **The status set** is `progress`, `done`, `blocked` and `question`. "`blocked` and `question` differ by WHO must act" (`spec_prompts.py:557-560`).
- **Only `blocked`, `question` and `done` wake the conductor** (`:569-577`). "A turn of yours that ends having reported nothing wakes nobody."
- **Staleness flags** (`stale`, `orphaned`) are "the backstop for a worker that died, not a signal to lean on."
- **The summary is capped prose for context.** "A conductor that decides from prose is misbehaving" (`goal-conductor/SKILL.md:832-836`, M).
- **One instruction channel.** The `decision` field is the only instruction a worker takes from the conductor.
- **A person outranks the conductor.** A person steering a worker outranks the conductor, but a steer never moves the acceptance bar (`:399-407`, M).

### 8. Escalation follows a checklist, not mood (H)

The needs-human checklist (`goal-conductor/SKILL.md:676-698`):

1. Credentials, spend, deleting or overwriting someone's work, or anything irreversible never takes a default.
2. Anything else gets a default, recorded as an assumption.
3. Park only the affected item.
4. "The loop is never stopped for a question."

The checklist names both failure modes: "Guessing on a risky choice is the failure; stopping the whole patrol for one question is a failure too."

- **Pipeline conductor** (`pipeline-conductor/SKILL.md:67-87`, H). "Escalating is not the safe option". Four classes go to the human, and only these four: dismissing a human's recorded review, overriding a security-class finding, a disagreement between two maintainers, and content the conductor cannot verify.
- **Round 0.** "Decide, do not ask" (`goal-conductor/SKILL.md:159-166`, H). Put the plan with its Assumptions in one message, with at most one question folded in.

### 9. Overlap avoidance is admission control (M)

From `pipeline-conductor/SKILL.md:488-539, 743-746, 825-845` and `goal-conductor/SKILL.md:175-181`:

- Respect existing claims and assignees.
- Check for collisions: no open PR, merged PR, matching branch or worktree.
- Re-check each item live right before claiming it; a batch snapshot is never the authority.
- Claim atomically, and unclaim if any later step fails.
- Split large changes by exclusive file ownership, with a merge order.
- Keep concurrency at 2-3. The goal ledger enforces a hard cap of 6 open items.
- "Two owners politely yielding to each other is a deadlock" (`:1270-1272`). Decide ownership once.

### 10. Stuck workers get an intervention ladder (M)

Source: `pipeline-conductor/SKILL.md:1243-1272`. The rungs, in order:

1. Nudge.
2. A read-only inspector subagent returns one verdict: `healthy-slow`, `looping`, `blocked-misclassified` or `premise-wrong`.
3. Rule on the case: extend, re-dispatch fresh, adjudicate or descope.
4. Reclaim on an SLA breach.

"context poisoning rarely self-heals", so prefer a fresh re-dispatch over repeated nudges. After an outage, sweep the whole fleet, because the conductor "cannot detect its own loop's death".

### 11. Reviewers judge one change in a clean context, and only must-fix findings gate (M)

- **Code Review Sage** (`builtin_skills/sage-review/SKILL.md:12, 372-422`):
  - One isolated session per pull request, "never batch in your head".
  - A self-critique pass drops findings that an observable green gate already owns on the exact SHA.
  - The ship decision keys only on 🔴 must-fix findings.
- **Worker debate** (`goal-conductor/references/worker-debate.md:56-146`). Critics write their risk list *before* reading proposals, keep stable objection ids, and stop after at most 3 rounds, then a human rules.
- **The repo's accepted review RFC** (`docs/request-for-change/rfc-review-loop-and-escaped-bug-reduction.md:42-69`):
  - The gate is PASS or BLOCK only, and a BLOCK names a trigger and an observable wrong outcome.
  - Its evidence: 71.3% of risks that were set aside and later shipped as bugs had been advisory labels.

### 12. Context and state survive resets because the tracker holds them (M)

- **Two separate stores** (`goal-conductor/SKILL.md:707-751`). The work ledger holds items. The session ledger holds only `goal`, `phase`, `next` and `tried`. The injected snapshot is a teaser, so re-read the ledger every cycle.
- **Reset only at a round close** (`docs/request-for-change/rfc-conductor-round-reset.md:17-62`): never with a question pending, never mid-round, never after a failed ledger write. Compaction was rejected because the summary "still grows".
- **Prompt rules don't bound context.** "a prompt rule cannot bound the conductor's context" (`docs/request-for-change/rfc-conductor-rolling-reset.md:17-19`). The gateway enforces a cap instead (`dashboard/chat_turn/context_cap.py`). That RFC's frontmatter still says draft, but the cap is in the code.

### 13. Human surface: needs-you first, real counts, one board (M)

- **One board** (`docs/decisions/2026-10-10-conductor-board-tab-replaces-the-in-chat-board.md`). When a board tab exists, chat carries only "Needs you" lines plus one line on what changed and what's next. It never carries a second board.
- **No invented progress** (`spec_prompts.py:283-316`): "Needs you" first, real states only, "never a made-up percentage".
- **Derived numbers** (`:399-405`): "Read every number from a fold. Never type one."
- **Silence is a valid report.** "Say nothing unless there is a real signal" (`goal-conductor/SKILL.md:512-515`).

### 14. Close-out (M)

Source: `goal-conductor/SKILL.md:490-505, 700-705`; `pipeline-conductor/SKILL.md:1559-1611`.

- Close each finished worker in the same cycle.
- Never close one that is waiting on a person or driving an unmerged PR.
- Clean up worktrees without forcing; keep a dirty one and flag it.
- End with a final tally.

## Kiro Crew-specific: do not transfer as written

These are tied to Kiro Crew's own runtime:

- The `work_*` and `session_*` MCP tools, `work_dispatch` and `select_crew`.
- `monitor_start(watch="work-ledger")`, the patrol budget numbers (300-900 s) and `reset_conversation`.
- The context-cap token numbers and the session-ledger size caps.
- The Dashboard tab, `dashboard_write`, Ultra Mode labels, `[OPTIONS: …]` lines and `nothing_to_do`.
- `chat_tag` and its grants store. Ticket 95 tracks guarded use of `chat_tag` and `session_ledger_record` under Kiro Crew.
- The depth cap of 2 and nested conductors. The principle (bound nesting) transfers; the number is Kiro Crew's.
- Remote dispatch and folder scope, which are draft RFCs that haven't been built.

## RFC status (as of `cbf3ecce`)

| Status | RFCs |
|---|---|
| Shipped | Work ledger phases 1-4; round reset; approval hold; default patrol phase 1; context cap (in code) |
| Partial | Agent self-tagging (`chat_tag` v1); append-only ledger (only `crew/dispatch` and `crew/report` ship); item-total notice (#22417 open) |
| Draft, not built | Patrol session, folder scope, remote dispatch, sibling visibility, worker-to-worker messaging |
| Superseded | Rolling reset |

## Couldn't verify

- **The built-in `report` tool.** It appears in the conductor's `allowedTools` next to `session`, but what it does was not traced (`agent_materialization/conductor_agents.py:55`).
- **Not read in depth:** `rfc-worker-context-cap.md`, the `team-lead` skill, and the crew-log `envelope.md` and `errors.md` references.
