---
id: "76"
title: "Keep example text from hiding real packaged resource links"
status: in_progress
blocked_by: []
priority: high
validation_criteria:
  - "An unmatched bracket in a fenced example cannot hide a later valid local Markdown resource link"
  - "Referenced resources are packaged and missing targets fail before archive creation; fresh source and artifact regression checks pass"
  - "The vendored tkt deployer matches the canonical engine and rebuilt candidate archives resolve the previously missing evidence reference"
tags: ["stream:tooling"]
---

# Keep example text from hiding real packaged resource links

## What to build

Every real local resource linked from packaged Markdown is retained, even when
an earlier fenced or inline example contains an unmatched opening bracket.
Missing targets must fail packaging rather than disappear from the inventory.

## Intent source and observed failure

Found during the final ticket 70 Antigravity source-documentation audit of
candidate `bec5afee9f4f070ef898ac309d45d5061a5be7b5`. Its archived
`docs/agents/research/claude-current-validation.md` links to
`evidence/claude-validation-20261023.json`, but that JSON is absent from all three
host inventories. Native manifests still load; complete resource closure fails.

Direct reproduction: import `loadPack` and `agyResources` from
`scripts/deploy.mjs`, collect the frozen candidate's resources, and assert that
`docs/agents/research/evidence/claude-validation-20261023.json` is present. This
fails before source changes. The Markdown link regex starts at an unmatched
bracket inside earlier example code, consumes the later real label across lines,
and then discards the whole match because its start is in a code span.

## Context and scope

Read `markdownResources` and `agyResources` in `scripts/deploy.mjs`, plus the
resource fixtures in `scripts/release-artifacts.test.mjs`. Restrict plain link
labels so an unmatched example cannot consume a later line's link. Preserve
code-example exclusions and local path safety. Add real three-archive positive
and missing-target negative regression cases before changing the parser.

The deployer is canonical here and copied byte-for-byte to tkt
`tools/deploy.mjs`. Sync the regression coverage as applicable and commit/push
both repos independently. This is a packaging correction, not a manifest or
invocation-policy redesign. Refresh each local pack once, then rebuild the
approved 0.2.0/0.5.0 candidates and repeat affected product/native/upgrade gates.
Historical candidate reports remain historical; no publication is authorized.

## Acceptance criteria

- [ ] An unmatched bracket in a fenced example cannot hide a later valid local Markdown resource link.
- [ ] Referenced resources are packaged and missing targets fail before archive creation; fresh source and artifact regression checks pass.
- [ ] The vendored tkt deployer matches the canonical engine and rebuilt candidate archives resolve the previously missing evidence reference.

## Parser remediation checkpoint (2026-10-24)

Four artifact regressions failed before the source change (fenced and inline unmatched brackets, with present and absent resources), then all four passed after excluding an inner opening bracket from a link label match. Multiline and code-styled labels remain supported. The existing missing-resource test also retains the previous package until repair.

Evidence: `node --test scripts/release-artifacts.test.mjs scripts/deploy.test.mjs` → 63 passed, zero failed. A direct resource-closure assertion now finds `docs/agents/research/evidence/claude-validation-20261023.json` among 251 canonical source resources. The tkt vendored deployer has the identical fix; `mise run check` passed 37 Node tests, formatting, Clippy and all 296 Rust tests. Candidate rebuild and archive verification remain required before closure.
