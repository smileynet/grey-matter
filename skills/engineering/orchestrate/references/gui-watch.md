# GUI watch layer

Use when the owner wants to watch or answer workers through a native client.
The [173 comparison](../../../../docs/agents/research/gui-watch-layer-20261102.md)
separates documented features from local observation (2026-11-02). No candidate
was locally verified to display or steer the retained headless workers:
launch/capture failed, or UI automation was unavailable by policy.

| Harness | Native watch candidate | Qualification before relying on it |
| --- | --- | --- |
| Claude | Desktop session sidebar for Desktop sessions; Agent View for CLI sessions | Agent View is CLI/TUI, not Desktop. Prove worker/session mapping and an actual reply/approval; neither was observed locally. |
| Codex | Codex app session history | Reviewed docs do not specify app-list state labels. Eligible per-chat usage can omit delegated work. Local GUI controls were not inspected; obey the permitted interaction surface. |
| Kiro | IDE Agent Focus for IDE sessions | In-place question/command replies are documented. External CLI/ACP worker attachment was not shown. Live ACP observation does not qualify EOF shutdown; retain #189's settlement caveat. |
| Antigravity | App Overview/Subagents for app conversations | Following subagents is documented. Reviewed approval-jump and usage controls belong to CLI features, not demonstrated app controls. |
| Kiro Crew | Crew grid/chat tabs for Crew sessions | State, interactive approvals and chat continuation are documented. Usage estimates are described in older 0.9.0 docs; local 0.11.1 behavior was not captured. External worker attachment is unverified. |

Keep the orchestrator ledger authoritative for state, questions, approvals and
usage until the exact native worker ID maps to the visible session and the
required interaction is observed. Visibility does not prove answer/approval
delivery; idle is not acceptance. Use native results and independent checks.

Unavailable clients remain coverage gaps. Do not install/sign in, broaden trust,
or use forbidden automation just to fill a table. Use the permitted headless
driver and dashboard while GUI mapping is unqualified. Inspect owned sessions
only; preserve shared native databases.
