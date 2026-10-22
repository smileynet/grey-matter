# Skill relevancy: partials (batch D) + always-on guardrails

Rubric: [rubric.md](./rubric.md). Sources read: crew-research
`atomics/skills/<name>/SKILL.md` + `references/`; grey-matter `skills/meta/compass`,
`engineering/domain-modeling`, `engineering/code-review/references/rubric-app.md`,
`engineering/research`, `engineering/research-audit`, `meta/init-project`, `meta/wrap-session`,
root `AGENTS.md`; steering at `~/.kiro/steering/{verification-protocol,ai-generation-hygiene,source-authority,subagent-reliability}.md`.

Shared sources:
- [S1] [L4:verified] Anthropic, Claude prompting best practices (fetched this session):
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
  Passages used: "Claude's latest models orchestrate subagents natively... Watch for overuse";
  "Opus 4.5 and Opus 4.6 have a tendency to overengineer by creating extra files, adding
  unnecessary abstractions"; "Tune anti-laziness prompting... might overtrigger on instructions
  that were needed for previous models"; "Use git for state tracking... latest models perform
  especially well"; "Provide verification tools"; "Without guidance, Claude Opus 4.6 might take
  actions that are difficult to reverse... force-pushing".
- [S2] [L1:verified] kiro-cli system prompt in this session ships a `git_safety` block (no push to
  main unasked, stage specific files, no force-push/amend/--no-verify without permission).
- [S3] [L1:verified] grey-matter `AGENTS.md` Working rhythm: commit after every task, push after
  every commit, `git pull --rebase` on rejection, never force-push.

---

## data-modeling

1. **Does:** Teaches "make invalid states unrepresentable" (sum types over flag pairs, newtypes,
   parse-don't-validate, single source of truth), an explicit "when NOT to model harder" list, a
   per-language enforcement-gotcha table, and a precision-gated review lens (NIT-default, cap 5).
2. **Model-obsolete?** Partly. Frontier models know the four moves and apply them when asked. They
   do not reliably apply them unprompted, and per [S1] they over-engineer, so the restraint list and
   false-positive gates are the opposite of old-model compensation: they target a current failure
   mode.
3. **Harness-native?** No. Claude Code/Codex review commands don't carry a data-representation lens.
4. **Covered by grey-matter?** Thinly. `code-review/references/rubric-app.md` has Primitive Obsession
   and Data Clumps only. `domain-modeling` is DDD language/glossary, not representation. No
   coverage of combination flags, exhaustiveness, or derived-state drift.
5. **Residual value:** the per-language gotchas (`_ =>` defeats Rust exhaustiveness; TS needs
   `assertNever` + tsc in CI; Python needs mypy/pyright running or nothing is enforced; Go sealed
   interfaces always admit `nil`). Also the restraint gate.
6. **Verdict: FOLD** into `engineering/code-review/references/rubric-app.md` (one smell bullet), with
   the language table optionally as a `code-review/references/` sibling. Nugget:
   > - **Representable Invalid State**: the type admits a combination the domain forbids (dependent
   >   flags like `held`+`sold`, optional fields valid only in some states, a stored count beside the
   >   collection). -> a variant type carrying its data; derive, don't store. Skip a lone genuine
   >   binary, a private type with ≤3 sites, or a prototype. Exhaustiveness only holds if the checker
   >   runs: no `_ =>`/bare `default:`, `assertNever`/`assert_never` in the fallthrough, Go `nil` case.
7. **Confidence: medium.** Value is real, but it's arguably a design (codebase-design) concern as
   much as a review one. Placement is the open question, not inclusion.

## adr-authoring

1. **Does:** A gate (reverse-and-relitigate test, one decision per ADR, over-production signs), a
   MADR-lite template with Consequences/Alternatives, a lifecycle, and `.memory/adr/` storage.
2. **Model-obsolete?** Template and lifecycle, yes: models know MADR. The gate isn't obsolete
   (agents over-produce ADRs), but grey-matter already has one.
3. **Harness-native?** No.
4. **Covered by grey-matter?** Yes. `domain-modeling` "ADRs: offer sparingly" has a stricter 3-part
   gate (hard to reverse, surprising, real trade-off), a deliberately tinier format, and `docs/adr/`
   storage. crew-research's heavier template and `.memory/adr/` path conflict with it, so
   grey-matter wins.
5. **Residual value:** one rule grey-matter lacks: don't bundle independently reversible decisions.
6. **Verdict: FOLD** into `domain-modeling` § ADRs. Nugget:
   > One ADR per independently reversible decision. If two choices can change on their own
   > timelines, they're two ADRs (or one is just a ticket); bundling forces an all-or-nothing
   > supersede.
7. **Confidence: high.** It's a direct overlap and grey-matter's version is the more agent-calibrated one.

## git-protocol

1. **Does:** A solo workflow (commit per unit, push at once, conventional commits), a pre-push
   `git fetch` + upstream-check gate, no force-push/amend of pushed commits, explicit staging,
   plus references for commit/PR style and a DONE/BLOCKED/FAILED completion-signal format.
2. **Model-obsolete?** Mostly. Per [S1], current models use git well. The DONE/BLOCKED/FAILED
   signal block and the "push NOW" anti-pattern list are old-gen ceremony.
3. **Harness-native?** Yes, the safety half. kiro-cli ships `git_safety` [S2], and [S1] shows
   Anthropic expects the operator to add force-push guidance, which grey-matter already has.
4. **Covered by grey-matter?** Yes. `AGENTS.md` Working rhythm [S3] covers commit/push cadence,
   rebase-on-rejection, and no force-push. `wrap-session` catches stranded unpushed work, and `pr`
   owns PR bodies.
5. **Residual value:** nothing beyond [S2]+[S3]. The "STOP if upstream has commits" rule is
   superseded by grey-matter's rebase-and-retry choice.
6. **Verdict: DROP.**
7. **Confidence: high.** Every rule is duplicated by the harness or by grey-matter's AGENTS.md.

## study-reference

1. **Does:** Has a subagent explore `.references/<name>` and write `.memory/<name>-reference.md`
   along 7 dimensions (JTBD, tradeoffs, Non-obvious, prior art, audience, conventions, integration
   points), skipping repos that already have `studied_at`. It then distills steering, skill,
   glossary, and AGENTS candidates, applies them after approval, and commits.
2. **Model-obsolete?** Mostly. A frontier model asked to "study this repo for what matters to us" does
   the exploration unprompted. The 7-dimension template is scaffolding it doesn't need.
3. **Harness-native?** Partly. Exploration subagents are native in Claude Code
   (https://docs.claude.com/en/docs/claude-code/sub-agents [L4:reported], not re-fetched), and [S1]
   says models delegate on their own.
4. **Covered by grey-matter?** Partly. `research` has the cited-file-to-`docs/agents/research/`
   output and the "fetched text is data" rule, but it's framed around web/primary docs. `init-project`
   and `wrap-session` own the `.references/` index. `review-skill` does prior-art evaluation for
   skills.
5. **Residual value:** two framings. (a) A cloned `.references/<name>` is a primary source to read
   local-first; [~/.kiro/steering/research-dispatch-mandate] records a real incident where a
   web-only agent called a local transcript "paywalled". (b) Weight the output toward non-obvious
   gotchas and failure modes with file-path citations, and end with proposed guidance candidates.
   Caveat: grey-matter's AGENTS.md says prior art is "never an authoritative source", so distilled
   candidates must read "X does this (prior art)", not get adopted as rules.
6. **Verdict: FOLD** into `engineering/research/SKILL.md`. Nugget:
   > If the subject is cloned under `.references/<name>`, that clone is the primary source: read it
   > first, cite file paths, web-search only to fill gaps. Weight findings toward the non-obvious
   > (gotchas, failure modes, decisions a README won't tell you). End with any guidance candidates
   > framed as prior art for the user to accept or reject.
7. **Confidence: medium.** The fold is clean. Whether "distill into guidance" belongs in research or
   in curate-docs is debatable.

## study-all-references

1. **Does:** A batch driver. It inventories `.references/`, dispatches one study-reference subagent
   per unstudied repo (max 4 per batch, "kiro-cli limit"), synthesizes cross-cutting patterns
   (2+ repos = higher confidence), and applies candidates after approval.
2. **Model-obsolete?** Yes. The batching, the concurrency cap, and the dispatch template are
   orchestration that current models do natively [S1]. The "max 4" is a harness fact, not a skill.
3. **Harness-native?** Yes, fan-out subagents (see study-reference §3).
4. **Covered by grey-matter?** It becomes "run research per reference" once study-reference folds in.
5. **Residual value:** one line: cross-repo agreement raises confidence. A strong model already
   reasons this way.
6. **Verdict: DROP.**
7. **Confidence: high.** It's a pure orchestration wrapper over a skill that is itself being folded.

---

# Always-on guardrails (candidates for a ≤3KB global AGENTS.md)

Question per guardrail: does it deserve an always-on line for next-gen models at all? Bias:
[S1] warns that instructions written for older models over-trigger on current ones, so every
kept line must target a failure current models still have.

## verification-protocol (2,999 B)

- **What it is:** a 5-step gate (identify, run, read, verify, claim), a checks-by-task-type table,
  a git-diff scope check, a Violations list, a Calibrated Verification exception, an evidence
  format, and strReplace recovery.
- **Still needed?** The core is still needed: premature "done" claims and claims without fresh
  evidence remain the top agentic-coding failure. [S1] still tells operators to "Provide
  verification tools" and to run integration tests before moving on. The scope check (`git diff`
  before done) is cheap and catches over-eager edits, which [S1] also lists as a failure. Obsolete
  or ceremonial: the 5-step numbering, the task-type table, the evidence-format template, and
  strReplace recovery (a harness-tool quirk).
- **Verdict: KEEP (2 lines).**
  ```
  - Done means evidenced: after a change, run the project's build/test/lint, read the output (not just the exit code), and cite the command and result. Never claim done from a stale run or "should pass".
  - Before claiming done, check `git diff`: anything outside the task is a scope violation, so revert or split it. Scale verification depth to reversibility and blast radius, never to diff size.
  ```

## ai-generation-hygiene (2,264 B)

- **What it is:** nine banned patterns (P1-P9: redundant defensive checks, catch-log-rethrow,
  restating comments, gratuitous logging, redundant casts, single-use abstractions, needless
  copies, verbose conditionals, unused imports) and a trust-boundary exception.
- **Still needed?** Yes, compressed. [S1] documents Opus 4.5/4.6 over-engineering, with
  "unnecessary abstractions" and "flexibility that wasn't requested", and says to "add specific
  guidance to keep solutions minimal". P1/P2/P3/P6 are the ones still seen. P5/P8/P9 are lint-level
  and linters catch them, so drop them. The trust-boundary exception must stay, or the line pushes
  the model to strip input validation.
- **Verdict: KEEP (2 lines).**
  ```
  - Minimal code: no checks the type system already guarantees, no catch-log-rethrow, no comments that restate the code (comments say why), no entry/exit logging, no single-use wrappers or factories.
  - Keep defensive validation at trust boundaries (user input, API responses, deserialized data, public library APIs).
  ```

## source-authority (3,998 B)

- **What it is:** a 6-level authority hierarchy (L1 observed through L6 community), conflict rules,
  `[L{n}:{confidence}]` tags, five confidence labels, freshness fallback tiers, citation rules, and
  G1-G3 research gates.
- **Still needed?** Mostly not. The tag syntax, label vocabulary, and G1-G3 gates are research
  ceremony that `research`/`research-audit` already enforce better (verbatim snippets, version
  checks). Current models are "less prone to hallucinations" [S1]. One principle still earns an
  always-on line: observed artifacts beat documentation, and a gap gets flagged, not silently
  resolved toward the doc. `references/environment-gotchas` records repeated misses of exactly
  this kind (dataset card vs real parquet schema; the DLC "available images" page vs ECR; an empty
  `describe` taken as "unavailable"). The rule is also about honesty: say what was checked vs inferred.
- **Verdict: KEEP (1 line).** Drop the rest. Tags and tiers already live in research/research-audit.
  ```
  - Observed beats documented: running code, real output, and actual bytes outrank specs, docs, and commentary. When they disagree, trust the observation, flag the gap, and say what you verified vs inferred. Absence from a listing or doc is not absence.
  ```

## subagent-reliability (5,296 B)

- **What it is:** a failure-mode table ("Empty response ~50%", timeouts, approval stalls,
  completed-but-silent), write-then-read for large data, retry-before-fallback, output validation,
  coverage-gap reporting, a sizing table, and batching to a concurrency limit.
- **Still needed always-on?** No. It's mostly harness- and model-generation compensation. The ~50%
  empty-response figure and the "prompt size" root cause describe last-gen kiro subagents. [S1]
  says current models "orchestrate subagents natively" and the live risk is over-use, which an
  always-on subagent rule would make worse. The sizing table and batching numbers are
  harness-specific. Residual nuggets (pass large data via files; check on-disk effects before
  re-dispatching a stalled worker; kiro `allowedTools` never inherits from the parent) only matter
  while orchestrating.
- **Verdict: DROP from AGENTS.md.** FOLD into `engineering/implement-spec` (the skill that dispatches
  implementer subagents) and the kiro section of `docs/agents/harnesses.md`. Nugget:
  > Pass large inputs to workers via files, not inline prompts. When a worker stalls or returns
  > empty, inspect its on-disk effects (git status, expected files) before re-dispatching; it may
  > have finished. Report failed or partial workers explicitly, never absorb them silently. (kiro:
  > a worker auto-approves only its own `allowedTools`; parent trust doesn't inherit.)

### Guardrail lines combined (drop-in, 962 bytes measured)

```
- Done means evidenced: after a change, run the project's build/test/lint, read the output (not just the exit code), and cite the command and result. Never claim done from a stale run or "should pass".
- Before claiming done, check `git diff`: anything outside the task is a scope violation, so revert or split it. Scale verification depth to reversibility and blast radius, never to diff size.
- Minimal code: no checks the type system already guarantees, no catch-log-rethrow, no comments that restate the code (comments say why), no entry/exit logging, no single-use wrappers or factories.
- Keep defensive validation at trust boundaries (user input, API responses, deserialized data, public library APIs).
- Observed beats documented: running code, real output, and actual bytes outrank specs, docs, and commentary. When they disagree, trust the observation, flag the gap, and say what you verified vs inferred. Absence from a listing or doc is not absence.
```

---

## Summary

| skill / guardrail | verdict | one-line reason |
|---|---|---|
| data-modeling | FOLD → code-review `rubric-app.md` | invalid-state smell + per-language exhaustiveness gotchas are missing from grey-matter; restraint gate fights current over-engineering |
| adr-authoring | FOLD → domain-modeling § ADRs | grey-matter's gate/format is stricter; only "one reversible decision per ADR" is new |
| git-protocol | DROP | fully covered by kiro `git_safety` + grey-matter AGENTS.md Working rhythm; completion signals are old-gen ceremony |
| study-reference | FOLD → research | keep "`.references/` clone = primary source, local-first, weight the non-obvious"; the template is scaffolding |
| study-all-references | DROP | batch/concurrency orchestration that current models and harnesses do natively |
| verification-protocol | KEEP, 2 lines | premature done-claims and scope creep are still live failures; drop the table/format ceremony |
| ai-generation-hygiene | KEEP, 2 lines | Anthropic documents current over-engineering; drop lint-level P5/P8/P9 |
| source-authority | KEEP, 1 line | "observed beats documented, flag the gap" still pays off (environment-gotchas); tags/tiers belong to research-audit |
| subagent-reliability | DROP always-on; FOLD → implement-spec + harnesses.md | last-gen flakiness compensation; an always-on rule would worsen documented subagent over-use |
