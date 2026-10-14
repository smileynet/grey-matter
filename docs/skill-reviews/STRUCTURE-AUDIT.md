# Structure audit: authored skills vs the Agent Skills standard

Audit of the grey-matter skills authored so far against the agentskills standard
(mined into `.references/agentskills`). Done after the `pr` skill adopted the
standard's `references/` + trigger-tagged-pointer conventions. Records what was fixed
and what is a deliberate non-change.

## Hard rules (validator-enforced): all pass

- **Folder name == frontmatter `name`**: all 10 skills match.
- **Frontmatter fields**: all use `name` + `description`; `pr` adds `metadata`
  (credits), which is in the allowed set.
- **Required fields present**, YAML frontmatter well-formed: yes.

## Soft-rule fixes applied

- **`tdd` pointer was a bare "see X"** ("See tests.md for examples and mocking.md for
  mocking guidelines"), the exact anti-pattern the standard flags. Retagged with load
  conditions: read tests.md "when a test's shape is unclear", mocking.md "when the
  change touches a system boundary". The other skills' pointers were already
  trigger-tagged (code-review by project type, pr by "repo has existing PRs",
  writing-for-agents by "when the document is a skill").
- **All bare sibling `.md` files moved into `references/`** to follow the standard's
  layout: code-review (rubric-app, rubric-game), tdd (tests, mocking),
  writing-for-agents (SKILL-MECHANICS). In-skill links updated to `references/...`;
  SKILL-MECHANICS's back-link to its core is now `../SKILL.md`. `pr` already used
  `references/`. New skills default to `references/`.
- **Frontmatter / metadata cleaned up.** `pr`'s nested `metadata.credits` object was
  flattened to a one-line string pointing at `CREDITS.md` (metadata is inert string
  data; attribution prose lives in CREDITS.md). The all-up cross-harness frontmatter
  schema and the metadata rule are documented in `docs/skill-frontmatter.md`.

## Deliberate non-changes (soft recommendations we are not mechanically applying)

- **`disable-model-invocation` frontmatter** (grill-me, grill-with-docs, review-skill)
  is NOT in the standard's six-field allowlist, a strict agentskills validator would
  reject it. It is kept deliberately: it is the Claude-Code mechanism our inherited
  invocation convention (`invocation.md`) uses to mark user-invoked skills. This is a
  known portability tension (the standard has no portable "user-invoked" field); the
  decision is to follow our target harness, not the strict validator. Revisit if we
  target a harness that rejects unknown frontmatter.
- **Gotchas inline**: the standard says keep gotchas in the core, not a reference file.
  Spot-checked, our gotcha-like guidance (pr's evidence/merge-danger guards, tdd's
  anti-patterns) is inline. No change.

## Going forward

New skills: `references/` subdirectory for disclosed files, trigger-tagged pointers
("read X when Y"), gotchas inline, folder name == `name`, frontmatter limited to the
allowed set plus the deliberate `disable-model-invocation`. See `review-skill`.
