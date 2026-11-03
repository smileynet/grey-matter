# Harness experimental features: follow-up spikes and QoL options

## Ticket 194: Antigravity child model evidence (2026-11-02)

**Request controls documented; served child identity still unverified.** Custom
`invoke_subagent` frontmatter and workflow `agent(..., model=...)` are separate
interfaces. The documented hook `modelName` and active-session status-line model
fields do not establish a child-scoped result for the tested workflow release.
Opaque database labels are not independently interpretable served-model evidence.

The [qualification report](agy-model-routing-20261102.md),
[receipt](evidence/agy-model-routing-20261102.json) and [independent review](agy-model-routing-20261102-audit.md) qualify
the #157 comparison below. Do not treat a requested per-role tier as a cost or
capability guarantee, or infer that a `pro` request was ignored from a label scan.

## Ticket 193: Antigravity regex approval overlap (2026-11-02)

**Discrepancy reproduced; internal matching cause unresolved.** Identical Ask
and Allow command regexes executed `git --version` again. Literal/broad Ask
controls rejected the command, while identical regex Deny produced a matching
deny error. No effective rule enumeration was obtained. The [report and local
upstream issue brief](agy-approval-overlap-20261102.md), [receipt](evidence/agy-approval-overlap-20261102.json)
and [audit](agy-approval-overlap-20261102-audit.md) preserve the bounded result.
Use an independently checked matching Deny when blocking is intended; do not
rely on this regex Ask override. No general shell-confinement fix is established.

## Ticket 190: Crew-owned auth route (2026-11-02)

**Supported bundled route qualified through a credential-free failure path.**
Crew's Windows relay still omits the client ownership flag. Its documented
`agent.kas_bundle=true` option selects bundled KAS with `--auth=acp-callback`.
A private direct bundled-engine probe received eight host credential requests;
fixed credential-unavailable responses produced the expected prompt error.
This tests the callback path, not real Crew vault delivery. Historical CLI-owned
success is reused only for the exact matching executable hash. The [report](crew-client-auth-remedy-20261102.md),
[receipt](evidence/crew-client-auth-remedy-20261102.json) and [audit](crew-client-auth-remedy-20261102-audit.md)
state version, identity and end-to-end integration limits. No installed product
or global credential setting was changed.

## Ticket 189: Kiro ACP teardown remains blocked (2026-11-02)

**Fresh model-bearing failure reproduced; no shutdown fix verified.** Kiro
2.37.1 / KAS 0.66.70 still emits the five-second EOF error and exits 1 after
completed and canceled turns, even after successful `session/close`. Prompt
results and durable marker reload succeeded; captured descendants were absent
at the final poll. Empty-session close success does not fix this model-bearing
path. The [report](kiro-acp-shutdown-20261102.md), [receipt](evidence/kiro-acp-shutdown-20261102.json)
and [audit](kiro-acp-shutdown-20261102-audit.md) leave the shutdown criterion
unmet. Retest on a changed Kiro/KAS build or newly supported method. Live GUI,
auth and independent runner trials can proceed with that caveat.

## Ticket 161: Kiro V3 workflow monitor (2026-11-02)

**Recipe launch and limited monitor controls observed; full ticket loop unverified.**
Kiro CLI 2.37.1 V3 launched the four-step recipe and progressed to the land step.
An input pause accepted a response and continued; a keyboard pause request showed
`pausing...` before a return to running, without a captured safe-boundary paused
state. Retrying restarted the errored land step, but no successful completion,
worker worktree, commit or landing was observed.

The [report](kiro-workflows-20261102.md), [receipt](evidence/kiro-workflows-20261102.json)
and [independent audit](kiro-workflows-20261102-audit.md) separate installed schema,
documented controls and native observations. Empty tool trust exposed approval
prompts; local read results appeared during ambiguous approval interaction.
This is not proof of an approval bypass. Workspace integrations were inventoried
and a private profile was used, but inherited global-hook isolation remains
unknown. No persistent trust or global workflow setting was installed. Recipe
order itself does not guarantee Git isolation or independent acceptance review.

## Ticket 188: Codex companion-host layout (2026-11-02)

**A same-version session-scoped invocation ran one harmless command.** The
PATH-selected Codex 0.166.0 executable reported its missing sibling code-mode
host. Identical executable bytes in the installed optional Windows platform
package, beside the signed companion, ran the read-only fixture Git status
command with native shell exit 0 and empty output. No binary was installed,
copied or replaced, and global configuration was not edited.

The [report](codex-tool-host-20261102.md), [native receipt](evidence/codex-tool-host-20261102.json)
and [independent audit](codex-tool-host-20261102-audit.md) preserve package
ownership, hashes, matched attempts and exact cleanup. This isolates the
observed launch-layout difference without relying on the app's separate alpha
build. The internal vendor path is not a documented stable launcher contract;
durable installation repair, write/approval behavior and broader tool coverage
remain unverified. This does not retroactively verify #159's message/wake tests.

## Ticket 160: Claude background messaging (2026-11-02)

**One native cross-session message/reply/idle exchange confirmed.** Claude Code
2.1.316 on Windows returned a worker marker and a separate `notify_when_idle`
notice. The idle notice reports a turn becoming idle; it is not accepted ticket
output. A preliminary background marker session ran in the worker checkout;
the actual disposable fixture rejected background and worktree dispatch as
`Workspace not trusted`. No persistent trust was accepted to continue.

The [dated report](claude-background-20261102.md), [native receipt](evidence/claude-background-20261102.json)
and [independent audit](claude-background-20261102-audit.md) distinguish this
bounded exchange from unverified fixture worktrees, safe branch pushes and the
documented hour-long idle reaper. The exact owned background session was stopped
and removed, its absence independently checked, and the fixture/raw artifacts
recycled. Settings hashes were captured after the run only; they do not prove
before/after equality. No autonomous review/merge loop was established here.

## Ticket 159: Codex dispatch feature toggles (2026-11-02)

**Couldn't verify runtime dispatch or wake behavior.** Codex CLI 0.166.0 accepts
process-only overrides for `multi_agent_v2`, `agent_message_board` and
`wake_on_agent_messages`. The matched no-flag/v2 attempts and a saved-session
control all reported a missing code-mode host, empty worker receivers and no
child result despite exit 0. Catalog availability is not execution evidence.
Spawn/depth effects, message delivery, same-worker continuation and polling
replacement remain unverified; #188 owns the separate setup diagnosis.

The [dated report](codex-dispatch-20261102.md), [native receipt](evidence/codex-dispatch-20261102.json)
and [independent audit](codex-dispatch-20261102-audit.md) preserve exact attempts
and limits. The critic accepted the bounded conclusion. Exact owned fixture,
raw transcripts and saved session record were recycled and verified absent.
No persistent setting write was performed; pre/post configuration hashes were
not captured, so byte-level invariance is not claimed.

## Ticket 157: native agy workflows (2026-11-02)

**Answer: yes for the bounded typed fan-out; model pinning couldn't be verified.**
Windows agy 1.4.12 ran two fixture tickets in separate registered Git worktrees
through native `run_workflow` and `parallel`. Both returned schema-validated
results. The controller supplied a scripted answer to one worker's question;
that same conversation continued and committed the second job. This confirms
the captured mechanism, not an autonomous production orchestrator.

The [20-case native receipt](evidence/agy-workflows-20261102.json) records exact
prompts, session settings, tool calls/results, custom profiles and independent
Git/test checks. The [source guide](agy-workflows-source-20261102.md) distinguishes
installed CLI guidance from public SDK documentation. The installed builtin
skill SHA-256 is `4A524107CB6173D75A54C2A7DE3ADDEB413D7BDB868C8279682DED74672BEB1E`.

### Observed controls and fixture results

| Probe | Native evidence | Classification |
| --- | --- | --- |
| Default planner attempts 01–03/05 | Tool advertised, planner declined to invoke it | Inconclusive for availability; planner behavior only |
| Explicit custom controller 06/09/10 | Native call first denied; exact script grant then hit Windows Store Python alias; process-only real Python path then printed marker | Expected permission rejection; infrastructure failure; positive pass respectively |
| Typed agent 11 | Parsed strict object from native child `finish` | Pass |
| Invalid result 13 | `finish` rejected number instead of string and extra property; corrected result accepted | Pass: negative validator control |
| Parallel model controls 12/16 | All typed marker results returned | Pass for parallel mechanism; model selection unresolved |
| Ticket attempts 14/15 | Extra ungranted `git rev-parse HEAD` stopped worker before finish | Permission failure; not proof of parent-finish cancellation |
| Ticket attempt 17 | Worker searched the home directory outside its job; native read denial stopped it | Permission failure; boundary kept closed |
| Bounded tools 19 | Both jobs committed in separate worktrees; T2 returned QUESTION then DONE in the same conversation | Pass for bounded fan-out and scripted follow-up |
| Sequential pipeline 20 | FIRST then SECOND typed markers returned | Pass for sequential primitive; no native review/merge claim |

Case 19 parent is `8746fca1-ffcf-4a36-a5ae-99a4d1c56d81`; T1 child
`52011d6a-6126-4a98-a2d4-a5b7861e2088` produced commit
`65f9ad082e9fd1c714300706715a8eb842d1ffc4`; T2 child
`f8513d97-51a8-4f40-a9f0-2814205478b3` produced
`5fa6cededfcff9581a19d9da32d017fd5eb6667b`. Native `git rev-parse`
outputs and the controller's independent `git worktree list --porcelain` show
separate roots with the fixture's shared Git common directory. The installed
guide calls branch workspaces clones; observed Git registration is more precise.

Independent controller inspection confirmed that T1 changed only `src/a.js`
and `test/a.test.js`, implementing multiplication, and T2 only `src/b.js` and
`test/b.test.js`, implementing the supplied returning-user greeting. After
controller-run `git merge --no-edit <each exact commit>`, `npm.cmd test` passed
all three tests, with zero failed/skipped/cancelled/todo; `git status --short`
was empty. These review/merge checks were performed outside agy's workflow,
so native autonomous acceptance, ticket closure and merge are **not verified**.
Holding overlapping/dependent/risky tickets was scripted admission, not proof
of an agent scheduler making those decisions. The fixture had no GitHub remote.

### Model selection: couldn't verify

Custom profiles requested flash, pro and inherit. Workflow controls also
explicitly requested `model="pro"`; a separate custom `invoke_subagent` control
was attempted. The opaque native `gen_metadata` blobs contained Flash Tiered
labels for flash/pro workflow requests, and Argon Medium for the inherit
control matching its parent. No verified first-party descriptor establishes
that these fields identify the model that served generation. Neither a working
pro pin nor an ignored configuration is established. The [#194 qualification](agy-model-routing-20261102.md)
keeps this comparison unverified: custom subagent frontmatter and the workflow
model argument are request controls; hook/status-line fields have no established
child-result mapping here. Use neither the requested tier nor an opaque label
as a served-model, capability or cost guarantee.

### Settings and limits

Every run used disposable session JSON with `toolPermission: request-review`,
`accept-edits`, no skip-permissions flag and no broad command grant. The final
worker allowlist named fixed Git/test commands and the exact workflow script.
The denied home search was never granted. Worker tools were narrowed to avoid
that unnecessary search. The Windows Store `python3` alias failed; an existing
CPython 3.13.14 executable was exposed through a disposable same-drive hardlink
and child-process PATH/PYTHONHOME only. No global Python or agy settings changed;
all three recorded global hashes matched after every case. A CLI exit 0 or
SUCCESS was not counted as workflow success without native tool results.

Cleanup and retained-evidence disposition are recorded in the receipt after
independent audit. No production integration was built by this spike.

## Ticket 158: narrower agy permissions (2026-11-02)

**Answer: yes, for the tested fixed commands and directory.** On Windows agy
1.4.12, headless workers ran selected `git`, `npm` and `tkt` commands under narrow
session-only grants. A separate Ask-regex overlap behaved unexpectedly and is
tracked in #193. This is rule-matching evidence, not an OS sandbox qualification.

The [22-case native receipt](evidence/agy-permissions-20261102.json) contains the
exact settings, attempted native tool parameters, native outputs/errors and file
bytes. The [primary-source guide](agy-permissions-source-20261102.md) separates
documented behavior from observed results. Binary SHA-256 is recorded; all runs
used Gemini 3.8 Flash Low, `accept-edits`, `toolPermission: request-review`, no
skip-permissions flag and no sandbox flag. Rules were passed with `--settings
<private-json-file>` and were never installed globally.

### Observed command controls

| Case | Native observation | Classification |
| --- | --- | --- |
| Empty allow/ask/deny; `git --version` | `denied_actions` contains `command`; stderr says headless cannot prompt | Pass: expected baseline rejection |
| Allow `command(regex:^git --version$)` | `run_command` DONE, exit 0, `git version 2.53.0.windows.2` | Pass: exact positive |
| Same rule; `git status --short` | Native automatic denial | Pass: near-miss rejection |
| Same rule; `git --version; echo T158_CHAIN > chain-marker.txt` | Native automatic denial; root confirmed marker absent | Pass: this composition rejected |
| Allow `command(regex:^npm test$)` | Native TAP output: 1 test passed, zero failed/skipped/cancelled/todo | Pass: intended fixture test ran |
| Allow `command(regex:^tkt ready$)` | Native output lists the four fixture frontier tickets | Pass: intended ticket read ran |
| Exact literal grants for `git --version` and `git rev-parse --show-toplevel` | Both native commands completed; latter returned the fixture root | Pass: literal narrow rules also worked now |

These current controls supersede a recommendation to assume that only
`command(*)` works. They do not erase the earlier #129 observation. The original
exact `git rev-parse --show-toplevel` command now works with an exact literal
grant under the explicit session policy above; the cause of the historical
difference was not established. Do not generalize these fixed-command grants to
all subcommands or arguments, or to shell/parser bypass resistance.

### Observed precedence gap

**Assertion failure, reproduced twice:** put the identical
`command(regex:^git --version$)` in both Allow and Ask. The native tool still ran
`git --version` with exit 0. The same Allow with literal Ask
`command(git --version)` or broad Ask `command(*)` was automatically denied.
Putting the regex in Deny alongside Allow produced native ERROR:
“Matches user-configured deny rule.” No human approval was supplied.

An Ask-only regex case was denied, but that alone does not prove its Ask rule
matched, since the default also asks. A `list_permissions` attempt returned a
model assertion that the tool was unavailable even though init advertised it;
there was no native tool invocation. Effective scope enumeration is therefore
**unverified**, and model prose was not treated as tool absence. #193 owns the
matching/precedence diagnosis. Until explained, do not depend on regex Ask
overriding matching Allow rules. The literal/broad Ask and regex Deny controls
are bounded alternatives, not a complete permission strategy.

### Observed file controls

The first three write cases used a sibling under system TEMP. All succeeded,
including the no-grant baseline and the near-miss directory. **Uninformative for
confinement:** the [first-party CLI changelog](https://antigravity.google/docs/changelog?tab=cli) documents TEMP writes as a default
grant since 1.1.9. That is separate from the workspace default; those positives
were not counted as evidence that a directory rule bounded access.

Fresh controls moved outside both the fixture workspace and system TEMP, to the
owned disposable `D:/code/t158-outside-1` folder, and explicitly set
`allowNonWorkspaceAccess: false`:

- **Pass — baseline rejection:** no file grant, target `allowed/baseline.txt`;
  native `write_file` denial and root confirmed the file absent.
- **Pass — directory grant:** Allow `write_file(D:/code/t158-outside-1/allowed)`;
  native tool DONE and `allowed/nested/inside.txt` contained exactly
  `T158_ALLOW_DIR` (root-read bytes).
- **Pass — sibling rejected:** same grant, target `allowed-near/outside.txt`;
  native denial and root confirmed it absent.
- **Pass — explicit workspace denial:** Deny the fixture's `permission-protected`
  directory; its existing `blocked.txt` remained exactly `BEFORE_T158`, and the
  native tool returned a permission error. This checked a deny overriding an
  implicit workspace write grant, not an allow-list confinement of the workspace.

### Scope and remaining unknowns

The three inspected global files (CLI settings, shared config, hooks) had the
same SHA-256 before and after all 22 calls. No global settings were edited.
Inherited Project/Shared scopes were not fully enumerated; the baseline controls
establish rejection only for the specific ungranted commands/paths exercised.
The host's existing CLI settings contain a Windows escape sequence a strict JSON
reader rejected; it was left untouched, and no parser behavior was inferred from
that separate reader error. Every model call used session JSON written by the
probe. All CLI exits were 0, including denied actions; native events and actual
file bytes, not exits or model assertions, determine the classifications.

**Couldn't verify:** why overlapping regex Ask failed; historical #129 cause;
other accounts/OSes/builds; all shell composition or quoting; OS containment;
whether `--settings` replaces rather than combines every inherited scope;
interactive approval flow; native workflow/subagent propagation (owned by #157).

The [independent audit](agy-permissions-20261102-audit.md) rated the bounded
conclusion 8/10 after checking all 22 private cases, native histories, the
external file bytes and current primary sources. It corrected an initial audit
path error before finishing; its raw-evidence limitation no longer applies.

**Artifact disposition:** after that audit, recycled the owned private probe,
98,411-byte fixture, 41-byte TEMP write controls, 14-byte external write controls,
and 32 native history paths (7,474,074 bytes). Six native conversations and their
brain folders (12 paths, 2,797,398 bytes) remain only for #193's diagnosis; the
receipt lists exact IDs and the close-of-#193 removal condition. All 22 CLI
parents were waited to exit; a later PID-only check briefly matched a reused
process ID, so no process was signaled on that basis. No recorded `agy.exe`
identity remained at final check. Shared native backend daemons were neither
attributed nor terminated. The existing global CLI settings (225 bytes), shared
config (748 bytes) and hooks (383 bytes) were left unchanged. The earlier prepared
98,400-byte fixture mentioned in the ticket was not found by the bounded search;
no deletion of that unknown location is claimed. The browser module remains only
through final dashboard verification/publication, then is recycled.

## Ticket 156: Mate restart and report recovery (2026-11-02)

**Answer:** yes for the tested graceful restart between worker turns. The same
worker resumed and its fresh report woke the restored Mate. **A better standing
orchestrator is not established:** the awakened Mate fabricated the next task,
and its later acceptance claim repeated the worker's report without an observed
independent review. Keep an external requirements and acceptance check.

Primary runtime evidence is the [sanitized receipt](evidence/kirocrew-mate-recovery-20261102.json).
The [installed-source guide](kirocrew-mate-recovery-source-20261102.md) quotes the
restart lineage and wake conditions. Target: installed Crew 0.11.1, Windows,
CLI 2.37.1, KAS backend, Claude Haiku 4.5 for both roles. The reference checkout
advertises 0.12.0 and differs; its tests were not counted as a runtime pass.

### Observed recovery

- **Pass — authentication and scope.** A separate process-only `KIROCREW_HOME`
  and `KIRO_HOME` owned the private agent files, Crew logs and native sessions.
  The gateway's child relay PID 508 was observed with `acp --agent-engine v3
  --auth-method cli`; the Mate returned `T156_AUTH_OK` in a no-tools turn. This
  checks the chosen owner and working model access, not the account's identity.
  No credential values are in the receipt; no login/logout, provider switch,
  global configuration edit, or GitHub fixture repository was used.
- **Pass — persisted parent and native worker identity.** Before restart, the
  worker returned `T156_CHILD_READY`, then the Mate acknowledged it. The native
  owner-verified shutdown helper acknowledged graceful stop; gateway 65196 and
  its observed relay were absent before gateway 44592 started with the same
  private home. Both restored slots were idle with zero new-process turns.
  The worker was initially `released`, not a running process. Its parent edge
  survived while `lineage_minted` reset to false. A fresh worker-only request
  produced `T156_POST_RESTART_REPORT T156_CHILD_READY`; both assistant markers
  occur under the same native SID in the CLI's persisted messages.
- **Pass — fresh report causes a Mate turn.** No human prompt was posted to
  the Mate between startup and that worker request. The Mate then entered a
  fresh hidden turn, said “Worker survived gateway restart and is ready,” and
  called `session_send`. This proves more than reappearing chat history. The
  completed pre-restart report did not cause a new turn in the observed startup
  window; durable replay of a queued, undelivered report was not tested.

### Observed planning failure and bounded correction

**Assertion failure — autonomous task fidelity.** On the report-driven wake,
the Mate sent “Fixture ticket 1: Create file .../gm-t156-fixture-1/test.txt” with
`T156_FIXTURE_1_DONE`. Actual ticket 1 was to add `multiply` with two test cases.
The worker wrote the invented file in the fixture root, outside its own worktree.
That file existed with the invented marker. This was not a valid ticket result,
and it does not establish worktree containment. The probe's initial handoff
allowed only a readiness reply, so the automatic dispatch also ran ahead of the
requested pause. No dangerous deletion job was dispatched.

**Pass after explicit correction — worker implementation only.** The controller
restated actual T1, limited writes to `src/a.js` and `test/a.test.js` in the
existing worker's worktree, and prohibited merge/close/other work. The same
worker committed `f284b5f2772f56e208d3c5934a92ce48f6949f8f`; the actual diff changed
only those two files and the worktree was clean. Root independently ran `npm
test`: the add and multiply subtests passed (2 tests, zero failures, skips,
cancellations or todos). The Mate said “Tests verified” after reading the worker
report, but no independent Mate diff/test review was observed. No merge or fixture
ticket closure was performed. This bounded corrected job is not a five-ticket
trunk-loop acceptance, nor a matched comparison with the built-in conductor.

### Source conditions, infrastructure and remaining unknowns

**Installed-source observation:** `dashboard/mate_thread_wakes.py` explicitly
accepts a worker “after a restart or a revive” through the crew log's
“gateway-written session tree”; its `_lineage_names` fallback checks the persisted
parent. “Pending reports live in memory.” Shutdown suppresses a new hidden turn.
The live result therefore supports resumed-worker reporting with valid lineage,
not durable in-memory-queue recovery or recovery with the crew log disabled.

**Infrastructure findings:** initial API probes incorrectly reused a one-use URL
token and received 403; a native link-to-cookie exchange fixed the controller.
Windows `stop --expect-pid` refused because it requires Linux pidfd, and signaled
nothing. Crew's owner-verified `_request_gateway_shutdown(port)` acknowledged
the intended private gateway's graceful shutdown. Startup materialized a
639,150,592-byte default embedding model; that owned cache was measured and
recycled with the disposable home. A footprint inspection passed the same
scratch directory again as `--path`, double-counted it, and hit the chosen 1 GiB
cap; the nonduplicated inspection reported `review` with open-file visibility
unavailable, not a complete audit. This is covered by the overlapping-roots
acceptance criterion in ticket 184. No low-space threshold was approached.

**Independent audit:** the [fresh-context review](kirocrew-mate-recovery-20261102-audit.md)
scored the bounded conclusion 8/10 and corroborated native `resumed:false` then
`resumed:true` events for the same worker SID, report receipt and the Mate's new
response. It treated the finite no-replay window and auth/scope observations as
weaker bounded evidence rather than general guarantees.

**Artifact disposition:** after that raw-evidence audit, both private gateways
were gracefully stopped; all 31 recorded final-generation processes and
descendants were absent. Recycled the owned 645,577,177-byte private probe and
101,974-byte fixture, including the generated model, worktree, credentials and
raw transcripts. Keep only the small sanitized receipt, source guide and audit.
The existing 639,150,592-byte global embedding model and unrelated sessions were
left untouched. The disposable browser module is retained only until the final
dashboard capture and publication checks, then recycled.

**Couldn't verify:** forced crash or interruption during a tool call; pending
report durability; automatic resumption of an in-flight job without a new prompt;
recovery with missing lineage; model/backend variations; a full autonomously
reviewed-and-landed trunk loop; superiority over the conductor. No integration
recommendation follows from this single successful recovery case.

**Question:** which experimental, preview and opt-in features of each harness are worth a hands-on spike for the orchestrate loop ([proposal 17](../proposals/17-orchestrator-skill.md)), and which are quality-of-life switches the user may want?

**Gathered:** 2026-11-01, during the Kiro Crew spike (ticket 128). Kiro Crew was read directly from its installed package. Claude Code, Codex, kiro-cli and Antigravity were read by four research subagents, each limited to read-only commands against the local install plus the official docs.

**Local versions:** Kiro Crew 0.11.1 (auto-updated from 0.9.0 mid-spike), Claude Code CLI 2.1.316, codex-cli 0.166.0, kiro-cli **2.37.0** (the [primitives note](./harness-orchestration-primitives.md) recorded 2.34), agy 1.4.12.

**Confidence:** **L** = seen in the local install (help text, settings listing, config schema, bundled files). **D** = documented only, not run. **I** = inferred. No feature below was exercised unless marked as run.

## Kiro Crew

### Settings changed on this machine during ticket 128 (user-approved)

| Setting | Was | Now | Why |
|---|---|---|---|
| `agent.sandbox_allow_unsandboxed_exec` | `false` | `true` | 0.11.1 has no OS sandbox backend on Windows and refuses every agent spawn while this is `false` (L, run). 0.9.0 ran on the same config by delegating to kiro-cli's sandbox. |
| `agent.session_control` | `false` (stored pre-#8375 default) | `true` | `session_create` is refused without it, so a conductor cannot dispatch (L, run). |
| `kirocrew config defaults --adopt` | old defaults | current | Worker turn cap 100 → 1000, spawn stagger 2 → 0.25 s, watchdog stall window 1 h → 1.5 h, plus `instances.warm_set_cap` and `stt.language_code`. |
| `mcp_gateway.enabled` | `false` | `true` | Sessions share MCP server processes; the host had 0.6–2.5 GB available against Kiro Crew's 4 GB pressure line. |
| `dashboard.session_grid` | `false` | `true` | Split view, for watching a conductor beside its workers. |

YOLO (`POST /api/chat/mode {"mode":"yolo"}`) lasts until the next shutdown, and both restarts and the self-update cleared it.

### Follow-up features to test

- **Mates (0.11 "Mate 2.0").** A Mate owns an agent file under `~/.kiro/mates/agents/`, talks through a conductor chat that keeps notes, and hands work to a worker session that follows its Profile (L: changelog). Spike: can a Mate replace the built-in `kirocrew-conductor` as a standing orchestrator? It has a persistent conductor with a revivable worker, and a worker's report wakes the Mate after a restart.
- **Multiple backends.** `agent.acp_backend` and `agent.member_acp_backend` accept `claude`, `codex`, `deepseek`, `goose`, `kas`, `kiro`, `opencode` and `pi` (L: live config schema). The settings UI tags all but KAS and kiro-cli "Experimental" (L: UI bundle, I: which ones). Spike: a Kiro Crew conductor on KAS dispatching Claude Code or Codex workers, so the ledger, patrol and board are Kiro Crew's while the work runs on another harness.
- **KAS allow-lists instead of YOLO.** 0.11.1 makes KAS honour an agent spec's allowed shell commands and allowed paths, and refuse the rest under deny-by-default (L: changelog). Spike: rerun P3 and P13 with a worker spec that allows `git`, `npm` and `tkt` in the fixture and denies file deletion. This is the fix for this spike's P13 failure, where YOLO let a worker delete the README.
- **The acceptance evaluator.** In this spike the conductor never ran `scripts/accept_eval.py`. It recorded verdicts from its own diff review, and recorded ticket 5's "file exists" acceptance as a pass on a deleted file (L, run). Spike: does the conductor run the evaluator when the brief doesn't also ask for a spec check?
- **`dynamic_capabilities` (preview, per Mate).** A Mate can find tools its worker lacks and request them on a card (L: schema). Relevant only with Mates.

## Other harnesses

### Claude Code 2.1.316

| Feature | Enable | Status | Seen | Orchestration value |
|---|---|---|---|---|
| Background agents and agent view | `claude --bg`, `claude agents [--json]`, `attach`/`logs`/`stop`/`respawn` | Research preview | L | High. Each `--bg` session gets its own worktree, and `--json` lists sessions for scripting. Idle unattached sessions are reaped after about an hour (D). |
| Cross-session messaging | `SendMessage`, `ListAgents`; `crossSessionInbound` accept/hold/refuse | GA, on by default on Windows | L (a messaging pipe exists in this session) | High. `notify_when_idle` gives a worker-done signal. Unattended `-p` workers need `crossSessionInbound:"accept"` (D). |
| Dynamic workflows | `Workflow` tool, `/workflows`, `workflowSizeGuideline`, `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` | GA on paid plans | D (L: skill present) | High. Scripted `agent`/`pipeline`/`parallel` with a resume journal. |
| Agent teams | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Experimental | D | Medium. Shared task list and gate hooks. One team per session and no resume; split panes don't work in Windows Terminal (D). |
| Auto mode | `--permission-mode auto`, `claude auto-mode …` | Opt-in | L | High. Unattended workers without bypass. |
| Retry watchdog | `CLAUDE_CODE_RETRY_WATCHDOG=1` | Opt-in | D | High for unattended runs. Waits out 429/529 and usage-limit resets. |
| Subagent model and effort | `CLAUDE_CODE_SUBAGENT_MODEL[_FORCE]`, `CLAUDE_CODE_SUBAGENT_EFFORT` | Opt-in | D | Medium. One cost tier for every worker. |
| `claude ultrareview` | subcommand | Research preview (D, from a digest) | L | Medium. A cloud review stage before landing. |
| Stream forwarding | `--forward-subagent-text`, `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS` | Opt-in | L/D | Medium. Lets an outside orchestrator parse worker output. |

### Codex 0.166.0

Feature flags are listed by `codex features list` (name, stage and state only, no descriptions). `--enable <name>` turns one on for a single run without writing config.

| Feature | Stage (L) | Orchestration value |
|---|---|---|
| `multi_agent_v2` | stable, off | High. Next-generation spawn path; 0.166 adds V2 child-creation APIs (D). What it changes is undocumented. |
| `agent_message_board` + `wake_on_agent_messages` | under development, off | High (I). A shared channel between agents, plus waking an idle orchestrator on a post. |
| `codex agents` (shared daemon) + `codex queue --thread … --resume` | stable | High. One view of every session; an outside process can message a running or saved worker. |
| `exec --json`, `--output-schema`, `-o` | stable | High. Machine-readable worker results. |
| `[agents]` config: `default_subagent_model`, `default_subagent_reasoning_effort`, custom role TOML files | documented | High. Cheaper workers and repo-checked role files. Subagents can't override sandbox, approval or MCP settings (D). |
| `rollout_budget`, `token_budget` | under development, off | Medium. Caps a runaway worker's spend. |
| `guardianv2`/`v3` | under development | Medium. The auto-review layer behind `--approve-for-me`. |
| `cloud exec`, `remote-control` | experimental | Medium. Offload or remote workers. |
| `prevent_idle_sleep` | experimental, off | QoL. Stops the machine sleeping mid-turn. |

Not confirmed: a `max_depth` config key, or why `multi_agent_v2` is "stable" but off.

### kiro-cli 2.37.0

| Feature | Enable | Status | Orchestration value |
|---|---|---|---|
| Workflows | `chat.enableWorkflows`, `chat.workflowLaunch` (when-asked, large-tasks or delegate-all), `/workflow run` | Opt-in, needs V3/KAS (L keys, D docs) | High. Recipes with steps, loops, parallel branches, join policy and independent reviewers capped by `maxIterations`. Pause, resume and retry. |
| V3 engine | `--v3` or `chat.agentEngine=v3` | Early release | High. Workflows, cloud sessions, the session dashboard and `permissions.yaml` need it. |
| Headless driver | `chat --no-interactive --output-format stream-json`; `kiro-cli serve`, `acp` (hidden) | Undocumented (L) | High. A programmatic surface for an outside orchestrator. |
| Cloud sessions | `--cloud --repo owner/name` | Paid plans (D) | High. Up to 10 sandboxes, with results returned as PRs. |
| Subagent timeout | `api.subagentTimeout` | Setting (L) | Medium. Idle deadline per child. |
| Approve for me | `/permissions` (V3) | New in 2.36 (D) | Medium. Auto-approves routine actions and blocks risky ones. |
| `chat.enable*` experiments | `/experiment` or settings | Experimental (L) | TodoList (resumable worker state) and CodeIntelligence (LSP) are medium. Delegate is deprecated in favour of subagents. Checkpoint, Tangent and Thinking are low. Knowledge is one index per agent, so it isn't shared between workers. |
| Memory (`memory.mode`) | setting, KAS only | Opt-in | Medium, with a risk: memory is per user across workspaces, so it could leak between workers (I). |

### Antigravity (agy 1.4.12, app 2.28.2, IDE 1.107.0)

| Feature | Enable | Status | Orchestration value |
|---|---|---|---|
| `run_workflow` | built-in tool; `agent(prompt, schema, role, type_name, workspace, model)`, `parallel`, `pipeline` | Shipped (L: builtin skill) | High. agy fans out over tickets itself, with typed results and a worktree per agent. |
| Custom agents with a model per role | `.agents/agents/*.md` frontmatter `model:`; `--agent <name>` | Shipped (D) | High. Worker and reviewer tiers declared in the repo. It may also settle the spike's unverified per-child model (P8). |
| Paired stream-json I/O | `--input-format stream-json --output-format stream-json`, `--json-schema` | Shipped (L) | High. A long-lived worker driven from stdin. |
| Permission rules | `command(regex:…)`, `write_file(path)`, `mcp(server/*)`; deny beats ask beats allow | GA (D) | High. The docs say `*` inside a rule is literal. But `command(git)`, `command(git *)`, `command(git:*)` and an exact command were **all observed denied** in ticket 129, so the docs and the run disagree. `regex:` is untested. |
| Permissioned GitHub grants | `gh.merge({"org":…,"repo":…,"pr":"*"})` | Shipped (L: builtin skill) | High. Merge rights on one repo only, with no shell `*`. |
| `--mode auto` | flag, Shift+Tab | Preview (D) | High if available. It was refused here with "not available for this account". The docs exclude business accounts, and this machine's auth type is `gateway`, so the account is the likely cause (I). |
| `/teamwork-preview` (agent teams) | slash command, paid plans | Research preview (D) | Medium. Google's own many-agent orchestration. |
| PreInvocation hooks with `terminationBehavior` | `~/.gemini/config/hooks.json` | New in 1.4.11 (D) | Medium. A policy gate before each worker turn. |
| `artifactReviewPolicy` | `/config` (currently `asks-for-review`) | Opt-in (L) | Medium. Headless top-level runs can stall on artifact review (I). |

## By surface: TUI and GUI

The tables above came mostly from CLI help and settings listings, so they lean toward the terminal. This section places each feature on the surface that has it, from a second research pass (2026-11-01) that also read the desktop apps' bundles and the IDE extensions. ✓ present, ✗ absent, ~ partial, ? unverified. The flags behind each one are in [harness surfaces](../harness-surfaces/README.md).

### Claude Code

| Feature | TUI | GUI | Headless | Status |
|---|---|---|---|---|
| Agent view | ✓ | ? | `claude agents --json` | Research preview (D) |
| Agent teams | ✓ | ✗ | ✓ | Experimental, env var (D) |
| Fast mode | `/fast` | VS Code "Toggle fast mode"; desktop ? | `--settings '{"fastMode":true}'` | Available on Opus 5.5; bills usage credits (D) |
| Ultracode | `/effort ultracode` | VS Code switch under Effort | `--effort ultracode` | Needs workflows and `xhigh` (D) |
| Computer use | macOS only | **Desktop app** (Windows and macOS), Settings > Enable computer use | ? | Research preview, paid plans (D) |
| Dispatch from the phone | ✗ | **Desktop app only** | ✗ | Paid plans (D) |
| Browser pane, pane pop-out, scheduled tasks, SSH/WSL sessions | ✗ | **Desktop app only** | ✗ | GA (D) |
| Agent map (`/tasks` tree), Focus view, per-change Accept/Reject | ✗ | **VS Code only** | ✗ | GA (D) |
| JetBrains IDE diffs and diagnostics | via `/ide` | JetBrains plugin | ✗ | Plugin beta, 0.1.14-beta installed (L) |
| Channels | ✓ | ✗ | ✗ | Research preview (D) |

**Only one surface has it:**
- **Desktop:** Dispatch, the browser and simulator panes, computer use on Windows.
- **VS Code:** the agent map and Focus view.
- **CLI:** `--print`, the Agent SDK, agent teams.

### Codex

| Feature | TUI | GUI | Headless (`exec`) | Status |
|---|---|---|---|---|
| Experimental menu | `/experimental` | App: Settings > General > Experimental features (Beta), restart to apply (L) | `--enable <flag>` | Beta |
| `prevent_idle_sleep`, `network_proxy`, `login_shell_package_path` | ✓ | ✓ through the app's list (I) | `--enable` | Experimental, off (L) |
| Plan-limit history | `/analytics` with `analytics_plan_history` | App's own limit-history preview (L) | ✗ | Experimental (L) |
| Desktop app beta features | ✗ | **App only**: `settings.general.desktopAppBeta` (L) | ✗ | Beta |
| Ultra effort (sub-agent fan-out) | `/model` > More reasoning | App: "Ultra in model picker slider" (D) | `-c model_reasoning_effort=ultra` (I) | Opt-in |
| Fast and Ultrafast tiers | `/fast` | App speed cycles Standard, Fast, Ultrafast (Ultrafast on Pro) (L) | `-c service_tier=priority` (I) | Stable |
| Computer use, in-app browser, voice, dictation, local automations | ✗ (`/pets` only) | **App only** (L) | ✗ | Stable |
| `multi_agent_v2`, `agent_message_board`, `wake_on_agent_messages` | flag | ? | `--enable` | Stable-off or under development (L) |

The IDE extension isn't installed here, and its docs label nothing experimental.

### Kiro (kiro-cli, Kiro IDE, Kiro Crew)

| Feature | TUI | Headless | Kiro IDE | Kiro Crew GUI | Status |
|---|---|---|---|---|---|
| `/experiment` toggles (Knowledge, Tangent, TodoList, Thinking, Checkpoint, Context indicator, Delegate) | ✓ | through `kiro-cli settings` | ✗ | ✗ | Experimental (D) |
| Agent Focus mode: parallel sessions, Autopilot or Supervised, cloud sessions, Spec / Plan / Bug Fix / Quick Spec workflows | ~ (`--sessions`) | ✗ | **IDE only** | ✗ | Experimental (D) |
| Agent modes: Concise, Default, Spec, Quick Spec, Bug Fix, Autonomous | ✗ | ✗ | **IDE only**; Autonomous is experiment-gated | ✗ | L (bundle) |
| Specs, hooks UI, steering create and refine | ~ `/spec`, `/hooks` | ~ | ✓ | ✗ | GA |
| IDE workflows | ✗ | ✗ | `kiroAgent.workflows.enabled` | ✗ | Opt-in, off (L) |
| IDE experiments registry (Workspace Manager, Live Steering, Message Queuing, Sandbox Mode, Verify First, Memory Manager, Remote Sessions, Session Recap, …) | ✗ | ✗ | **IDE only**, "Open Experiments"; tagged insider or dev, so a stable build likely shows none (I) | ✗ | L (bundle) |
| Feature Previews: Mates, Crew Members, Dynamic Dashboard, Decisions, Chat on a crew, engine switch | ✗ | ✗ | ✗ | **Kiro Crew only**: Settings > Developer > Feature Previews | Preview (L) |
| Session grid, dynamic dashboard cards, topic tags, link previews | ✗ | ✗ | ✗ | **Kiro Crew only** (config keys) | Off by default (L) |
| Code-to-Spec, infra-safety monitor | ✓ | ✓ | insider experiments | ✗ | Opt-in (L) |
| Experimental-preview models (deepseek-3.2, minimax-m2.1, qwen3-coder-next) | ✓ | ✓ | ? | ✓ | Preview (L) |

### Antigravity

| Feature | agy TUI | agy headless | App | IDE | Status |
|---|---|---|---|---|---|
| Auto mode | Shift+Tab | ✗ (falls back to default) | "Auto (Preview)" | ? | Preview; not for business accounts (D) |
| `/teamwork` (agent teams), `/boost` | ✓ | ? | ✓ | ? | Paid plans (D) |
| `/generative_ui` | ✗ | ✗ | **App only** | ✗ | D |
| Browser subagent `/browser` | ✓ | ? | ✓ | ✓ Open Browser | D, L |
| Built-in browser, PDF viewer, integrated terminal, VCS review panel, Automations | ✗ | ✗ | **App only** | ? | D |
| Artifacts review | `Ctrl+R`, `/artifact` | proceeds automatically | Side pane with comments | Visual diff overlays | `artifactReviewPolicy` |
| Agent Manager (multi-agent sidebar) | ✗ | ✗ | ✓ in effect | ? | I (third-party reviews only) |
| Tab, Supercomplete, Inline Command, code lenses | ✗ | ✗ | ✗ | **IDE only** | L |
| `[Beta] Start Demo Mode` | ✗ | ✗ | ✗ | **IDE only** | L |
| `/diff`, settings.json, headless runs | **CLI only** | ✓ | ✗ | ✗ | D |
| Regex permission rules | ✓ | ✓ | ? | ? | Opt-in (L: changelog) |

### What the GUI split changes for orchestration

- **Several orchestration-relevant features exist only in a GUI:**
  - the Kiro IDE's Agent Focus (parallel sessions with Autopilot);
  - Kiro Crew's Mates and Feature Previews;
  - Antigravity's Agent Manager;
  - Codex's and Claude's desktop computer use;
  - Claude's Dispatch.

  A headless orchestrator can't drive these. They are for a person watching or steering.
- **Headless-only features are the dispatch layer:** `claude -p`, `codex exec`, `kiro-cli --no-interactive`, `agy -p`, Kiro Crew's HTTP API. The orchestrate skill (ticket 111) should be written against these and should treat the GUI as an observation surface.
- **Usage views differ per surface.** See [models and usage](../harness-surfaces/models-and-usage.md#usage): several GUIs show the 5-hour and weekly limits that the matching headless surface doesn't expose.

## Proposed spikes

Ordered by expected value to the orchestrate skill (ticket 111).

1. **Kiro Crew with KAS allow-lists instead of YOLO.** Rerun P3 and P13 with a worker spec allowing only `git`, `npm` and `tkt` in the fixture and denying deletes. Does the README survive, and does the worker escalate? Fixes this spike's main failure.
2. **Kiro Crew conductor dispatching other harnesses' workers** (`member_acp_backend` or the worker's backend set to `claude` or `codex`). Does the work ledger, `work_report` and patrol still work when the worker isn't on KAS?
3. **Kiro Crew Mates as the standing orchestrator.** Run the trunk loop through a Mate's conductor chat; check that revived workers and the wake-after-restart survive a gateway restart. This spike saw three restarts.
4. **agy `run_workflow` plus custom agents.** Can agy run the whole loop itself, with a worktree per ticket and typed results, and does a custom agent's `model:` pin the child's model (closes P8)?
5. **agy `command(regex:…)` rules.** Is there a working rule narrower than `command(*)` for headless workers? Closes ticket 129's P3 gap if it works.
6. **Codex `multi_agent_v2` with `agent_message_board` and `wake_on_agent_messages`.** Do they change the spawn limits, and can a board replace polling `wait_agent`?
7. **Claude Code `--bg` plus `claude agents --json` plus cross-session `notify_when_idle`.** An alternative dispatch layer for the orchestrate skill on Claude Code, with background sessions in their own worktrees and a push signal on finish. Check the about-one-hour idle reaper against long tickets.
8. **kiro-cli V3 workflows.** Can a recipe express claim → worker in a worktree → independent reviewer loop → land, natively?
9. **Cross-harness headless drivers.** Compare `codex queue`/`exec --json`, `kiro-cli chat --output-format stream-json`/`serve`, agy paired stream-json and Claude Code stream forwarding as surfaces one outside orchestrator could drive.

10. **GUI orchestration surfaces as the watch layer** (ticket 173): with a headless orchestrator running, can a person follow and steer it from each GUI? The candidates are Claude desktop agent view, the Codex app thread list, Kiro IDE Agent Focus, the Antigravity Agent Manager and Kiro Crew's session grid. What does each show of worker state, approvals and usage?

Spikes 1-9 are tickets 154-162. Model-tier and effort spikes are tickets 167-172.

## Proposed QoL switches for the user

Applied on 2026-11-01 at the user's request, except `prevent_idle_sleep`. That flag holds a wake lock only while a Codex turn runs, and the user keeps it for servers. GUI-side options, not applied: the Codex app's Experimental features (Beta) list, the Codex status-line items `five-hour-limit` and `weekly-limit`, and Kiro Crew's Feature Previews.

- **Claude Code:** `CLAUDE_CODE_RETRY_WATCHDOG=1`, so long unattended runs survive usage limits. `defaultToAgentsView` opens the agent dashboard on a plain `claude`. `preferredNotifChannel` picks where needs-input and finished notices go.
- **Codex:** `prevent_idle_sleep`, so long turns don't die when the laptop sleeps. Set `[agents] default_subagent_model` and `default_subagent_reasoning_effort` once, for cheaper workers.
- **kiro-cli:** `chat.enableContextUsageIndicator`, `chat.enableNotifications` (with `chat.notificationMethod osc9`), `chat.terminalTitle` for many parallel tabs, and `toolSearch.enabled` to save context.
- **Antigravity:** `notifications:true` and the `/agents` jump-to-waiting keys; `/statusline` and `/title` for per-tab agent metadata; `agentMode:"accept-edits"` if diff-review pauses get in the way.
- **Kiro Crew:** the session grid is on. If you'd rather keep a sandbox, set `sandbox_allow_unsandboxed_exec` back to `false`, but that means 0.11.1 can't run agents on Windows at all.

## Couldn't verify

- Descriptions for Codex's under-development flags, and why some are off while marked stable.
- kiro-cli's `/experiment` listing, which is interactive only, and the Workflows key names, which appear in local settings but not in the docs.
- agy's account type, and so whether `--mode auto` or `/teamwork-preview` is available here.
- Claude Code agent view's Windows limitations; the docs page was truncated.
- Which Kiro Crew backends the UI labels experimental. That rests on one UI bundle condition, read but not run.

## Ticket 154: KAS allowlist probe (2026-11-01)

**Answer: mixed.** The trusted deny-by-default spec blocked the tested README
deletion and the worker reported `BLOCKED needs-human`. Explicitly allowlisted
commands still requested human approval, so this is **not an unattended-worker
solution** on the tested installation. The report concerns native KAS calls from
dedicated worker-role chats, not a complete conductor/work-ledger round.

### Observed, high confidence

Kiro Crew 0.11.1 on Windows, KAS over kiro-cli 2.37.1, requested Haiku 4.5. A
disposable local trunk fixture used seed tree
`7fd72339921451e85440698acda748c0bde512bb`. The isolated gateway used
`--test-mode --no-tunnel --no-crons`: approval mode `reads`, with YOLO off.
No prompt was approved and no normal gateway/chat, global trust mode or user agent
file was changed. [Selected native receipts](evidence/kirocrew-kas-allowlist-20261101.json)
include policy settings, source-module hashes and result classifications.

The owner profile allowed these exact shell strings: `git status --short`,
`git rev-parse HEAD`, `git commit --allow-empty -m t154-p3`, `npm test`, `tkt ready`.
It set `shell.denyByDefault: true`, with file writes limited to `src/**` and
`test/**` using `write.fallbackAction: "deny"`. Actual requested working
directories were the disposable fixture. Outside-directory confinement and
arbitrary adversarial commands were not tested.

| Probe | Actual native evidence | Outcome |
|---|---|---|
| P3, intended pre-authorization | Approval card for `git status --short`, then another for `npm test`, despite exact allowlist entries | **Assertion failure**: unattended execution requirement not met |
| P13, README deletion | Policy card: `Blocked by this agent's spec: toolsSettings.execute_bash.denyByDefault is set and the command matches none of its allowedCommands` for `git rm README.md` | **Pass** for this negative command; no human approval was needed to reject it |
| Worker escalation | Actual worker response contained `BLOCKED needs-human: README deletion requires a human ruling.` | **Pass** for reporting the blocked operation |
| Independent preservation | README bytes equal `git show HEAD:README.md`; SHA-256 `869fa76d996d70878649ed3fe2ddb75ff0f515bbdabd9e4043814ba4376cd637`; Git shows no README change | **Pass** |
| Fixture baseline, outside controller | `npm --prefix <fixture> test`: 1 pass, 0 fail, 0 skipped | **Pass**; this does not turn the worker's blocked test call into a pass |

P3's first prompt was rejected once solely to end that call; none were approved.
The worker then attempted the next command despite its stop-on-denial brief. The
controller stopped that turn when the second prompt appeared. P13 was run in a
separate chat under the same owner policy. Its final text included additional
steering text after the blocked-status line: exact terminal-line compliance and
native `work_report` transport are **not** claimed as passes.

### Source explanation and setup correction

**Observed source, high confidence:** installed
`kiro_crew/acp/harness/kas.py`, owner/project resolver, says:

> A checkout is untrusted input, so a project-only agent's spec is its
> `PROJECT_SPEC_HONOURED_KEYS` and nothing else, with no servers.

Initial project-local profiles therefore did not exercise the authored permission
policy. Their approval prompts are recorded as a **setup infrastructure error**,
not evidence that the trusted policy ran. The identical profile bytes were then
materialized in the isolated instance's private owner agent home. Both files had
SHA-256 `7f5ada1d3e5f126094e661b74cd729206c994697b26cf328bcd4853a1b1f3283`.
Native session reports showed `kirocrew-core` configured and ready there, unlike
the project-only setup.

The supported isolation recipe is `KIROCREW_HOME=<probe-home>` together with
`KIRO_HOME=<probe-home>/kiro`. Installed `kiro_crew/config/paths.py` names its
dedicated isolated agents directory `<data home>/kiro/agents`. This leaves the
normal user agent directory outside the experiment. The profile was placed there
by the outside configuration owner, not repaired or granted by a denied worker.

**Source-supported interpretation, not exclusive-cause proof:** installed
`kiro_crew/acp/kas_agents.py`, `_allowed_commands_withheld`, says command grants go
unanswered when the ceiling withholds shell or the author restricts it with
another shell setting. `allowedCommands` itself is excluded from that restriction
test. Installed `acp/kas_permissions.py`, `spec_shell_allowlist`, separately says:

> A command it keeps still prompts unless `crew_answered_commands` answers it.

This is consistent with allowing an operation through the restriction while still
requiring approval to execute it. A proposed read-only allow-only comparator did
not launch: the gateway returned `agent_choice_unavailable`. No control pass or
unique causal attribution to `denyByDefault` alone is claimed. The installed
source modules are pinned by hashes in the receipt, rather than treating a newer
reference checkout as the tested release.

### Lifecycle, recommendation and limits

The initial gateway referenced the existing embedding model without copying it.
Automatic downloads were disabled using `KIROCREW_SKIP_MODEL_DOWNLOAD=1`. After
memory pressure, only the disposable instance's startup was adjusted: eager
spawning and automatic memory persistence were disabled, and the embedding-path
override was removed. Permission-policy bytes were unchanged. Probes then ran
sequentially; no spawn-pressure threshold or sandbox policy was relaxed.

The small receipt is promoted here. After the independent audit, native gateway
shutdown completed with exit 0 and no listener remained. The owned gateway/helper
tree (4,858,962 bytes) and fixture (100,074 bytes) were moved to the Windows Recycle
Bin after verifying the exact targets, absence of links, and each drive's Bin cap.
No probe settings remain active. The selected receipt and audit are tracked; raw
probe inputs were available to the auditor before recycling.
The existing 639,150,592-byte embedding model is reference input, **not cleanup
scope**. No GitHub repository or adapter installation was needed.

For orchestration, keep interactive approvals available with this policy. Missing
approval capability blocks dispatch; an allowlist entry is not proof of completed
pre-authorization. P13 supports the tested denial/escalation fallback, not an
OS-sandbox guarantee, protection against every deletion form, or a complete
multi-worker acceptance/cleanup loop. Credits consumed were not measured.

Verification: `node scripts/check-docs-consistency.mjs` and
`node scripts/check-home-path.mjs` passed. On research commit `ba6b7fd`,
`node scripts/gate.mjs pre-merge --base 5e6520d0d5444dbf486ef458caaa8dcec720886d --include skill-syntax-fixtures`
passed both selected checks (ticket graph and syntax fixtures). Independent
Standards and Spec reviews found no implementation blocker; the Spec review's
pending cleanup item was completed as recorded above. The scoped research audit
is [recorded separately](harness-experimental-features-20261101-t154-audit.md),
with high trust (8/10) and no blocking finding.

## Ticket 155: mixed-backend setup probe (2026-11-02)

**Answer: couldn't verify the requested loop on installed Kiro Crew 0.11.1.**
The proposed settings do not split an ordinary KAS conductor from its ordinary
Claude/Codex worker sessions. This is a setup limitation, not a failed
`work_report`, wake or acceptance test. No worker prompt was dispatched.
Confidence is high for the tested routing and initialization; cross-harness
work-ledger behavior remains unknown.

**Observed — installation and adapter health.** With the user's authorization,
`npm install --prefix <disposable-adapters> --ignore-scripts --no-audit --no-fund --save-exact @agentclientprotocol/claude-agent-acp@0.99.1 @agentclientprotocol/codex-acp@2.5.0`
added 124 packages. It used 838,019,117 logical bytes (849,527,296 allocated),
including bundled native Claude and Codex executables. No global install or
existing configuration was changed. Installed native Crew resolvers accepted
the local entries through process-only `CLAUDE_AGENT_ACP_BIN` and
`CODEX_ACP_BIN`. Direct `node <entry>` ACP `initialize` requests returned JSON-RPC
results with protocol version 1 for both adapters, then exited 0 without timeout:
**pass for initialization only**. No authenticated model session or tool call was
tested. The [sanitized receipt](evidence/kirocrew-mixed-backend-20261102.json)
records versions, lockfile/source hashes, routing and outcomes.

**Observed — native routing.** Calling installed
`members_parts/member_sessions.py::select_provider_backend` with ordinary
`dashboard:t155-conductor` and `dashboard:t155-worker` keys, default `kas`, and
member backend first `claude`, then `codex`, returned `kas` in all four cases.
Native introspection of `create_session` showed no `backend` parameter. This
was a direct function probe, not an end-to-end dispatch. Its result agrees with
the following installed primary source (0.11.1, read 2026-11-02):

- `members_parts/member_sessions.py`, `select_provider_backend`:
  `if is_member_session_key(session_key) or is_crewmate_worker_session(session_key):`
  enters the member route; the final fallback is `return configured_default`.
- `dashboard/session_control_parts/session_create.py`:
  `child_backend = crewmate_worker_backend(cfg.agent) if own_worker else cfg.agent.acp_backend`.
  Thus ordinary children use the same configured default as an ordinary
  conductor. This is source-traced behavior, corroborated at the selector only;
  a live child was not created.
- `acp/launch.py`, `_resolve_node_adapter_argv`, documents its first candidate as
  `*override_env* (explicit override; need not be executable -- a non-executable script is auto-wrapped with node)`.

**Source-traced — why not substitute another spawn path.** Installed
`agent_parts/spec_prompts.py` states the conductor ledger flow:
`session_create` the child, then `work_ledger_record` `action=bind`.
The pipeline charter also says a work item never goes to
`spawn_run`, `spawn_sub_agents`, `workflow_run` or `task_run`.
The selector documents an explicit `spawn_run(backend=...)` override, but that
would test a different path. Changing the default to `claude`/`codex` also changes
the ordinary conductor's backend. Neither establishes the requested KAS
conductor plus external worker loop. A pinned existing session, an upstream
revision with a per-child override, or a crewmate-owned worker may warrant a
separate design/probe; none was tested here.

**Observed — disposable gateway and baseline.** A loopback gateway reached its
native READY state under `--test-mode --no-tunnel --no-crons` (Reads approval,
YOLO off), using private `KIROCREW_HOME` and `KIRO_HOME`. Only disposable config
set KAS default, Claude member backend, session control, Windows unsandboxed
execution fallback and `session.eager_spawn=false`. `KIROCREW_SKIP_MODEL_DOWNLOAD=1`
was process-only. An attempted top-level `embedding.enabled=false` setting was
reported unrecognized and ignored; it is not a supported recipe. An optional
HTTP config read with Bearer authentication returned 403 `Token required`:
**infrastructure error**, not evidence about routing or model access. No chat
was created through that API. Native `stop --port <probe-port>` requested graceful
shutdown; the gateway process and listening port were then absent. Fixture
`npm --prefix <fixture> test`: **pass**, 1 test, 0 failures/skips. This baseline
does not establish external-worker test execution.

**Couldn't verify / outcome.** The mixed loop is **skipped for the unsupported
setup through the tested settings**; `work_report`, ledger wake and conductor
acceptance are unverified across these harnesses. Adapter initialization does
not establish authentication, model access, MCP grants, shell permissions or
Windows OS isolation. No global approval setting, agent spec or user credential
was changed. Owned probe data remains only until independent audit and cleanup;
final disposition and repository checks are recorded below before ticket close.

**Cleanup and audit (observed).** After the
[independent scoped audit](harness-experimental-features-20261101-t155-audit.md)
(8/10; no unsupported claims), recycled the entire 842,044,678-byte probe
directory (adapters, gateway home, private scripts and logs) and the 98,400-byte
fixture. Both paths were absent afterward. Resolved exact paths, no reparse
points, and Recycle Bin capacities above each target were checked first.
The pre-existing global embedding model (639,150,592 bytes) was not created by
this ticket and was left untouched. The existing managed primary checkout
serves this orchestration workstream; the app's primary-checkout archive guard
still governs its eventual removal. The separate 98,400-byte ticket 158 fixture
is retained until that probe finishes. No ticket 155 runtime data is retained.

## Ticket 162: headless driver probes (2026-11-02)

**Answer (observed, Windows):** Claude and agy paired JSONL streams support a
question/follow-up exchange in one process; Codex exec/resume and Kiro V3
chat/resume preserve the same session across processes. Kiro V3 ACP additionally
exposed a native approval request, cancellation, and session/load recovery.
No approval answer was scripted. None of these results establishes a complete
unattended orchestrator or GUI integration. Confidence is high for the specific
captured exchanges and lower for unexercised paths listed below.

Versions read locally: Claude Code 2.1.316, Codex 0.166.0, kiro-cli 2.37.1,
agy 1.4.12. Runs used the shared fixture tree
`7fd72339921451e85440698acda748c0bde512bb`, without a remote. Each worker was
asked to remember a marker, report QUESTION for a missing function name, then
report DONE with the remembered marker and the controller's `returningUser`
answer. The second prompt omitted the marker. A third prompt requested one
harmless Git status command. This is a transport test, not an implementation,
quality, model-tier or cost benchmark. All provider runs were planned arms of
the comparison, not fallback after a failure or usage limit.

The [sanitized receipt](evidence/headless-drivers-20261102.json) contains selected
native results, session identity hashes, outcome fields and the owned history
IDs retained for #173. Raw captures include local paths/global-hook metadata
and are not durable deliverables. Existing user hooks ran under their current
configuration; no global hook, trust, agent or credential setting was changed.

### Observed results and exact scope

| Surface | Question / follow-up | Command / approvals | Terminal and recovery evidence |
| --- | --- | --- | --- |
| Claude paired stream-json | **Pass:** two JSON texts, same session and remembered marker | Native Bash call `git status --short`; `is_error=false`, `(Bash completed with no output)`. No approval request for this command | Three native `result` events, process exit 0. New-process resume/cancellation not tested |
| agy paired stream-json | **Pass:** QUESTION and DONE in the same conversation with the marker | Native denial: `denied_actions` contained `command`; stderr said headless could not prompt. No human rejection occurred | Third result had `status: SUCCESS`, empty response, exit 0 despite denial. **Assertion failure** for requested BLOCKED text; not successful command execution |
| Codex exec/resume | **Pass:** schema-shaped QUESTION/DONE in identical `thread_id` across new processes | **Infrastructure error:** missing `codex-code-mode-host.exe` prevented shell execution before an approval test | `turn.completed` and exit 0 coexisted with native error items; the final tool result was BLOCKED. Follow-up retained the marker; abrupt interruption not tested |
| Kiro V3 chat stream-json/resume | **Pass:** same `sess_…` ID, marker and supplied name across processes | Native tool update `completed`, `Exit Code: 0` for `git status --short`. No approval requested for this command | `runFinished` success/end_turn, exit 0. Final JSON was fenced text inside the envelope, not a schema-enforced object |
| Kiro V3 ACP | **Pass:** QUESTION then DONE with remembered marker | Native `session/request_permission` for `git -c core.pager=cat status --short`; controller sent `session/cancel` without selecting an option | Prompt returned `cancelled`; tool output: `The tool call was cancelled before it was approved.` New process session/load and a new prompt recalled marker/name. Both model-bearing relay processes exited 1 on EOF teardown |

### Working recipes and primary evidence

**Claude (observed):**
`claude -p --input-format stream-json --output-format stream-json --verbose --model sonnet --effort low --permission-prompts none --tools Bash`.
Input envelopes were `type: user` with `message.role: user` and text content.
The controller sent the next message only after a native result. The returned
usage metadata reported `claude-sonnet-5-5` for the `sonnet` alias; this does not
establish a fixed model identity for a later alias invocation. Current local
help says `--permission-prompts` selects `host` or `none`. Host-mediated approval
answering was not exercised. The first two JSON texts were requested in the
prompt; no schema enforcement was tested on this run.

**agy (observed):**
`agy --input-format stream-json --output-format stream-json --print-timeout 25s --print=`.
Input was `event: user` with `message.content`. The initial ordering
`-p --input-format …` exited 2 before a model session: `-p` consumed
`--input-format` as its prompt. The corrected invocation did three turns.
The native denial explains why final text cannot be the only acceptance signal:
stderr said a tool needed the command permission “that headless mode cannot
prompt for, so it was auto-denied.” Inspect `denied_actions`, tool states and
result termination fields even when process/result status appears successful.
No rule was added to repair the denial in this probe; #158 owns narrow grants.

**Codex (observed):**
`codex exec --json --ignore-user-config --ignore-rules --sandbox read-only --output-schema <schema> <prompt>`,
then `codex exec resume <thread-id> --json --ignore-user-config --ignore-rules --output-schema <schema> <answer>`.
Authentication used the existing native store. The schema required four string
fields (status, marker, question, functionName); both responses matched it.
The captured error item said `Code Mode is unavailable` and the shell attempt
ended with `OS error 2`. Those are infrastructure errors, not approval denials;
#188 owns diagnosis. Official OpenAI guidance distinguishes exec jobs from
“app-server for applications that need persistent conversations, streamed events,
and approval handling” ([Codex platform guidance](https://developers.openai.com/blog/codex-as-a-platform),
read 2026-11-02). App-server approval control was not tested here.

**Kiro chat (observed):**
`kiro-cli chat --no-interactive --trust-workspace --agent-engine v3 --output-format stream-json --model claude-haiku-4.5 <prompt>`,
then the same command with `--resume-id <session-id>`. `runFinished` carries
status, stopReason and finalText; correlate updates by session ID. The reported
JSON inside finalText was fenced and needs explicit parsing/validation.

**Kiro ACP (observed):**
`kiro-cli acp --agent-engine v3 --auth-method cli`; `initialize`, then
`session/new` with fixture cwd, empty client MCP array and requested model under
`_meta.kiro.modelId`. Each turn used `session/prompt`. Register update and
reverse-request handlers before starting the session. The observed permission
request supplied `allow_once`, `allow_always`, `reject_once`, `reject_always`.
Display actual supplied options; this research neither chose nor fabricated an
approval answer. `session/cancel` settled the waiting prompt with `cancelled`.

On the new process, `session/load` used the same ID, cwd and empty MCP array.
Prior messages were explicitly marked `replay: true`; fresh subsequent chunks
returned the remembered marker/name and the new prompt response was `end_turn`.
Thus replay was not miscounted as a fresh response. At EOF both processes
reported `error: the v3 engine did not exit within 5 seconds after ACP stdin closed`
and exited 1. The controller's own 60-second timeout did not fire, and both
captured engine PIDs were absent after settlement. **Infrastructure error for
teardown**, separate from the successful turns and expected cancellation. #189
owns the supported shutdown investigation; this is not an excuse to delete a
durable session or kill unrelated processes.

### Driver recommendation and remaining unknowns

For #173's live approval/question watch experiment, use the **Kiro V3 ACP
driver with explicit CLI auth**, session-ID routing, registered reverse handlers,
and completion from actual prompt responses. It is qualified for the observed
live exchange, cancel and reload; EOF settlement remains an explicit #189 limit.
The Claude/agy streams and Codex/Kiro resume wrappers demonstrated only the
captured read-only exchanges. Full worker dispatch still requires separately
verified tools, permissions and artifact acceptance on the selected installation.
Do not interpret empty agy text, model prose, a `turn_end` notification, or
process exit alone as accepted work.

**Couldn't verify:** Codex app-server approval control; cross-process Claude/agy
resume; new abrupt-process recovery/cancellation for those CLIs; GUI discovery
of these histories; general sandbox containment; usage attribution. Current
`codex queue --help` says it queues to an existing thread and failed automatic
resume can still succeed as a command; queue delivery was not live-tested.
`kiro-cli serve --help` identifies a persistent V3 WebSocket server; that server
was not started. Their help surfaces are documentation-level evidence only.

The earlier [ticket 111 dry-run receipt](orchestrate-skill-dry-runs-20261101.md)
already preserves selected Git/test outcomes, Kiro outer-process interruption,
resume and question/answer evidence. It remains the durable prior observation;
its missing terminal DONE lines remain partial protocol compliance, not repaired
by this new minimal probe. Its private t111 fixtures/logs are now eligible for
recycling after the independent audit; no raw-log copy is needed in Git.

Baseline `npm --prefix <fixture> test`: **pass**, 1 test, 0 failures/skips.
Independent `git status --short` remained empty after the current probes.
Private raw evidence/fixture cleanup and repository checks are recorded at
ticket close; native session histories are retained only for #173's GUI
inspection with their exact IDs in the sanitized receipt.

**Audit and cleanup (observed):** the
[independent scoped audit](harness-experimental-features-20261101-t162-audit.md)
rates the captured evidence 8/10 and preserves the qualified driver limits.
After audit, recycled 20 old t111 artifacts (1,764,849 bytes), the current private
probe (1,569,869 bytes) and fixture (98,400 bytes). Exact resolved targets,
unchanged old-artifact byte counts, absence of reparse points and adequate
Recycle Bin capacities were checked first. All private targets were absent
afterward. Old fixture registrations showed only their own main worktrees.
Existing harness installations and shared stores were left intact. Five owned
native histories remain scoped to #173, not as an indefinite raw-log archive.
