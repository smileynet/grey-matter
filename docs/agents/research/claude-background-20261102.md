# Claude Code background sessions and cross-session idle notices (2026-11-02)

**Ticket:** [160](../../../.tickets/160-spike-claude-bg-agents-dispatch.md)\
**Installed CLI:** Claude Code 2.1.316, native Windows, 2026-11-02.\
**Answer:** cross-session messaging and one idle notice worked in one controlled local exchange. Background dispatch and automatic worktree creation could not be verified in the fixture because it was not trusted. The one-hour reaper and PR push/landing path are documented or out of scope, not live-tested.

## Observed

The spike-0 **trunk** fixture was created at `%TEMP%/gm-t160-fixture-20261102`; its tree was `7fd72339921451e85440698acda748c0bde512bb`, it had no remote, and it remained clean. Its landing instructions say workers commit on a ticket branch and merge to `main`; with no remote, never push. The separate PR fixture variant calls for an explicitly named GitHub repository and says workers push a ticket branch, never `main`. No repository or remote was created for this probe.

From the new fixture, both `claude --bg "Reply with only T160_FIXTURE_TRUST_CONTROL"` and `claude --bg --worktree t160-bg-worktree-control --name t160_worktree_control "Reply with only T160_WORKTREE_CONTROL"` exited 1 with `Workspace not trusted`. `git worktree list --porcelain` still listed only the fixture root. No project trust was accepted or persisted, so actual fixture dispatch and `--bg` worktree creation remain unverified.

One preliminary marker control accidentally ran from the worker's managed worktree rather than the fixture. `claude --bg "Reply with only T160_BACKGROUND_CONTROL"` returned session `9031e15d` (exit 0). In that exact worktree, `claude agents --json --all --cwd <worktree>` listed the named session with `status: idle`, `state: done`; `claude logs` showed `T160_BACKGROUND_CONTROL`. This confirms the local background service and JSON listing for that worktree only. It is not fixture evidence, and the session is marked for removal during cleanup.

A fresh `claude -p` caller launched in the fixture exposed native `ListAgents` and `SendMessage` tools. The first attempt refused to send because it supplied the worker's short CLI ID while the messaging tool returned a different opaque peer reference. The retry selected the single listed peer by its exact unique name, `t160_background_control`, and called `SendMessage` with `notify_when_idle: true`. The native call reported success and returned message ID `e042e562-8c02-4a1e-9383-dcb75960d839`. The worker transcript then recorded the incoming prompt and `T160_MESSAGE_RECEIVED`; the sender received `[Cross-session idle notice]` after that turn. The receiver changed no files. This confirms one same-machine main-session message/notice exchange. The notice reports that a turn became idle; the marker reply is separate evidence that this worker handled this specific message. Neither is an acceptance check for real ticket output.

The [sanitized receipt](evidence/claude-background-20261102.json) preserves the exact message parameters and result, relevant tool events, attempt statuses, fixture identity, and hashes of the private raw streams. After the independent review, the owned session, fixture, and raw evidence were removed; the receipt keeps the evidence needed to reproduce the conclusions without native event envelopes.

## Documented behavior, not reproduced here

- The current [CLI reference](https://code.claude.com/docs/en/cli-usage) says `--bg` creates a background session and: “Checks workspace trust for the directory before it starts.” The installed CLI also lists `-w/--worktree` separately as a worktree option. Trust rejection stopped before a fixture worktree could be observed.
- [Cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging) requires v2.1.234+ on native Windows, while the one-shot idle notice requires v2.1.236+ in both sessions. Version 2.1.316 exceeds both stated minimums. The docs describe a notice “when that session next goes idle or exits”; subscriptions expire after 12 hours without a notice. The local successful exchange is runtime evidence for this install.
- The [agent view guide](https://code.claude.com/docs/en/agent-view) says an unattached finished or waiting session is stopped when it has been “unattached for about an hour.” This probe did not wait an hour and did not observe the reaper. The page also describes agent view as a research preview and says background sessions use the same subscription usage as interactive sessions.

The trust failure, absent GitHub remote, and remaining runtime questions are environmental/scope limits. No trust prompt was accepted and no settings-write command was run. At cleanup, I recorded current SHA-256 hashes and timestamps for user `settings.json`, `settings.local.json`, and `.claude.json`; project `.claude/settings.json` and `.claude/settings.local.json` were absent. No before-run hashes were captured, so these observations cannot establish a before/after comparison or prove that no unrelated background process changed them. The caller's temporary session had no `--bare` flag; its transcript was recycled after the critic reviewed it.

## Couldn't verify

- Whether `claude --bg --worktree` creates an isolated worktree for this ticket loop on native Windows: the fixture's trust check denied both background attempts before a session/worktree appeared. A human would need to launch Claude in that disposable fixture and accept its trust prompt to continue. I did not make that persistent trust choice.
- Whether a worker can safely push a ticket branch while never pushing `main`: the trunk fixture has no remote; the PR fixture would require a private GitHub repository, which this spike did not create. The branch rules above are fixture instructions, not observed pushes.
- The approximate one-hour idle process reap: found in current first-party documentation only; no timed run was made.
- Reliability beyond this single successful message/notice exchange, including held/refused inbound policies, expiry and long-running work: not established.

No fixture source edits were made. Baseline `npm.cmd test` passed (1 test, 0 failed/skipped/cancelled/todo) before cleanup. The exact owned marker session was stopped and removed with the supported CLI commands; `claude agents --json --all --cwd <exact-worktree>` then returned `[]`. After independent review, the 156,047-byte fixture (62 files), 174,595-byte rendered session log, and 5,907-byte collector script were sent to the OS recycle bin; paths were absent after cleanup. See the receipt for paths, bytes, checks, and the settings-comparison limit.
