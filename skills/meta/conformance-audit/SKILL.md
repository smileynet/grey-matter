---
name: conformance-audit
description: "Audit a repo's skills, tool scripts, agent guidance, and docs against grey-matter's current standards, then apply the mechanically-safe fixes behind an approval gate. Use to re-conform an adopted repo as guidance evolves, or as a step inside adopt-project. Trigger: conformance audit, check repo against standards, re-conform, does this repo still follow current conventions."
---

# Conformance Audit

Measure a repo's agent/repo-health artifacts against grey-matter's **current** standards, then
apply the fixes that are mechanically unambiguous — leaving the judgment calls for a human. It is
the `check-repo.mjs` + `curate-docs` instinct pointed at *a* repo (often a foreign one): "does this
repo still follow current conventions, and where it trivially doesn't, fix it."

Two ways in: **standalone**, to re-conform a repo as grey-matter's guidance drifts (invocation
policy changes, a new consistency check, a reshaped skill); and **called by `adopt-project`** as a
pipeline step during a brownfield adoption. Same audit either way; the difference is only where its
fixes land (see Non-destructive).

This skill **consumes** grey-matter's standards, it does not re-author them. The standards live in
the checks and the convention docs (see Rule sources); conformance-audit reads them and measures a
target against them, so it stays current automatically as those sources evolve — which is the whole
point of being re-runnable.

## Two phases, in order

The skill runs **audit**, then a **gate**, then **fix**. The split is load-bearing: the full
classified report must exist and be approved *before* any fix is applied, so the assessment is never
rushed by fixing-as-you-find.

### Phase 1 — Audit (assess and classify; no edits)

Walk the four artifact classes (below) and, for each nonconformance, write a finding tagged
**safe-auto-fix** or **needs-judgment** (the line is below). Edit nothing in this phase. The output
is a report: each finding names the artifact, what's wrong, the rule it violates (cite the source),
and its tier.

### Gate

Present the report, most-actionable-first, grouped by class. The human approves which safe-auto-fixes
to apply. Judgment findings are surfaced for the human to act on (or to route — see Composition);
they are never auto-applied. Approval is required before Phase 2.

### Phase 2 — Fix (apply the safe tier only)

Apply the approved **safe-auto-fix** findings. Leave every **needs-judgment** finding as a surfaced
report item. Land the fixes non-destructively (below).

## The safe / judgment line

The tier is decided by one question: **does a mechanical rule already define the one correct form, or
does fixing it require interpreting intent?**

- **safe-auto-fix** — a deterministic rule says exactly what right looks like. A missing or malformed
  SKILL.md frontmatter field; a user-invoked skill missing its `agents/openai.yaml` sidecar; a skill
  absent from its bucket `README.md` or from `compass`; a tool script not wired into `check-repo.mjs`;
  a broken relative link; a doc misfiled against the `docs/agents` / dot-prefix rule. These are what
  the existing checks already define as right-or-wrong — the fix is the form the rule specifies.
- **needs-judgment** — fixing it means interpreting intent. Reshaping a bloated `AGENTS.md` into
  pointers; deciding a doc duplicates a skill's job; judging a steering rule a no-op; deduping
  overlapping skills; README content that has drifted from what the project does. Surface these;
  never auto-apply.

When unsure which tier, it is needs-judgment. The safe tier is for the genuinely unambiguous.

## The four artifact classes

1. **Skills** — `SKILL.md` frontmatter, invocation policy and its sidecar, bucket/index placement.
2. **Tool scripts** — wired into a consistency check, or dead/orphaned?
3. **Agent guidance** — `AGENTS.md` / `CLAUDE.md` / steering: pointer-style not reference-bloated, no
   no-ops, no duplication of a skill's job.
4. **Docs & organization** — `README.md` currency, `docs/` layout, relative links, stale or duplicate
   docs.

**Out of scope — the conformance surface only.** Audit *organization, currency-drift signals,
placement, links, duplication* — not content. Do **not** rewrite or fact-check documentation content
(that is `readme`'s and the authors' job), and do **not** assess domain-model / `GLOSSARY.md` content
accuracy (that is `domain-modeling` / adopt-project's characterize step). A README's *drift* is a
finding; rewriting its prose is not this skill's job.

## Rule sources (what "current standard" means)

Consume these; do not copy them into a new rubric (a fourth copy drifts):

- **Safe tier** — the rules the existing `scripts/check-*.mjs` embody (invocation policy, index
  set-equality, link resolution, installer safety). On a **foreign** repo that has no grey-matter
  scripts, apply the *rules those checks embody* against the target's files — do not run our scripts
  in their repo. When checking links by hand, skip fenced code and inline code spans (link-shaped
  example syntax there is not a link); adopt-project's `relocate-knowledge.mjs check-links` does this.
- **Judgment tier** — the convention docs: `writing-for-agents`, `docs/agents/doc-conventions.md`,
  `docs/agents/skill-frontmatter.md`, and the `readme` / `curate-docs` standards. A judgment finding
  cites the doc it violates, so it rests on a real rule, not an opinion.

**Grey-matter-internal rules are N/A on foreign skills.** Bucket READMEs, the `compass` router, and
`agents/openai.yaml` invocation sidecars are grey-matter's own distribution layout, not part of the
agentskills standard. On a repo that does not distribute its skills *through grey-matter* (its own
skill product, its own installer), report them as N/A, not as findings. Audit those skills against
the open standard instead: frontmatter shape and name rules, and links that resolve **where the
skills are installed**, not only in the source repo.

## Incumbent repos (polarity)

Fixes apply **regardless of an incumbent agent layer**. Under `adopt-project`'s **subsume-and-replace**
intent (`docs/adr/0002-adopt-project-soft-lens-polarity-gate.md`), an incumbent's nonconformance is the
*target* of adoption, not a protected authority — adopt-project is replacing that layer with
grey-matter's (lossless and gated; see ADR 0001/0002). So do not soften to report-only just because the
repo has its own AGENTS.md or skills. A standalone run is always on grey-matter's own adopted repo, so
the same applies there by default.

## Non-destructive

Land fixes on git: a clean working tree going in, fixes applied behind the Phase-1 gate, one reviewable
commit, never a byte overwritten outside an approved finding.

- **Standalone:** make your own commit for the applied fixes.
- **Called by `adopt-project`:** fold the fixes into adoption's reviewable commit (don't make a
  separate one), and return the findings list so adoption can present it at its own gate. Adoption
  files approved judgment findings as review-first migration findings; this skill doesn't file them.

## Composition — cite and recommend, don't call

For a judgment-tier doc finding, **cite** the convention it violates and **recommend** the skill that
owns the fix (`readme` for README drift, `curate-docs` for a stale/duplicate/promotable doc) as the
human's follow-up. Do not invoke `readme` or `curate-docs` mid-audit — they are interactive judgment
flows and calling them would cascade sub-sessions. Safe *mechanical* doc fixes (a broken link, a
misfiled doc) this skill applies itself in Phase 2; only the judgment doc work is deferred to those
skills.

## It's working if

- Every nonconformance across the four classes is a finding tagged safe-auto-fix or needs-judgment,
  each citing the rule it violates.
- The safe tier was applied behind the gate and landed in one reviewable commit; nothing was
  overwritten outside an approved finding.
- Judgment findings were surfaced (and routed to `readme`/`curate-docs` where they own the fix), never
  silently auto-applied.
- Re-running it on a conformant repo finds nothing to fix.

## Does not

- **Re-author the standards.** It consumes the checks and convention docs; it owns no rules of its own.
- **Rewrite content.** Doc prose and domain-model accuracy are out of scope.
- **Auto-apply judgment calls**, or call `readme`/`curate-docs` — it cites and recommends them.
