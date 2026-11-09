---
id: "292"
title: "publish the marketplace with a sha256-pinned archive plugin source and run the evidence hygiene sweep"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "marketplace entry offers an archive source pinned to the release bundle sha256 (release-artifacts.mjs already builds closed per-host bundles; the Claude bundle is ZCode-compatible)"
  - "docs/agents/research/evidence (715 files, ~107 MB) has been through the repository-artifact-hygiene lifecycle: superseded evidence deleted, keepers carry explicit lifecycle scopes"
  - "macOS (0.1.0 spike) and Windows (0.2.0) installs converge via plugins update from the published source"
tags: ["type:chore", "stream:tooling"]
---
From proposal 23 (G6) with the researched resolution (docs/agents/research/zcode-marketplace-prior-art-20261108.md, findings 3-5): LFS is ruled out (clones never fetch LFS content); archive sources from release assets are the documented lightweight route; pairs with the tkt repo's marketplace publication ticket.