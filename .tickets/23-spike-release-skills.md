---
id: "23"
title: "Spike: validate the release-process skills (changelog, readme, release)"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "changelog judgment checked against a gold hand-written changelog for a real history range: entries user-facing not commit-dumps, refactor/test churn dropped, correct Added/Changed/Fixed/Removed bucketing, pulls from both commits and closed tkt tickets, no leaked hashes/ids/em-dashes"
  - "readme drift detection scored against a README with injected defects (broken install command, removed-feature-still-listed, dead link, stale version): which caught vs missed vs false-positive"
  - "release run end-to-end live in a throwaway repo with real git+gh: changelog promoted, [Unreleased] left empty, annotated tag created, GH release notes match the section; safe/idempotent on a dirty tree"
  - "release composition verified: it actually invokes changelog + readme via the Skill tool in kiro-cli and codex, not inlined or skipped"
  - "Primary integration test is dogfooding: cutting the next real release (v0.2.0) via the release skill counts as spikes 1+3"
tags: ["type:research", "stream:tooling"]
---

# Spike: validate the release-process skills (changelog, readme, release)

## What to build

Four spikes validating the release-process skill set (`changelog`, `readme`, `release`).
The mechanical tail (`release.sh`) is already proven this session: `bash -n` passes, the
gates reject an equal version and bad semver (exit 1, no mutation), and the dry-run plan +
changelog-section detection work. What's unverified is the **judgment** and a **real
live run**.

### Already proven (don't re-spike)

`release.sh` syntax, gate rejections, dry-run plan, changelog-section extraction.

### Spike 1 - changelog judgment (highest value)

Give `changelog` a real history range (our commits + closed tkt tickets since v0.1.0) in a
live harness run; score the output against a hand-written **gold** changelog for the same
range: entries user-facing (benefit, not mechanism), refactor/test/internal churn dropped,
correct Added/Changed/Fixed/Removed bucketing, pulled from both commits *and* closed
tickets, no leaked hashes/ids/em-dashes.

### Spike 2 - readme drift detection (seeded-bug eval)

Inject defects into a copy of README.md (broken install command, removed-feature-still-
listed, dead link, stale version line), run `readme`, score caught vs missed vs
false-positive. Same method as the diagnosing-bugs delta-debugging spike.

### Spike 3 - release end-to-end, live, isolated

In a **throwaway git repo with a real (or sacrificial) gh remote**, seed a CHANGELOG with
`[Unreleased]` entries and have a harness drive `release` to a real tag + `gh release`.
Verify: changelog promoted, `[Unreleased]` left empty, annotated tag created, release notes
match the section; safe/idempotent on a dirty tree. Must run sandboxed so it can't touch
grey-matter.

### Spike 4 - composition across harnesses

`release` calls `changelog` + `readme` via the Skill tool, a skill-calling-skill path we
haven't verified. Run `release` (dry-run) in kiro-cli (primary) and codex (secondary) and
confirm it actually invokes the two sub-skills rather than inlining or skipping them.

### Trigger: dogfood

The cheapest real test is to **use `release` to cut v0.2.0** and treat that as spikes 1+3
combined (real changelog judgment + real end-to-end run on this repo). Spikes 2 and 4 are
the targeted seeded-drift and composition checks run alongside. Low priority until the next
real release.

## Acceptance criteria

- [ ] changelog judgment checked against a gold changelog for a real range (user-facing, churn dropped, correct buckets, commits + closed tickets, no leaked hashes/ids/em-dashes)
- [ ] readme drift detection scored against a README with injected defects (caught/missed/false-positive)
- [ ] release run end-to-end live in a throwaway repo with real git+gh (changelog promoted, `[Unreleased]` emptied, annotated tag, notes match; dirty-tree safe)
- [ ] release composition verified: invokes changelog + readme via the Skill tool in kiro-cli and codex
- [ ] Dogfooding noted: cutting v0.2.0 via the release skill counts as spikes 1+3

## Re-triage (2026-10-29)

Partly dogfooded. The `release` skill drove grey-matter 0.2.0 and tkt 0.5.0 through
prepare, verify and stage on 2026-10-28/29 (review commit `6b983fc`, audit
[2026-10-29](../docs/agents/research/final-release-audit-20261029.md)). Its changelog
output went into the release notes but was not scored against a gold changelog, and
publication has not happened.

Activate when the staged pair is published: score the 0.2.0 notes against a hand-written
gold list (spike 1), record the publish run as spike 3, then run spikes 2 and 4.
