---
id: "155"
title: "Spike: Kiro Crew conductor dispatching Claude Code or Codex workers"
status: in_progress
blocked_by: []
tags: ["stream:tooling", "type:research"]
validation_criteria:
  - "Installed adapter initialization and actual backend routing are recorded with primary source excerpts and a sanitized receipt."
  - "The requested mixed conductor/worker loop is either verified or explicitly bounded as unverified with the setup limitation."
  - "Checks and independent audit pass; owned probe data is recycled and disposable configuration changes are recorded."
---

# Spike: Kiro Crew conductor dispatching Claude Code or Codex workers

## What to build

Set Kiro Crew's worker backend (`agent.acp_backend` or `agent.member_acp_backend`) to `claude` or `codex`, both labelled experimental, and run the trunk loop with the built-in conductor on KAS. Prerequisite: only `kas`, `kiro` and `opencode` are installed on this machine; `claude` needs `claude-agent-acp` and `codex` needs `codex-acp` ([kiro-crew surfaces](../docs/agents/harness-surfaces/kiro-crew.md)), and installing them is the user's call.

**Question:** Do `work_report`, the work-ledger wake and the conductor's acceptance still work when workers run on another harness?

**Premise correction (2026-11-02, installed 0.11.1):** `member_acp_backend`
routes crewmate DMs and their own workers, not ordinary built-in-conductor
children. `session_create` selects the default `acp_backend` for those children
and has no backend override. Native routing returned KAS for ordinary sessions
with either Claude or Codex as the member backend. Adapter installation and ACP
initialization succeeded, but the requested mixed work-ledger loop could not be
configured through these settings. Its reports, wake and acceptance remain
unverified. See the [dated findings](../docs/agents/research/harness-experimental-features-20261101.md#ticket-155-mixed-backend-setup-probe-2026-11-02).

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.
