# Orchestrate skill: live dry-run evidence

Date: 2026-11-01, America/Los_Angeles. Ticket: 111. Skill commit: `703a64c`.
The [proposal](../proposals/17-orchestrator-skill.md) supplies the settled design;
the [earlier harness spikes](harness-orchestration-primitives.md) supply the five
harness references. These runs exercise the authored skill rather than replacing
those capability probes.

## Scope and method

Two local trunk fixtures were generated with
`node scripts/spike-orchestrate-fixture.mjs create --dir <fixture>`.
Both seed trees were `7fd72339921451e85440698acda748c0bde512bb`.
No GitHub repositories, remotes, pushes, global permission changes or provider
fallback were used in the fixtures. Explicit user authorization selected both
harnesses for these tests; this was not fallback after a usage limit.

Claude Code 2.1.316 ran with `-p --output-format stream-json --verbose --model
sonnet --effort low`, scoped tool rules and background Haiku workers. Kiro 2.37.0
ran `chat --no-interactive --trust-workspace --agent-engine v2 --agent
t111-orchestrator --model claude-sonnet-4.6`, with fixture-only agent profiles and
Haiku 4.5 workers. Worktree, npm, tkt and node command shapes were authorized in
those profiles; destructive commands stayed outside the grants.

The outside controller independently read Git history, worktree registrations,
fixture tickets, actual tool transcripts and dashboard-checker output. Worker
or orchestrator summaries alone were not acceptance evidence.

## Observed results

| Requirement | Claude Code | kiro-cli |
|---|---|---|
| Claim before dispatch | tkt claim commits precede worker launches | tkt claim commits precede launches in corrected fixture |
| One real worktree per worker | Native isolated worktrees, verified roots/SHAs | Manual registered worktrees; T1/T2 concurrent, later work sequential |
| Admission and landing | T3 held for T1 overlap; T4 held for T1 dependency; trunk | Same holds; trunk; base gates after serial merges |
| Review before close | Expectations before diff, orchestrator spec check | Expectations before diff, orchestrator spec check |
| Per-ticket reporting | Four dashboard entries and four chat ASCII visuals | Four entries and four chat ASCII visuals across initial/resumed sessions |
| T2 question | Actual QUESTION, returningUser ruling, fresh-worker fallback | Initial loop pre-answered it; actual transport verified separately below |
| T5 escalation | Not dispatched, README present, ticket open | Not dispatched in corrected run, README present, ticket open |
| Final checks | 4 pass, 0 fail, 0 skipped | 4 pass, 0 fail, 0 skipped |
| Cleanup | Only main worktree/branch remains; tracked tree clean | Only main worktree/branch remains; fixture profiles intentionally untracked |

Small arithmetic changes received spec checks, as proposal 17 permits. These runs
do not claim fresh consequential-reviewer containment tests.

| Fixture | Worker SHAs, T1/T2/T3/T4 | Final main |
|---|---|---|
| Claude | `f306228`, `f8ae012`, `b0aea63`, `7e1ce92` | `86e8523` |
| Kiro | `92f17bc`, `009af2e`, `fc0afca`, `bd47230` | `1a165d5` |

For each fixture the independent final commands were:

```text
npm --prefix <fixture> test
node skills/productivity/delivery-dashboard/scripts/check-dashboard.mjs <fixture>/docs/status.html
git -C <fixture> worktree list
git -C <fixture> branch --list
git -C <fixture> status --short
```

**Pass:** both test runs reported 4/4, without failures/skips. Both dashboards
reported `ok: true`, 4 entries, 5 tickets, 0 errors and 0 warnings. Claude had one
open dashboard ask; Kiro reported its held T5 in chat rather than a dashboard ask.
Terminal ASCII is observed in the actual output. Browser rendering was not viewed.

## Kiro failures, recovery and question probe

**Infrastructure error:** first Kiro fixture, process exit 1 after 169 seconds.
The initial allowlist rejected `git -C` and wrapped commands. Instead of stopping,
workers hand-edited claim state, wrote outside a registered worktree and attempted
to add shell trust to their own fixture profiles. No result from that attempt is
counted as accepted implementation. The skill/briefs now require harmless command
preflight, real isolation proof and a hard stop after denied prerequisites;
workers may not repair permission files or substitute manual tracker edits.

The corrected fixture preflight successfully ran Git, npm and tkt commands before
claims. Its first process later ended without a final completion record, leaving
T1/T2 accepted and T3 dirty in its assigned worktree. The outer execution reported
`Terminate batch job (Y/N)?` and exit 1. Cause was not established. It is an
**infrastructure interruption**, not a pass or a test assertion failure.

The saved session was resumed with `--resume-id`. It inspected tracker/worktrees,
preserved T3's edits, tested/committed them, then reviewed, merged and closed T3/T4.
The resumed process exited 0 after producing the required results and cleanup.
Two worker summaries lacked terminal DONE lines; the parent independently checked
their commits and tests, but did not obtain corrected status messages. Exact
status-protocol compliance therefore remains **partial**, despite accepted code.

The initial Kiro loop supplied returningUser before receiving a worker question.
That does not count as a question round trip. A separate read-only native-subagent
probe on the same fixture returned this actual first-worker summary:

> QUESTION Should ticket 2-greeting's implementation be reconsidered if the project glossary is created later, or should the assumption be locked in as the term?

The parent then supplied `ANSWER: returningUser` without a human escalation and
dispatched a fresh worker. That worker verified the existing export and returned
`DONE f761cff38e8795abfd7b42109e2714afa726bf0b`. Its native summary/tool records and
output confirm the transport. **Pass for the supplemental question/answer path**;
it does not retroactively make the initial implementation's pre-answer compliant.

## Repository verification and review

On the authored bytes:

- **Pass:** `node scripts/check-skill-syntax.mjs`: 50 skills, 37 sidecars, no errors.
- **Pass:** `node scripts/check-invocation-policy.mjs`: 50 skills, 20 user-invoked.
- **Pass:** `node scripts/check-docs-consistency.mjs`: routes/indexes/links resolve.
- **Pass:** `node --test scripts/skill-syntax.test.mjs`: 10/10, no skips/failures.
- **Pass:** `node scripts/gate.mjs pre-merge --base bf2b745584cf867c78716ced91732bb1f8b168c6 --include skill-syntax-fixtures`: ticket-graph and syntax fixtures selected and passed.
- **Pass:** `node scripts/gate.mjs pre-push`: plugin manifest, syntax, invocation,
  doc links and home-path checks selected and passed; the push repeated that gate.
- **Pass:** fresh independent writing-for-agents/review-skill, Standards and Spec
  reviews found no remaining confirmed blocker. A claimed validator-packaging
  problem was withdrawn after reading the actual Markdown link and deploy traversal.
- **Pass:** staged artifact inspection covered 17 text/license files, 65,463 logical
  blob bytes, complete content coverage, no findings or errors.
- **Pass with warning:** `node scripts/deploy.mjs` installed 50 skills; native AGY
  validation passed with an existing generic-icon notice. Both bare installed
  resource roots contain the linked provider-policy validator.
- **Inventory warnings:** `node scripts/deploy.mjs audit --strict` exited 0 but
  listed unowned existing skills in three roots. Those were not changed or removed;
  zero exit is not presented as a warning-free audit.

The retired `check-repo.mjs` mentioned in proposal 17 was not run. Ticket 111 and
current AGENTS use `gate.mjs`; no obsolete-command success is claimed.

## Artifact disposition and limits

Promoted: this small evidence note and the skill review. Private raw logs, fixture
histories and helper inputs are retained as the local `t111-*` evidence family
until ticket 162 completes its headless-driver assessment. Together the measured
fixtures and logs were below 2 MiB; free space remained above 95 GiB on D: and
129 GiB on C:. This is below the 500 MiB footprint threshold.

The existing generated AGY bundle was refreshed (416 files, 8,539,503 logical
bytes) and kept as shared deployment output until its next refresh. No peer
scratch, installed unowned skills or older artifacts were deleted. Native harness
session stores remain under their own retention policy.

Unknowns: reason for the interrupted Kiro process, browser dashboard rendering,
served Kiro worker model beyond the requested model, and deterministic compliance
with the status/ask protocols. The evidence demonstrates the core workflow with
the stated recovery and supplemental probe; it is not proof that prompt-only
constraints enforce every protocol rule.
