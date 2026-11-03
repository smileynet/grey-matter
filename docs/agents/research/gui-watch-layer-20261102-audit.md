# Independent audit: GUI watch layer comparison (ticket 173)

**Audited revision:** `85729cd4cb65bf7522f46fa9ecd8c6bef32aceff` (report and receipt)
**Reviewed:** 2026-11-02 (client local date)
**Overall trust:** 8/10 — first-party sources substantiate the documented product capabilities; local GUI visibility and cross-harness attachment were not established.

## Claim review

| Surface | Verdict | Independent source check |
|---|---|---|
| Claude Code Agent View / Desktop | **Supported** | Anthropic’s [Agent View announcement](https://claude.com/resources/articles/agent-view-in-claude-code) explicitly locates Agent View in the CLI, describes waiting/working/done rows, and says a decision can be answered inline. The separate [Desktop redesign announcement](https://claude.com/resources/articles/claude-code-desktop-redesign) documents an active/recent session sidebar and context/session usage button. The report correctly keeps those surfaces distinct and does not claim the retained headless session appeared in Desktop. |
| Codex app | **Supported after revision** | The [Codex app announcement](https://openai.com/index/introducing-the-codex-app/) documents project threads and CLI/IDE session-history continuity. [Codex plan help](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) documents desktop Auto-review selection when available. [Usage help](https://help.openai.com/en/articles/20001478-reviewing-work-and-codex-usage-and-using-personal-analytics-in-chatgpt-desktop) limits the desktop usage feature to eligible Enterprise/Edu workspaces and requires desktop 26.812.10818 or later; it also warns that delegated work may be omitted. The revised report correctly says the docs do not specify app thread-list state labels and the exact list was not inspected. |
| Kiro IDE Agent Focus | **Supported** | The [Agent Focus documentation](https://kiro.dev/docs/ide/experimental/focus-mode/) documents parallel session states, attention cards, and in-place responses to questions or command approvals. It does not state usage details. The page was updated 2026-09-30 and does not identify the local release; the report appropriately calls the local UI unavailable. |
| Antigravity app | **Supported** | The [feature overview](https://antigravity.google/docs/features) separates app and CLI features: the app can follow a subagent conversation; the CLI `/agents` panel monitors subagents and handles approvals, and `/usage` is listed in the CLI section. No app state labels or blocking-question action are claimed. |
| Kiro Crew | **Supported, with one weak version-specific claim** | [Session docs](https://kiro.dev/docs/crew/chat/sessions/) confirm thinking/waiting/idle status and per-session approval state; [security docs](https://kiro.dev/docs/crew/security/) describe interactive approval; the session docs support continuing a session in chat. The [0.9.0 changelog](https://kiro.dev/changelog/crew/) documents a Usage tab estimating tokens and credit runway, but the local record says Crew 0.11.1. The report labels that version mismatch and does not present the old changelog as exact-build verification. |

The report’s central limitation is correctly scoped: no inspected product documentation proves that these native interfaces adopt arbitrary workers launched by a separate headless orchestrator. This is an unverified integration claim, not proof that adoption is impossible. The recommendation to keep the orchestrator ledger authoritative follows from that evidence boundary.

The final worker delta records the Kiro Crew process snapshot with its timestamp, process and parent IDs, and explicitly says the evidence cannot distinguish a newly started process from activation of a pre-existing one. That qualification is appropriate. The evidence JSON now substitutes `%LOCALAPPDATA%` for the Windows user-profile prefix in launch, inventory, and screenshot-error strings; this retains the executable location while removing the profile name. The report uses `%USERPROFILE%` for the same normalized screenshot-error path. The checked date is consistently labeled as the client-local date; the Codex Help page’s displayed update date remains separately recorded as 2026-11-03.

## Local evidence and limits

The evidence JSON records bounded app-inventory and launch/capture attempts, including their timeouts and CUA errors. No screenshot or accessibility tree was available, and the report does not treat an app-inventory omission as proof that software is uninstalled: it separately records known executable paths and versions for Kiro IDE and Antigravity. The report also discloses that the initial inventory returned private browser-tab metadata, says no tab was opened or read, and records that this metadata was not copied to the durable files. I did not repeat UI calls or inspect private histories; therefore these local outcomes are audited as recorded observations, not independently reproduced GUI results.

No model call or controlled fixture was made. The receipt says the spike created no sandbox folders or screenshots and added only the report and its evidence JSON. Kiro Crew remained open because the supported capture APIs returned no usable view; no session was selected or changed. The five pre-existing #162 native histories remain named in the receipt for the review path; no shared conversation database or telemetry was accessed. Any later disposition of those pre-existing records should use a supported, targeted path and remain parent-owned.

## Findings and acceptance boundary

- No unsupported documented-capability claim was found. The only weak item is whether the Usage-tab feature documented for Crew 0.9.0 remains present exactly as described in the locally recorded 0.11.1 build; the report already states that limitation.
- The research report and receipt are accepted at the audited revision. No additional GUI probe is warranted from this evidence: the available capture API failed, and Codex desktop automation is explicitly excluded.
- Ticket #173 also requires a dated five-row section in the shared experimental-features note and a per-harness recommendation in the shared `orchestrate` references. Those parent-owned integration edits are outside the audited worker commit and remain required before ticket close. The worker added concise proposed wording for that integration without editing the shared files.
- The sandbox-removal criterion is satisfied as recorded because this run created no sandbox folders. Cleanup of the pre-existing #162 histories is not established by the worker’s report and should be resolved separately by the parent if still required by the #162 handoff.

## Parent integration review

**Reviewed:** 2026-11-02 (client local date), against the parent’s exact uncommitted hunks in `docs/agents/research/harness-experimental-features-20261101.md`, `skills/engineering/orchestrate/references/gui-watch.md`, and the five linked `harness-*.md` references.

**AC1: accepted.** The experimental-features note adds a dated five-row table with documented state, approval/question capability, usage qualification, and local observation for each requested surface. It keeps documented capabilities distinct from local GUI outcomes. Claude Agent View versus Desktop, Codex state labels/policy limitation, Crew’s 0.9.0 versus 0.11.1 usage caveat, retained #162 histories, and uncertain Crew-window ownership are faithfully represented.

**AC2: accepted.** The new GUI reference gives a qualified native candidate and limitation for each harness. Each of the five existing harness reference pages links to it, and the orchestrate skill already links to those harness references. The Kiro EOF caveat is preserved; no GUI action or external-worker attachment is claimed as observed.

No factual correction is requested for these parent-owned hunks. The additions retain the report’s cleanup boundary: the pre-existing #162 histories and the open Crew window are not silently deleted or terminated.
