# Proposal 13: skills and critics that keep status dashboards honest

**Status:** proposed 2026-10-27. **Scope:** `delivery-dashboard` (references and step 5),
`wrap-session`, `orient`, `adopt-project`, `conformance-audit`; two reviewer prompts drafted below.
**Builds on:** [ADR 0004](../../adr/0004-delivery-dashboard-keeps-a-searchable-history.md), the
[dashboard contract](../../../skills/productivity/delivery-dashboard/references/dashboard-contract.md)
and the [prior-art review](../research/status-dashboard-prior-art-20261027.md).

## The gap

The template and `check-dashboard.mjs` enforce shape: fields, limits, links, offline, size. They
cannot judge the two things that make a status page worth reading.

1. **Voice.** Is the headline an outcome in the owner's terms, or the agent's process wearing a
   friendlier title? Does an ask really answer in a word? A regex catches ticket numbers, not
   "Streamlined the review pipeline".
2. **Truth.** Does the evidence support "you can now…"? Is "Live" earned? Does a metric trace to
   something real? Is the open ask still open? An agent grading its own work tends to round up.

The prior art answered the same problem with a fresh critic: tagalog-helper runs a copy critic
(`ui-copy-critic`) and a theme critic before presenting UI, each with a coverage ledger,
a findings format, and a verdict that says what it did not cover. Its lessons carry over: review
in a fresh context, record what was and was not reviewed, trace claims to their source, and never
let "no findings" mean "everything passed".

## Proposal

### 1. Two critics, as references first

Add `references/copy-critic.md` and `references/results-critic.md` to `delivery-dashboard`
(drafts below). `delivery-dashboard` step 5 becomes: checker, copy critic, results critic, open.
Each critic runs in a fresh context (a subagent where the harness has them), is **read-only**, and
returns findings; the author applies fixes and re-runs until clean.

Promote either one to a standalone skill only when a second consumer needs it. The copy critic
generalises to other human-facing prose (PR bodies, changelog entries, wrap-session summaries) and
is the likely first promotion, as `copy-critic`. The results critic stays tied to dashboards
because its evidence model (fidelity rung, entry, ask) is theirs.

| Option | For | Against |
| --- | --- | --- |
| Standalone skills now | Discoverable, reusable | Two more routable skills with one consumer; the router and the cheat sheet grow before the need is proven |
| **References inside `delivery-dashboard` (recommended)** | One owner, loaded only at step 5, no router noise | A second consumer must promote it later (a small move) |

### 2. Wire the dashboard into the rest of the workflow

| Skill | Change |
| --- | --- |
| `wrap-session` | If `AGENTS.md` records a dashboard path, update it as part of closing the session. |
| `orient` | At session start, read the dashboard's open asks and surface them first ("two decisions are waiting on you"). |
| `adopt-project` / `init-project` | Seed a dashboard from the blank template and record its path in `AGENTS.md` (ticket 89 covers the three existing projects). |
| `conformance-audit` | For a repo with a dashboard, run `check-dashboard.mjs` and report errors as safe-tier findings, copy and results issues as judgment-tier. |

### 3. Proving the critics work

A critic that has never caught a seeded defect is a guess. Build fixtures before trusting either:

- Start from the worked example (it must come back CLEAN, zero false positives).
- Seed ten defects and require the right critic to catch at least eight: process-voice headline,
  praise or hype, a decision buried in the summary, an ask whose recommendation is not
  recommended by the evidence, "Live" on mocked work, a metric with no source, a stale open ask,
  a screenshot of a previous build, an omitted failing check, an overclaiming summary.
- Record the catch rate in the ticket. Re-run on any change to a critic prompt.

## Dispatch contract (both critics)

- **Input packet:** dashboard path; the entry id or ids under review; the work's evidence pointers
  (ticket, diff range, test output path, capture paths); the project glossary; the previous
  dashboard version from git for comparison.
- **Fresh context:** the critic has not seen the author's reasoning, only the packet.
- **Read-only:** the critic never edits the dashboard, tickets or code, and runs only read-only
  or already-approved commands.
- **Output:** the findings format below, a verdict, and a coverage ledger saying what was reviewed
  and what was not. Raw output goes to `.scratch/`; a short summary goes on the originating ticket.
- **Loop:** author fixes, critic re-reviews the changed entries, until no actionable findings remain
  in the declared scope. Unresolved findings become tickets with a durable location.
- **Cost control:** the copy critic runs on every entry (it is cheap). The results critic runs on
  entries that claim `live` behaviour, carry a metric, or hold an ask; a pure decision or learning
  entry needs only the copy critic.

### Findings format

`entry id · field · exact current text · problem · plain replacement or needed evidence · priority`

Priority: **P1** leads the owner to a wrong decision or a false belief that work is done;
**P2** misstates scope, fidelity or an ask; **P3** clarity or tone that does not change meaning.
Verdict: CLEAN, MINOR ISSUES, or REWRITE NEEDED (copy); SUPPORTED, PARTLY SUPPORTED, or
UNSUPPORTED (results). CLEAN and SUPPORTED mean no findings in the declared scope, never that
unreviewed entries or unexercised behaviour passed.

## Draft: copy critic (`references/copy-critic.md`)

> Review the wording of the named dashboard entries as the project owner would read them. You have
> not seen how the work was done; judge only what the page says. Do not edit anything.
>
> **Coverage.** List every entry and field in scope: title, summary, changes, asks (question,
> recommendation, options, impact), visual captions and alt text, labels, empty states. Mark each
> reviewed or not reviewed.
>
> **Check each against these questions.**
> 1. *Outcome.* Does the title say what the owner can now do, see or decide? Reject titles that
>    describe what the agent did ("Implemented", "Refactored", "Added support for").
> 2. *Sausage.* Any ticket, commit, file, component, tool, framework, test count or process word in
>    the title, summary or changes? It belongs in Details.
> 3. *Load.* One headline, at most three changes, one visual. Is anything the owner does not need
>    to decide or act on competing for attention?
> 4. *Asks.* Can the owner answer in one line without opening anything? Is the recommended option
>    stated, one of the options, and distinguishable from the others? Is the impact concrete (cost,
>    time, what it unblocks)? Are the options real alternatives and exhaustive enough to decide?
> 5. *Honesty of tone.* No praise, hype, or reassurance ("great progress", "seamless"). State results
>    without judging the owner or the work. Hedges that were in the evidence survive.
> 6. *Terms.* Words from the project glossary, used as defined. Familiar words over jargon. The same
>    thing called the same name across entries.
> 7. *Labels.* Wireframe, mocked and live labels present on everything not live, and worded the same
>    way throughout. Planned work never reads as done.
> 8. *Empty and error states.* Plain sentences that say what is true and what happens next.
>
> **Return** findings in the findings format, the verdict, and the coverage ledger. A rewrite you
> propose must keep the meaning and the hedges of the original.

## Draft: results critic (`references/results-critic.md`)

> Check whether the evidence supports what the named dashboard entries claim. You are reviewing
> claims, not wording. Do not edit anything. Prefer observing the thing itself over reading about
> it.
>
> **Claim ledger.** For each entry list every claim the owner could rely on: each "you can now…",
> each change bullet, each metric, each fidelity label, and each ask's stated impact. For each
> claim record its evidence (observed by you, cited by the author, or none) and its status:
> *observed*, *cited and plausible*, *unsupported*, or *contradicted*.
>
> **Check.**
> 1. *Observe.* Where the claim is about behaviour, run or open it (the page, the app, the command)
>    and see it. A claim you could not exercise is listed as unverified, not passed.
> 2. *Fidelity.* A `live` label needs real data or the working experience; sample data means
>    `mocked`; nothing built means `wireframe`. A label stronger than its evidence is P2, or P1 if
>    it could change a decision.
> 3. *Trace.* Each number traces to a computation or a source the owner could repeat. Check the
>    denominator and the date. A metric that cannot be traced is unsupported.
> 4. *Scope.* Compare the claims with the originating ticket's acceptance criteria and the diff.
>    Flag claims beyond what was built, and built work the entry does not mention if the owner
>    would care.
> 5. *Evidence freshness.* A capture shows the current build, not a previous one; a "before" image
>    really is the earlier state. Check dates, commits and file times against the entry.
> 6. *Omissions.* A failing, skipped or flaky check, a known limitation, or a workaround that the
>    entry leaves out is a finding. Details must list what was not verified.
> 7. *Asks.* The decision is real and still open; the owner has not already answered in the ticket
>    or earlier entries; the recommendation follows from the evidence rather than from what is
>    easiest to build; the impact is accurate.
> 8. *Rolling.* Earlier entries were not rewritten to match later events, and answered asks were
>    kept, not deleted.
>
> **Return** the claim ledger, findings in the findings format, the verdict, and a list of what you
> could not verify and why. State plainly that SUPPORTED means "no unsupported claims found among
> those exercised".

## Rollout

One ticket each, in order; all behind the repo gate.

1. Copy critic reference, seeded-defect fixtures for it, and the catch-rate record.
2. Results critic reference and its seeded fixtures.
3. `delivery-dashboard` step 5 dispatches both; `wrap-session` and `orient` read the dashboard.
4. `conformance-audit` runs the checker and reports copy and results issues by tier.
5. Promote the copy critic to a skill when `changelog`, `pr` or `wrap-session` needs it.

## Open questions

- Should the results critic be run on a different model family from the author, as `dispatch-review`
  advises for code review? It costs more and may be worth it only for P1-prone entries (live claims
  and asks).
- Where a harness has no subagents, the author reads the critic prompt in a fresh session. Is a
  documented manual path enough, or should the checker refuse a handback with no critic record?
- Whether critic findings should be summarised on the dashboard itself ("reviewed by a second
  pass") or kept off it. The owner rarely needs this; the ticket keeps the record.
