---
id: "42"
title: "Add conformance-audit: audit a repo's skills/scripts/agent-guidance against current grey-matter standards"
status: open
blocked_by: []
priority: medium
tags: ["stream:tooling"]
---

# Add conformance-audit: audit a repo's skills/scripts/agent-guidance against current grey-matter standards

## What to build

A new user-invoked **meta** skill, `skills/meta/conformance-audit/SKILL.md` (+ `agents/openai.yaml`),
that audits a target repo's agent/repo-health artifacts against grey-matter's **current** standards and,
behind an approval gate, applies the mechanically-safe fixes. Invoked by `adopt-project` as a pipeline
step **and** runnable **standalone** so an already-adopted repo can be re-conformed as grey-matter's
guidance evolves.

## Settled design (grilled 2026-10-21)

- **Shape — two explicit phases in one skill.** Phase 1 **audit**: assess every target artifact against
  current grey-matter rules and produce a report classifying each finding **safe-auto-fix** vs
  **needs-judgment** (no edits). Then **gate**: present the report, human approves. Phase 2 **fix**:
  apply only the *safe-auto-fix* tier; the *needs-judgment* tier is left as surfaced findings. The
  two-phase split is deliberate — the full classified report must exist and be approved before any fix
  is applied (defends against fix-as-you-find rushing the assessment).
- **Safe/judgment line (mechanical).** *Safe-auto-fix* = a deterministic rule already defines the one
  correct form (missing/malformed frontmatter field, absent `agents/openai.yaml` sidecar for a
  user-invoked skill, a skill missing from its bucket README/compass index, a tool script not wired
  into `check-repo.mjs`, a broken relative link, a doc misfiled against the dot-prefix/`docs/agents`
  rule). *Needs-judgment* = requires interpreting intent (reshape a bloated AGENTS.md into pointers,
  dedupe overlapping skills, judge a no-op steering rule, decide a doc duplicates a skill, README
  content drift).
- **Rule source (b): consume, don't re-author.** The safe tier reuses the rules the existing
  `scripts/check-*.mjs` already embody; the judgment tier reads from the convention docs
  (`writing-for-agents`, `doc-conventions.md`, `skill-frontmatter.md`) and cites `readme`/`curate-docs`.
  No new standalone rubric (that would be a fourth copy that drifts). Note: a *foreign* repo doesn't have
  grey-matter's `check-*.mjs`, so "apply the checks" means applying the **rules those checks embody**
  against the target's files, not running our scripts there.
- **Scope — four artifact classes, bounded.** (1) **skills** (frontmatter, invocation policy, sidecars,
  bucket/index placement); (2) **tool scripts** (wired into a check? dead?); (3) **agent guidance**
  (AGENTS.md/CLAUDE.md/steering: pointer-style, no-ops, duplication); (4) **docs & organization**
  (README currency, `docs/` layout per `doc-conventions.md`, links, staleness, duplication).
  **Out of scope:** rewriting/fact-checking doc *content* (that's `readme`/authors) and
  domain-model/`GLOSSARY.md` *content accuracy* (that's `domain-modeling`/adopt-project's characterize
  step). The audit checks *organization, currency-drift signals, placement, links, duplication* — the
  conformance surface — and surfaces content judgments rather than making them.
- **Incumbent / polarity.** Fixes apply **regardless of incumbent**: under adopt-project's
  **subsume-and-replace** intent (ADR 0002), an incumbent's nonconformance is the *target*, not a
  protected authority. (Replacement is lossless + gated by default via adopt-project; automatic only if
  the user specifies.) Standalone runs are always effect-install (it's our own adopted repo).
- **Non-destructive — git.** Fixes land as a reviewable commit (own commit standalone; folded into
  adoption's single commit when called by adopt-project), behind the approval gate, never clobber.
- **Composition — cite-and-recommend, not call.** It does not invoke `readme`/`curate-docs` mid-audit
  (they're interactive judgment flows; calling them would cascade sub-sessions). It **cites** their
  conventions for judgment-tier findings and **recommends** "run `curate-docs`/`readme` on this" as the
  human's follow-up. It applies safe *mechanical* doc fixes (a broken link, a misfiled doc) itself.
- **Bucket/invocation/name:** user-invoked `meta` (`disable-model-invocation: true` + sidecar); name
  `conformance-audit` (audit is primary; the gated fix phase is the bounded extension).

## Context

Surfaced while grilling ticket 40 (`adopt-project`). Adoption shouldn't only bring a repo *under* the
workflow — it should bring it up to *current standard*. Made a distinct skill (not a step inside
adopt-project) because: (1) grey-matter's guidance is a moving target, so a repo adopted earlier drifts
and needs periodic re-audit without re-adopting; (2) it is "run grey-matter's health/maintenance
standards against *this* repo" — the `check-repo.mjs` + `curate-docs` instinct pointed at a foreign
repo; (3) it keeps adopt-project a composer.

Read first: `.tickets/40-adopt-project-brownfield.md`, `docs/adr/0002-adopt-project-soft-lens-polarity-gate.md`,
`scripts/check-repo.mjs` + `scripts/check-*.mjs`, `skills/meta/curate-docs`, `skills/meta/readme`,
`skills/productivity/writing-for-agents`, `docs/agents/doc-conventions.md`, `docs/agents/skill-frontmatter.md`.

## Acceptance criteria

- [ ] `skills/meta/conformance-audit/SKILL.md` exists, user-invoked (`disable-model-invocation: true`) with the Codex sidecar `agents/openai.yaml`, written to the `writing-for-agents` rules.
- [ ] It runs as **two phases** — audit (assess + classify safe-auto-fix vs needs-judgment, no edits) → approval gate → fix (apply only the safe tier; needs-judgment stays surfaced).
- [ ] It audits the **four classes** (skills, tool scripts, agent guidance, docs & organization), consuming the existing `check-*.mjs` rules (safe tier) and the convention docs (judgment tier) — not a new rubric; and excludes doc-content rewriting and domain-model accuracy.
- [ ] It is runnable **standalone** and invokable by `adopt-project`; fixes apply regardless of incumbent (subsume intent); **cite-and-recommend** `readme`/`curate-docs` for judgment-tier doc findings rather than calling them.
- [ ] **Non-destructive on git:** safe fixes land as a reviewable commit, behind the gate, never clobber.
- [ ] Indexes updated (bucket README + compass + maintenance-skills roster) and `node scripts/check-repo.mjs` passes; deployed via install-skills.mjs.
