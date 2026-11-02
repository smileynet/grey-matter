# Ticket 154 research audit

Scope: only “Ticket 154: KAS allowlist probe (2026-11-01)” and its JSON receipt. Audited against the installed Kiro Crew 0.11.1 Python modules and current raw snapshots in the probe directory. Source module SHA-256 values match all three receipt hashes.

## Claim verdicts

| Material claim | Verdict | Evidence and limits |
|---|---|---|
| Trusted owner profile carried the stated allowlist, `denyByDefault`, write paths, and deny fallback. | supported | `profile.json` matches the receipt’s policy fields and digest; owner-session MCP readiness appears in `owner-slots.json`. |
| P3 allowlisted shell commands still required approval. | supported | `owner-slots.json` has a native pending approval for `git status --short`; `owner-after-slots.json` records the follow-up pending approval for `npm test`. Supports the assertion failure, not a claim that all five commands were individually tried. |
| P13 `git rm README.md` was blocked by the agent spec and worker reported `BLOCKED needs-human`. | supported | `owner-p13-final.json` contains the native policy card and the status line. Extra post-status steering text is also present; the section correctly disclaims exact-terminal-line compliance. No claim of broad deletion protection follows. |
| README was preserved with the stated SHA-256. | supported | Read-only `git show HEAD:README.md` via `spawnSync` and `Buffer.equals` confirms byte-for-byte equality; the SHA-256 also matches the receipt. |
| Project-only specs did not exercise the authored policy; owner-scope setup did. | supported | Installed `kas.py` says project-only specs retain only `PROJECT_SPEC_HONOURED_KEYS` and no servers. The setup snapshots show the initial user rejection; owner snapshot shows configured/ready `kirocrew-core`. |
| Allowed commands remain approval-gated; cause is not uniquely established. | supported | Installed `kas_agents.py` documents the withheld-command path; `kas_permissions.py` keeps shell/filesystem families out of KAS auto-approval and maps authored `allowedCommands` to Crew’s answered-command gate. This supports consistency, not exclusive causal attribution. |
| Control was not launched; no conductor/work-report loop or sandbox guarantee is claimed. | supported | `control.mjs` only prepares the comparator and contains no launch call; receipt records `agent_choice_unavailable`. Section explicitly limits claims to native worker chats and one tested negative command. |

## Score

**Overall trust: high (8/10).** This is a scoped, reproducible account grounded in current primary source and native receipts. It carefully separates P3 failure from P13’s one-command pass and avoids causal overclaim. Currency is strong for the installed 0.11.1 package and dated snapshots; no claim is made about later releases. The receipt uses portable fixture references and contains no absolute local fixture path.

**Blocking issues: none.**
