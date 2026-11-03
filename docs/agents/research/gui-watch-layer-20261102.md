# GUI watch layer comparison: ticket 173

**Checked:** 2026-11-03. **Evidence type:** official product documentation plus a bounded Windows app inventory and launch/capture attempt. No candidate GUI yielded a view of the five retained #162 test sessions, so documented capability and local GUI observation are kept separate.

## Finding

There is no verified cross-harness GUI watch layer for this headless orchestration setup. The native products describe ways to monitor or steer sessions they own; none of the inspected evidence shows arbitrary external workers appearing with their question, approval, and usage state.

Two naming/scope details matter:

- **Claude Agent View is a CLI view, not a desktop view.** Anthropic says it shows sessions waiting on input, working, or done, and allows an inline reply to a decision. Claude Desktop separately has a multi-session sidebar and a usage button. Treat those as two surfaces.
- **Kiro Crew’s session grid describes Crew sessions.** Its own tabs have state and approval state, and its chat can continue a session. The docs do not show the grid adopting a separate headless orchestrator’s workers.

For ticket 111, keep the orchestrator ledger authoritative across harnesses. Link a worker to a native UI only after a same-session test confirms that its identity, current state, pending question or approval, and reply are visible there.

## Candidate comparison

| Surface | State shown | Approval answerable | Usage shown | Question answerable | Fit for an external headless worker |
|---|---|---|---|---|---|
| **Claude Code Desktop / Agent View candidate** | Desktop docs describe an active/recent session sidebar filtered by status, project, or environment ([desktop redesign](https://claude.com/resources/articles/claude-code-desktop-redesign)). The separately named CLI Agent View distinguishes waiting, working, and done and shows the last response ([Agent View announcement](https://claude.com/resources/articles/agent-view-in-claude-code)). | Agent View (CLI/TUI) documents an inline reply to a session decision. Desktop permission handling for the retained #162 headless session was not observed. | Desktop documents a context/session usage button ([desktop redesign](https://claude.com/resources/articles/claude-code-desktop-redesign)). The Agent View article does not describe a usage panel. | Agent View can answer inline when one of its sessions is waiting on a decision. Desktop steering of an external `claude -p` question was not established. | **Unproven.** Use the CLI Agent View only for Claude sessions it actually lists; do not call that the desktop GUI. |
| **Codex desktop thread list** | **The cited docs do not specify the thread list’s state labels or details, and the exact app UI was not inspected.** The app organizes work into project threads and imports session history/configuration from Codex CLI and the IDE extension ([Codex app announcement](https://openai.com/index/introducing-the-codex-app/)). | The desktop composer has an approvals menu, including “Approve for me” when available ([Codex plan help](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)). Whether the exact #162 headless thread exposes its pending request in desktop was not observed. | On eligible Enterprise/Edu workspaces, Usage & billing and a per-chat indicator show credits and sometimes estimated cost; totals may omit subagents or separate tasks ([usage help](https://help.openai.com/en/articles/20001478-reviewing-work-and-codex-usage-and-using-personal-analytics-in-chatgpt-desktop)). | A person can continue a native Codex thread. Whether this exact headless thread’s question appears in the UI is unverified. | **Plausible for a native CLI/IDE thread; unverified for the observed `codex exec` worker.** Confirm its actual appearance before relying on it. |
| **Kiro IDE Agent Focus** | Parallel IDE sessions are grouped by workspace and marked Spinning (working), Warning (needs input), or Paused ([Agent Focus docs](https://kiro.dev/docs/ide/experimental/focus-mode/)). | **Documented in-place controls** on an attention card identify the exact command/path and show response buttons. | The inspected Agent Focus docs do not specify session usage or credits. | **Documented in-place answer** for a blocking question. Actual UI was unavailable. | **Unproven outside Kiro IDE sessions.** External `kiro-cli`/ACP attachment was not established. |
| **Antigravity app Overview / Subagents** (current docs’ app surface) | Overview lists subagents and opens the selected conversation; the inspected app docs do not give state labels for the list ([feature overview](https://antigravity.google/docs/features)). | The app page does not document approval controls here; monitoring and approval controls are listed under CLI `/agents`. | `/usage` and live token metadata are documented under CLI features, not in the inspected app section. | Following a subagent conversation is documented; the app-side action for answering its blocking question is not. | **Unproven.** Suitable for following Antigravity app subagents; not established as a generic worker board. |
| **Kiro Crew session grid** | Each tab shows thinking, waiting, or idle, with its own context, history, project, agent, and approval state ([sessions docs](https://kiro.dev/docs/crew/chat/sessions/)). | Interactive tool calls can ask on a surface that presents the prompt ([security docs](https://kiro.dev/docs/crew/security/)). Crew chat supports approve/reject controls; the exact local prompt card was unavailable. | A separate Usage tab is documented to estimate tokens and credit runway ([0.9.0 changelog](https://kiro.dev/changelog/crew/)); exact per-worker billing is unverified. | A person can continue the conversation in its chat tab ([chat docs](https://kiro.dev/docs/crew/chat/)); a blocking-question card was not captured locally. | **Unproven outside Crew-owned sessions.** No external headless-worker attachment was demonstrated. |

“Documented” means a first-party source describes the product’s own session surface. It does **not** establish that a worker produced by an unrelated headless process is attached to that surface.

## What was actually observed locally

The retained #162 receipt at [`headless-drivers-20261102.json`](evidence/headless-drivers-20261102.json) names five owned native sessions: agy, Claude Code, Codex, Kiro CLI ACP, and Kiro chat. Their fixture results include question/follow-up turns; the Codex tool attempt had a missing companion-host error, and the Kiro ACP history includes a pending permission request that was cancelled, not answered. Those results are CLI/ACP evidence, not proof of what a GUI displayed.

On 2026-11-03 the CUA app inventory showed the ChatGPT/Codex app running, Claude installed but not running, and did not list Kiro IDE, Antigravity, or Kiro Crew. Targeted read-only install checks then found Kiro IDE 1.3.11, Antigravity 2.28.2.0, and the existing Kiro Crew installation. The dated raw outcomes are in [`gui-watch-layer-20261102.json`](evidence/gui-watch-layer-20261102.json).

| Candidate | Local CUA attempt | Result |
|---|---|---|
| Claude Desktop | Launched the existing app by its CUA app ID; refreshed `listApps`. | Launch timed out. Refreshed inventory showed it still not running and no window. No session was opened. |
| Codex app | Inventory only. | The computer-use policy forbids automating the ChatGPT/Codex desktop UI. No GUI controls or private history were read. |
| Kiro IDE | Launched the installed executable path; refreshed `listApps`. | Launch timed out. Refreshed inventory showed no Kiro window. |
| Antigravity | Launched the installed executable path; refreshed `listApps`. | CUA returned `system cursor manager did not become ready`; refreshed inventory showed no Antigravity window. |
| Kiro Crew | Launched the existing installed executable; refreshed `listApps`, then tried the returned window ID with CUA. | The launch call timed out but inventory showed window `270586`. `getApp` returned `Accessibility state unavailable for window 270586`; `getScreenshot` returned `no screenshot targets found for process: C:\Users\uosmi\AppData\Local\Programs\KiroCrew\KiroCrew.exe`. No screenshot or session transcript was captured. The app remains open because the supported API did not yield a safe controllable view. |

The initial browser inventory returned unrelated personal tab metadata; no tab was opened, claimed, navigated, or read for page content, and none of its metadata was copied into the durable artifacts. The exact #162 session histories, shared session databases, and telemetry were left untouched. No model probe, controlled fixture, sign-in, permission change, setting change, screenshot, or sandbox was created.

## Suggested reference wording for ticket 111

> Use each harness UI only as a watch surface for sessions that the harness can actually map and display. Claude’s Agent View is a CLI/TUI; the Claude Desktop session sidebar is separate. Kiro Agent Focus documents in-place replies to its IDE sessions; Kiro Crew’s grid and usage views are for Crew sessions. Antigravity’s app Overview can follow a subagent, while the documented approval-jump controls are CLI-only. The Codex app imports CLI/IDE session history and has eligible per-chat usage, but its usage estimate can omit delegated work. Keep the orchestrator ledger authoritative for cross-harness state, questions, approvals, and usage until the exact worker-to-native-session mapping has been demonstrated.

## Sources and quoted evidence

Sources were opened on 2026-11-03. Quotes are kept short; product documentation is evidence of documented capability, not local UI observation.

| Source, release/date | Supporting excerpt | Supports |
|---|---|---|
| [Anthropic, “Agent view in Claude Code”](https://claude.com/resources/articles/agent-view-in-claude-code), 2026-05-11, Research Preview | “Agent view improves visualizing and interacting with your Claude Code sessions in the CLI.” | Agent View is CLI/TUI, distinct from Desktop. The article also describes state rows and inline replies. |
| [Anthropic, “Redesigning Claude Code on desktop for parallel agents”](https://claude.com/resources/articles/claude-code-desktop-redesign), 2026-04-14 | “A new usage button shows both your context window and session usage at a glance.” | Desktop session sidebar and usage button are separate documented capabilities. |
| [OpenAI, “Introducing the Codex app”](https://openai.com/index/introducing-the-codex-app/), 2026-02-02; Windows update 2026-03-04 | “The app picks up your session history and configuration from the Codex CLI and IDE extension.” | Native CLI/IDE history continuity, not proof of a specific #162 GUI view. |
| [OpenAI Help, “Using Codex with your ChatGPT plan”](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan), updated 2026-11-03 | “Open the approvals menu in the ChatGPT desktop app’s composer and select Approve for me.” | App-side approval control; it does not establish that the headless #162 approval was presented there. |
| [OpenAI Help, “Reviewing Work and Codex usage”](https://help.openai.com/en/articles/20001478-reviewing-work-and-codex-usage-and-using-personal-analytics-in-chatgpt-desktop), updated 2026-10 (accessed 2026-11-03); full feature requires desktop 26.812.10818 and eligible Enterprise/Edu | “Lifetime credits used by the Work or Codex chat.” “Sub-agents and separate tasks may not be included.” | Per-chat usage and its completeness caveat. Account eligibility was not inspected. |
| [Kiro, “Agent Focus Mode” docs](https://kiro.dev/docs/ide/experimental/focus-mode/), current docs accessed 2026-11-03; release version not stated on page | “Each card names the session and its project, shows the question and the exact command or path involved, and presents the agent’s options as buttons.” | In-place handling of questions and command approvals in Agent Focus. |
| [Google Antigravity, “Feature overview”](https://antigravity.google/docs/features), current App/CLI docs accessed 2026-11-03; no version on page | “In the side panel’s Overview, open Subagents and select a subagent to follow its conversation.” | App can follow subagent conversations. The same page separates the app and CLI feature sections; `/agents` approval controls and `/usage` are documented under CLI. |
| [Kiro Crew, “Sessions” docs](https://kiro.dev/docs/crew/chat/sessions/), current docs accessed 2026-11-03; no version on page | “Each tab shows whether its session is thinking, waiting, or idle.” | Per-tab state indicators for Crew-owned sessions. |
| [Kiro Crew, “Security” docs](https://kiro.dev/docs/crew/security/), current docs accessed 2026-11-03; no version on page | “Interactive: Tool calls ask for approval on a surface that can present the prompt.” | Interactive approval capability; exact local card layout was unavailable. |
| [Kiro Crew changelog, 0.9.0](https://kiro.dev/changelog/crew/), 2026-10-16 | “The Usage tab estimates token use and projects when your credits may run out.” | Crew usage estimate. The documented changelog version 0.9.0 predates the locally recorded 0.11.1 install; treat as a product-family note, not an exact-build verification. |

## Limits

- No safe local screenshot or UIA tree was available for the five owned histories. Their GUI state, exact controls, and actual ability to answer the pending #162 approval remain unverified.
- CUA did not expose Claude, Kiro IDE, or Antigravity windows after their launch attempts; Codex GUI automation was disallowed by the computer-use rule. Kiro Crew had a window but no usable CUA accessibility or screenshot target.
- No product documentation examined demonstrates that these native UIs adopt arbitrary cross-harness worker processes. This is an unverified integration claim, not evidence that it is impossible.
- No persisted screenshots, transcripts, native histories, sandbox folders, or additional app data were created. The only new durable artifacts for this spike are this report and its evidence JSON.

## Proposed concise dated section for the experimental-features note

Use this header and summary when integrating the findings into the shared note:

> ### GUI watch surfaces: ticket 173 (2026-11-03)
>
> The [full comparison](gui-watch-layer-20261102.md) records documented capabilities separately from local observation. The products describe native-session monitoring and steering; no tested surface was verified to expose the retained cross-harness headless workers. The table below summarizes those five surfaces; “documented” does not mean the retained worker was visible or answerable.

| Candidate GUI | Documented state / approval / usage / question | Local observation |
|---|---|---|
| Claude Code Agent View (CLI/TUI; Desktop sidebar is separate) | Agent View documents waiting/working/done and inline decision replies. Desktop docs describe a session sidebar and usage button. | Claude launch timed out; no GUI state/action observed. |
| Codex app thread list | State labels/details unspecified in docs; app composer approval and eligible usage are documented; native thread continuation is supported. | Desktop UI automation disallowed; exact thread list and headless-worker actions unobserved. |
| Kiro IDE Agent Focus | Docs describe Spinning/Warning/Paused, in-place question/command responses; usage unspecified. | Launch timed out; no GUI state/action observed. |
| Antigravity app Overview / Subagents | App can follow subagent conversation; app state and approval controls unspecified; `/agents` and `/usage` are documented under CLI. | CUA cursor manager failed; no GUI state/action observed. |
| Kiro Crew session grid | Docs describe thinking/waiting/idle, interactive approval, Usage estimates, and chat continuation. | Window appeared, but accessibility and screenshot capture failed; no session or action observed. |

Keep the orchestrator ledger authoritative until a same-session mapping proves worker identity, live state, pending question/approval, and response path.
