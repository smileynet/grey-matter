---
id: "155"
title: "Spike: Kiro Crew conductor dispatching Claude Code or Codex workers"
status: done
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

- [x] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [x] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [x] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Resolution (2026-11-02)

done: tested adapter initialization and corrected the mixed-backend setup premise for KiroCrew0.11.1; source-traced plus selector-probed results are published with an independent audit. The requested KAS-conductor/external-worker ledger loop remains unverified because ordinary children use the default backend. Recycled all ticket155 runtime data. Retained shared dist/agy-plugin as current deploy output until next deployment; retained clean managed primary checkout for orchestration workstream until app permits archive, and separate t158 fixture until its probe completes. No global adapter installation or user configuration change.

### Verification
1. ✓ Installed adapter initialization and actual backend routing are recorded with primary source excerpts and a sanitized receipt. — "Both pinned local adapters returned ACP initialize protocolVersion 1 and exited 0 without timeout (pass). Native installed selectors returned KAS for all four ordinary-session/member-backend combinations; create_session signature has no backend parameter. Dated section, source excerpts/hashes and sanitized JSON receipt published in 8369376."
2. ✓ The requested mixed conductor/worker loop is either verified or explicitly bounded as unverified with the setup limitation. — "Could not verify the requested mixed loop through tested settings: member_acp_backend routes crewmate DMs/own workers; ordinary children use default acp_backend. No worker prompt dispatched. Mixed loop skipped; work_report, wake and acceptance unverified, not claimed failed. Optional HTTP config read was infrastructure error403; fixture baseline passed1/1."
3. ✓ Checks and independent audit pass; owned probe data is recycled and disposable configuration changes are recorded. — "Independent research audit8/10 with no unsupported claims. Fresh node --test scripts/skill-syntax.test.mjs passed10/10. After rebase: gate.mjs pre-merge --base c739cbb --include skill-syntax-fixtures passed2 selected; pre-push passed5 selected. Docs consistency and home-path passed; staged artifact inspection complete5 files49969 bytes no findings. Probe842044678 bytes and fixture98400 bytes recycled after gateway stop and audit; paths absent. Deployment passed50 skills. Correction: raw source/installed hashes differ because deployment relocates links. Exact text comparison passed after reversing only that link relocation and normalizing newlines. Shared generated bundle retained until next deploy:8650918 bytes."
