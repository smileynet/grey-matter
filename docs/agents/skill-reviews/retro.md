# retro

- Bucket: engineering. Invocation: model-invoked since 2026-10-22 (was user-invoked; orchestrators like wrap-session must call it via the Skill tool, which Claude Code refuses for user-invoked skills; enforced by check-invocation-policy.mjs Check 3).
- Verdict: **adapt** (near-keep): fresh-context subagent + self-bias guard, file candidates as tickets (dedupe first), AGENTS.md repoint.

## What it is

A post-session retrospective that proposes improvements to the agent's **environment**
(not the code): 7 categories (navigation, automated checks, coding standards, global
AGENTS.md, tool economy, no-ops, information access), each with a "use when" trigger,
presented most-severe-first. Spine: the **implementation-vs-review context-pressure**
principle, standards belong to the review agent, not the pressured implementation agent.

## What it does for the user

Closes the loop: each session makes the next one's environment better, turning observed
mistakes into deterministic checks or lean steering edits.

## Prior art (agent-filtered)

Research (Anthropic skills-iteration + context engineering, agile retro, poka-yoke /
shift-left, CI/lint best practice, maker-checker review) found the spine well-grounded:

- **Improve-the-environment loop**: recognized inspect-and-adapt, extended to the agent
  harness. Sound.
- **Mechanical -> check, judgement -> prose standard**: poka-yoke / shift-left; "build
  the check over writing the rule" is well-grounded, and it is the same principle as the
  code-review rubric split, internally consistent.
- **No-guardrail-is-itself-a-finding**: CI/DevOps best practice.
- **Keep steering lean, prefer pointers, hunt no-ops**: writing-for-agents / context rot.
- **Standards at the review stage** (context-budget division of labor): sound; minor
  disagreement that some standards must be known at author time to avoid rework.
- **Session-trace analysis**: recognized (agent observability / learn-from-trajectory).

The one real agent risk: **self-retrospective bias**, an agent grading its own trace is
biased and blind to what it never logged.

## Decision

**Adapt (near-keep).** Changes:

1. **Fresh-context read via subagent** (step 2) to counter self-retro bias: dispatch a
   subagent to analyse the trace, and lean on deterministic checks over self-report. A
   shell-invoked fresh agent (harness CLI) is the alternative, spiked separately
   (ticket 09). This is the agent-audience fix.
2. **File accepted candidates as tickets** (step 5), consistent with code-review, but
   **present first, file on approval** (retro is advisory, not defect-detection), and
   **dedupe before filing**: check existing tickets, update an overlapping one rather
   than create a near-duplicate. The dedupe rule was also back-ported into code-review
   for consistency.
3. **AGENTS.md repoint**: the "Files" section now states AGENTS.md is the primary
   always-loaded steering (keep to pointers) and CLAUDE.md just points to it, matching
   our setup.
4. **Session-log location** noted as harness-specific, degrades to "the session the user
   points at".

Kept verbatim: the 7 categories + triggers, the mechanical-vs-judgement split, the
implementation-vs-review principle, most-severe-first.

## Cross-skill dependencies

Calls `writing-for-agents` (style). Files tickets via the issue-tracker doc (with
dedupe). Its mechanical-vs-judgement split mirrors `code-review`'s rubric. Pairs with
`diagnosing-bugs` (run retro after a fix to ask what would have prevented the bug).

## Web-app bias

None. Environment improvement is domain-neutral. No lens.
