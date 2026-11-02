# orchestrate

## What it is

A user-invoked session role over independent tickets, rather than one spec on an
integration branch. The portable loop admits, dispatches, reviews, lands and reports;
harness mechanics live in five disclosed references.

## What it does for the user

The user can delegate a frontier session while retaining high-risk decisions.
Workers own isolated implementation; the parent resolves ordinary questions and
requires fresh acceptance evidence before closing each ticket.

## Prior art

[Proposal 17](../proposals/17-orchestrator-skill.md) records the user's decisions
on contextual landing, risk-scaled review and dashboard plus chat visuals.
[Kiro Crew](../research/kirocrew-orchestration.md) is prior art, not authority.
[Spikes 125-129](../research/harness-orchestration-primitives.md) supply observed
dispatch, permission, wait, review and cleanup behavior. Failed probes become
explicit fallbacks, especially Claude's removed empty worktrees, Kiro's summary
transport and Crew's unenforced deletion escalation.

## Decision + why

**new**, as settled by the user in proposal 17. Keep implement and implement-spec
unchanged. User-only invocation uses Claude frontmatter plus the Codex sidecar.
Worker briefs carry the implementation contract instead of implicitly invoking
the user-only implement skill. Read-only reviewers return proposed tickets for
the parent to file, preserving code-review's reporting intent without write tools.

Writing-for-agents review: portable ordered steps retain acceptance bounds;
role contracts and harness branches are disclosed with explicit pointers.
Provider policy and dashboard schema link to their authorities rather than
caching their fields. Live tool schemas override historical limits and flags.

## Cross-skill dependencies

tkt supplies claims/closes; tdd supplies behavior slices; code-review supplies
consequential Standards/Spec reviews; delivery-dashboard owns visual entries;
artifact hygiene owns worktree/scratch disposition. Compass and orient recommend
this user-invoked role; neither silently starts a fan-out.

## Web-app bias

None: file ownership, resource leases, checks and observable outcomes apply to
app and game work. Shared simulators/devices are exclusive resources.

## Validation

Fresh writing-for-agents/review-skill and independent Standards/Spec reviews of
`703a64c` found no remaining confirmed blocker. The denial/isolation finding was
fixed before that commit; an alleged missing validator resource was rejected
after checking its Markdown link and the deployer's transitive resource walk.
[Live dry-run evidence](../research/orchestrate-skill-dry-runs-20261101.md) records
the Claude and Kiro runs, failed attempt, resumed work and supplemental question
probe. Protocol adherence is partial; the note distinguishes it from code/test
acceptance and leaves the remaining transport questions with ticket 162.
