---
id: "74"
title: "Ship complete license and attribution notices in plugin artifacts"
status: in_progress
blocked_by: []
spec: "release-readiness"
priority: high
validation_criteria:
  - "A durable provenance inventory cites exact upstream license/NOTICE sources for Matt Pocock and copied HumanLayer PR guidance, without guessing authorship or permissions."
  - "Both source repos and prepared plugin bundles retain applicable license texts, copyright/attribution notices and accurate license metadata."
  - "Packaging fixtures reject missing required notices and native conformance checks pass after metadata or resource changes."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Ship complete license and attribution notices in plugin artifacts

## Intent source

Found during ticket 65 on 2026-10-23. User requested source-documentation conformance and all findings resolved before release.

## What to build

Plugin recipients receive the applicable license texts and attribution notices with every source or generated distribution. Metadata describes the included licenses accurately. Preserve existing upstream terms; this task does not authorize guessing authorship, relicensing copied content, or submitting a directory listing.

## Context and sources

Read [HumanLayer notice research](../docs/agents/research/humanlayer-notices.md), [source conformance](../docs/agents/research/plugin-conformance.md), `skills/engineering/pr/CREDITS.md`, and both repos' plugin manifests. grey-matter declares MIT but has no root LICENSE. Its README identifies adapted Matt Pocock material; the PR skill credits almost-verbatim HumanLayer content. tkt has an MIT LICENSE but vendors grey-matter's deploy engine; generated packages currently copy skill resources rather than root legal artifacts.

Primary sources: [Matt Pocock LICENSE](https://github.com/mattpocock/skills/blob/main/LICENSE), [HumanLayer pinned LICENSE](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/LICENSE), and [HumanLayer pinned NOTICE](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/NOTICE). Preserve exact upstream copyright identities. The original copied HumanLayer revision is unknown; do not invent one. Scope any inventory claims accordingly.

Changes may span both repos and the canonical/vendored deployer. Include required notice artifacts in standalone skills and plugin bundles, with ownership/provenance clear; keep deployment refresh to the canonical command once per change. Ticket 67 preparation consumes these artifacts; final audit 70 is blocked by this ticket.

## Acceptance criteria

- [ ] A durable provenance inventory cites exact upstream license/NOTICE sources for Matt Pocock and copied HumanLayer PR guidance, without guessing authorship or permissions.
- [ ] Both source repos and prepared plugin bundles retain applicable license texts, copyright/attribution notices and accurate license metadata.
- [ ] Packaging fixtures reject missing required notices and native conformance checks pass after metadata or resource changes.

## Implementation and verification

[Notice inventory](../docs/agents/research/plugin-notice-inventory.md) records pinned
upstream terms, provenance limits and exact distribution paths. Implemented in
grey-matter `1190b6a` and tkt `5b6c867`; canonical engine 1.3.2 is byte-identical.
[Fresh six-host evidence](../docs/agents/research/evidence/notice-conformance-20261023.json)
verifies native loading after metadata/resources changed, including installed notice
bytes. Candidate preparation 67 must preserve and recheck these artifacts.
