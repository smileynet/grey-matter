# Proposal 13: skills and critics that keep status dashboards honest

**Status:** accepted 2026-10-27, except the harness table in "Critic model", which waits for the spike in proposal 14. **Scope:** `delivery-dashboard` (references and step 5),
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
- **Model:** pinned explicitly to the best available model for the harness, with effort set, and
  recorded in the output (see [Critic model](#critic-model)).
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

## Critic model

Decision from the owner: critics always run on the best available model, and the guidance must work
across tools. The official documentation, checked 2026-10-27, supports this rule; the evidence and
sources are in [critic-model-selection-20261027](../research/critic-model-selection-20261027.md).

### The rule

1. **Pin a model explicitly on every spawn.** Never inherit from the parent. A parent on a faster
   model would otherwise review on that model: Claude Code, Codex and opencode all inherit by
   default.
2. **Use the harness's ceiling model, or the strongest it offers** (table below). A below-ceiling
   run proceeds and is marked as such.
3. **Set the effort explicitly.** Opus 5.5 defaults to `medium`, so leaving it unset quietly
   weakens the review. Use `high` for both critics, and `xhigh` for the results critic on entries
   that make live claims or carry an ask, where a wrong verdict costs the most.
4. **No silent downgrade.** Probe availability before spawning. If the first choice is unavailable,
   use the next and say so. Every critic result states `Reviewed on: <model> at <effort>`, taken
   from what actually ran, because an allowlist, an environment override or a gateway can change it
   after the request. A model outside the list is run anyway and the result is marked "unlisted
   model", so the owner can discount it.
5. **One table, one date.** Model names live in one place, [harnesses](../harnesses.md), with the
   date they were last verified and their official sources. Critic prompts and skills say "the
   critic model in harnesses" and never hard-code a name. A guidance check (proposal 12) flags the
   table when it is older than 90 days, and `sync` re-verifies it.
6. **Scope, not strength, controls cost.** The packet is one entry plus its evidence pointers. A
   weaker model is not the cost lever. Skipping the results critic on pure decision and learning
   entries (above) is.

### Ceiling models and mechanics

Owner decision (2026-10-27): **Claude Opus 5.5 and GPT-6.1 Sol**, because both are available on
subscription plans. Fable 5.1 and Astra are costlier or billed separately (Fable can use usage
credits), so they are an opt-in escalation, not the default. "Best available" therefore means
the ceiling below, or the strongest model the harness offers when the ceiling is missing. The
spike in [proposal 14](./14-critic-model-spike.md) verifies each row on a real machine before this
table goes into `harnesses.md`.

| Harness | Ceiling | If the ceiling is unavailable | Pin with | Effort |
| --- | --- | --- | --- | --- |
| Claude Code | `opus` (`claude-opus-5-5`) | Newest Opus the plan allows, recorded | The `model` parameter of the spawn, or `model:` in a critic agent file | `effort:` or the per-spawn parameter; Opus defaults to `medium`, so set `high` |
| Codex | `gpt-6.1-sol` | Strongest model in the CLI's catalog, recorded | `model` and `model_reasoning_effort` in a `.codex/agents/*.toml` file, `-m` and `-c` on `codex exec`, or `[agents] default_subagent_model` | `high`; `xhigh` where supported |
| Kiro CLI | Strongest Claude in `--list-models`, in the order Opus 5.5, Opus 5, Opus 4.x | Same | `--model` or `model` in the agent file, using an ID from `--list-models` | `--effort` |
| opencode | `zai-coding-plan/glm-5.3` (owner's z.ai subscription; below the Opus 5.5 and Sol 6.1 target) | Next in the provider's list | `-m provider/model` or `model:` in the agent file; the flag outranks the file | `--variant` (recorded in `opencode export`) |

On the machine used for this review, only Claude Code lists the ceiling models (opencode lists them under a provider whose key is expired; it runs on z.ai instead). Kiro
CLI 2.16.0 lists Claude Opus 4.5 as its strongest Claude, and Codex 0.147.0's catalog (fetched
2026-10-21) lists `gpt-5.6-sol`, with no 6.1 model. Those harnesses would run critics below the
ceiling today, which is why the rule requires recording what ran.

### Points for the owner to decide

- **Raising the ceiling.** If a project wants Fable 5.1 or Astra for high-stakes entries, the
  ceiling is a per-project setting in `harnesses.md`, not a change to the critic prompts.
- **Below-ceiling harnesses (decided 2026-10-27).** A harness that cannot reach the ceiling runs
  its critics on the best model it does offer, and the result is marked `below ceiling` next to
  `Reviewed on:`. It does not defer to another harness and it does not skip the review. Today that
  is Kiro CLI on Claude Opus 4.5 and Codex 0.147.0 on `gpt-5.6-sol`. The spike (proposal 14)
  records the exact best-available model per harness; a harness with no verifiable model keeps
  the `unverified` caveat instead.
- **Cross-family review.** Where a Claude and a Codex harness are both installed, the results critic
  could run on the family the author did not use. Off by default.
- **Where the files live.** Critic agent files in each harness's native format could be generated
  from one source and installed by the deployer. Until then the skill instructs the author to pass
  the model and effort on the spawn, which every harness above supports.

## Rollout

One ticket each, in order; all behind the repo gate.

1. Copy critic reference, seeded-defect fixtures for it, and the catch-rate record.
2. Results critic reference and its seeded fixtures.
3. `delivery-dashboard` step 5 dispatches both; `wrap-session` and `orient` read the dashboard.
4. `conformance-audit` runs the checker and reports copy and results issues by tier.
5. Promote the copy critic to a skill when `changelog`, `pr` or `wrap-session` needs it.
6. Add the model table to `harnesses.md` and the spawn rule (explicit model and effort, record what ran)
   to the critic dispatch, before step 3 above wires it in.

## Open questions

- Whether the results critic should prefer a different model family from the author's when a second
  harness is installed (see "Critic model"). The default proposed there is best model per harness.
- Where a harness has no subagents, the author reads the critic prompt in a fresh session. Is a
  documented manual path enough, or should the checker refuse a handback with no critic record?
- Whether critic findings should be summarised on the dashboard itself ("reviewed by a second
  pass") or kept off it. The owner rarely needs this; the ticket keeps the record.
