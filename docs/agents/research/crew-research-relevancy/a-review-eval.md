# Skill relevancy: review & eval group (dispatch-review, review-new-work, multi-agent-validation, eval-criteria)

Rubric: [rubric.md](./rubric.md). Sources read: each crew-research
`SKILL.md` + all `references/`; grey-matter `compass`, `engineering/code-review`, `engineering/retro`;
tickets 06 (model-eval harness) and 09 (shell-invoked fresh agent).

Harness sources:
- [L4:verified] Claude Code skills/commands doc, https://code.claude.com/docs/en/slash-commands. It
  ships a bundled `/code-review` (alias `/review`) and `/security-review`, says "a project code-review
  skill replaces /code-review, and the bundled alias /review never runs your skill", and documents
  `claude plugin eval` plus the skill-creator plugin's `evals/evals.json` loop (with/without-skill
  baseline, graders, threshold that fails CI).
- [L4:verified] Codex developer commands, https://learn.chatgpt.com/docs/developer-commands?surface=cli
  (redirect from developers.openai.com/codex/cli/slash-commands). Lists `/review`.
- kiro-cli: I found no built-in review command. Not verified against kiro.dev docs, so treat it as unknown.

---

## dispatch-review

1. **What it does:** It spawns external reviewer CLIs (codex by default, or a matrix of opencode,
   agy, and claude models), gives each a RUN_ID, and runs `review-new-work`. It then fail-closed
   verifies that each reviewer produced either exactly one pushed, remote-reachable findings ticket
   carrying that RUN_ID, or a clean marker. Matrix mode fans in by location+category and tiers each
   finding as Consensus, Majority, or Individual.
2. **Model-obsolete?** Mostly, in its machinery. RUN_ID correlation, "re-read the ticket from the
   fetched commit, never trust stdout", and the indeterminate≠clean rule all exist because reviewers
   used to silently fail or hallucinate success (the same lineage as subagent-reliability's "~50%
   empty" claim). Some of that still applies to CLI subprocesses, but a 7-step verification ritual is
   too much for current harness subagents.
3. **Harness-native?** Partly. Claude Code `/code-review` and `/security-review` and Codex `/review`
   cover single-model review. None of the three harnesses offers a *cross-family* review matrix
   natively. [L4:verified, URLs above]
4. **Covered by grey-matter?** Yes, mostly by `code-review`, which runs two parallel sub-agents
   (Standards + Spec) and files findings as tkt tickets with overlap checks. What grey-matter lacks
   is model-family diversity: both of its axes run on the same model.
5. **Residual unique value:** (a) Different model families miss different bug classes, so the
   review lever is family diversity, not re-running one model. (b) The tool contracts: validate
   reviewer output by content (`is_error==false`, `result.status=="SUCCESS"`, `step_finish
   reason:"stop"`), never by exit code. agy's `--print=` is greedy, and codex needs
   `--skip-git-repo-check` in untrusted dirs. (c) A degraded or quota-exhausted reviewer is a
   coverage gap, never a pass. (d) Keep solo-model findings, labelled low-confidence.
6. **Verdict: `FOLD`.** Add an optional "cross-family second opinion" note to
   `engineering/code-review` (a reference file, not the body). Nugget:
   > Optional cross-family leg: run the same Standards brief through a different model family's CLI
   > (`codex exec`, `claude -p --output-format json`). Validate by output content, never exit code;
   > a timed-out/empty/quota-hit reviewer is a reported coverage gap, never "clean". Tier merged
   > findings by agreement but keep single-model findings, labelled low-confidence.
   The CLI-invocation facts also belong in ticket 09 (shell-invoked fresh agent spike).
7. **Confidence: medium.** The family-diversity claim rests on crew-research's own L5 experience,
   not on a cited study.

## review-new-work

1. **What it does:** It keeps a review-coverage ledger (`.codex/review-marker.json`) so each review
   covers `reviewed_through..HEAD` automatically. It also runs a resumable "adoption" pass over all
   history (batches of 25 commits and 15 tickets, ancestry-closed checkpoints, ticket path+blob
   tracking). It reviews Standards + Spec, including closed tickets against their AC, and emits one
   high-priority aggregate "unconfirmed" findings ticket.
2. **Model-obsolete?** The review method is: Standards/Spec checklists are default frontier
   behaviour, and grey-matter's `code-review` already does both axes. The ledger is not model
   behaviour but a state contract. Even so, ancestry-closed batching and blob-pinning are elaborate
   bookkeeping that most repos never need.
3. **Harness-native?** No harness tracks "last reviewed commit". Claude Code `/code-review` and Codex
   `/review` review a diff or branch on demand. [L4:verified, URLs above]
4. **Covered by grey-matter?** Mostly, by `code-review`. It requires a user-supplied fixed point
   instead of a marker. `retro` does not overlap; it grooms the environment, not the code.
5. **Residual unique value:** (a) **Findings are hypotheses.** The filed ticket says
   `Confirmation status: unconfirmed`, and whoever works it must reproduce each finding before
   editing, marking it confirmed, rejected, or obsolete with evidence. Reviewer agreement raises
   priority but never waives reproduction. grey-matter's code-review files findings as
   ready-to-fix tickets, which risks agents "fixing" false positives. (b) Review closed tickets
   against their AC and resolution, which catches unearned closures. (c) "Coverage is not approval."
   The full-history adoption ledger is too situational for a global skill, and `adopt-project`
   covers brownfield onboarding.
6. **Verdict: `FOLD`.** Put this into `engineering/code-review` step 5 (ticket filing). Nugget:
   > Findings are reviewer hypotheses. Each filed ticket's AC starts with "reproduce and mark each
   > finding confirmed / rejected / obsolete (with evidence) before changing code"; only confirmed
   > findings get fixed (with a regression test where practical). When the diff closes tickets,
   > the Spec axis also checks each closed ticket's acceptance criteria were actually met.
7. **Confidence: high.** I read both skills in full, and the gap is concrete: code-review's ticket
   AC currently says "what fixed means" and nothing about confirming the finding first.

## multi-agent-validation

1. **What it does:** It sends an artifact (mainly rendered images, but also code and docs) to 2-3
   validator tools (codex, agy/Gemini, kiro) in assigned roles: visual inspector, technical
   auditor, contextual judge. Any FAIL means investigate, and split verdicts follow role-precedence
   rules. A reference file holds per-tool CLI flags, token costs, and observed false-positive
   patterns.
2. **Model-obsolete?** Mostly. "Use several perspectives, resolve disagreements, record evidence"
   is generic and a strong model does it when asked. The rule "kiro's standards drift after many
   iterations" compensates for old-model context fatigue. The token-cost table is dated
   model-specific data.
3. **Harness-native?** Partly. All three harnesses read images natively. None provides
   cross-vendor validator orchestration. Claude Code subagents give a fresh context but use the
   same model family. [L4:verified, code.claude.com URL above; kiro image support per global
   image-handling steering, L4:reported]
4. **Covered by grey-matter?** Partially. `code-review` covers code. `prototype` (game-feel scene)
   and `pr` (before/after visual evidence) are where visual artifacts arise, and neither covers
   validating renders. The code and doc halves of this skill are covered or obsolete.
5. **Residual unique value:** One non-obvious gotcha: **vision judges flag intentional
   stylization (toon/cel shading, hard shadow edges, low variation) as defects unless the prompt
   declares it intended.** A second, smaller one: an auditor that names a root cause is often right
   about the symptom and wrong about the cause, so verify against docs before acting. The CLI
   flags overlap dispatch-review and belong in ticket 09.
6. **Verdict: `FOLD`.** Add to `engineering/prototype` (game-feel / UI-variant branch) as a
   one-paragraph "validating renders" note. Nugget:
   > When asking a model to judge a render, state the intended style as desired ("hard cel-shadow
   > edges are intentional, not aliasing") and phrase criteria as YES/NO checks ending PASS/FAIL —
   > otherwise vision judges report stylization as defects. Treat a judge's root-cause diagnosis
   > as a hypothesis; trust its symptom report more than its cause.
7. **Confidence: medium.** The gotcha is single-team L5 observation. `prototype` is the best home
   I can find, but the body may want it in `docs/agents/` instead.

## eval-criteria

1. **What it does:** It is a style guide for writing LLM-judge eval rubrics. It prefers binary
   YES/NO checklists with a mechanical count→score mapping over 1-5 ordinal prose, and falls back
   to an anchored ordinal scale with anti-compression wording. It also sets one signal per eval, a
   mandatory auto-fail, and thresholds by judge-panel size, and says a high false-positive rate is
   a label bug until proven otherwise. A reference file gives transcript red flags and a monthly
   "delta regression" re-run to detect a model catching up to a skill.
2. **Model-obsolete?** No. LLM-judge central-tendency bias is a property of the judges themselves.
   A model writing a rubric unprompted will usually produce a holistic 1-5 scale. The session-review
   reference *is* obsolete: it lists stale kiro subagent tool limits and "retry amplification" red
   flags.
3. **Harness-native?** Partly. Claude Code has `claude plugin eval` (graders plus a threshold gate)
   and the skill-creator `evals/evals.json` loop. Both run evals but give no guidance on rubric
   design. [L4:verified, code.claude.com URL above]
4. **Covered by grey-matter?** No skill covers it. Ticket 06 (model-eval harness, backlog) is the
   consumer, and its "re-validate wording as models change" goal matches the delta-regression idea.
   `retro` does fresh-context session review, which covers the useful part of
   `references/session-review.md`.
5. **Residual unique value:** (a) Decompose into 10-15 independently observable binary checks,
   then derive the score mechanically. (b) Say "do NOT award by default" on the top ordinal anchor.
   (c) A high false-positive rate against a labelled corpus means fix the labels or criteria
   before touching the skill. (d) Delta (with-skill vs without-skill) is more stable than an
   absolute threshold, and a shrinking delta means the model has internalized the skill, which is
   a demotion signal. The quoted accuracy figures ("~87% binary vs 38-58% ordinal") are uncited in
   the source; tag them [L6:tentative] until sourced.
6. **Verdict: `PROJECT`.** Useful only where someone is building evals, i.e. grey-matter's own
   ticket-06 harness. Drop it globally. When ticket 06 un-parks, carry points (a)-(d) into that
   harness's `docs/agents/` reference. Drop `references/session-review.md`.
7. **Confidence: medium-high.** The design guidance is sound and not model-obsolete. Its audience
   is narrow (eval authors), which argues against a global skill.

---

## Incidental finding (not a verdict)

grey-matter's skill is named `code-review`, and Claude Code bundles its own `/code-review`. Per the
Claude Code doc, a project or personal `code-review` skill replaces `/code-review`, but the bundled
alias `/review` still runs Claude's built-in reviewer, not grey-matter's. Users typing `/review` in
Claude Code get the non-two-axis, non-ticketing review without noticing. That is worth a line in
`docs/agents/harnesses.md`. [L4:verified, https://code.claude.com/docs/en/slash-commands]

## Summary

| skill | verdict | one-line reason |
|-------|---------|-----------------|
| dispatch-review | FOLD → `code-review` reference (+ ticket 09) | Verification ritual is old-model machinery. Keep cross-family second opinion + "validate by content, gap ≠ clean". |
| review-new-work | FOLD → `code-review` step 5 | Ledger/adoption is too situational. Keep "findings are unconfirmed hypotheses, reproduce before fixing" + check closed-ticket AC. |
| multi-agent-validation | FOLD → `prototype` (render validation) | Generic multi-perspective advice. Keep the one gotcha: declare intended stylization or vision judges flag it. |
| eval-criteria | PROJECT (grey-matter ticket 06) | Judge-rubric design is not model-obsolete but is only useful to eval authors. Session-review ref is stale. |
