---
id: "289"
title: "mirror the tkt dependency on the marketplace entry so ZCode resolution sees it"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - ".claude-plugin/marketplace.json grey-matter entry carries dependencies [{\"name\":\"tkt\",\"marketplace\":\"tkt\"}], identical to the plugin manifest declaration"
  - "no version pins anywhere in the dependency (plugin.json version silently wins; docs warn against duplication)"
  - "deploy check --static asserts entry and plugin-manifest dependency sets agree, so they cannot drift"
tags: ["type:enhancement", "stream:tooling"]
---
From proposal 23 (G3) with the researched resolution (docs/agents/research/zcode-marketplace-prior-art-20261108.md, finding 1): Claude Code binds dependencies in plugin.json (a dependency starts enabled regardless of defaultEnabled); ZCode resolves only the marketplace entry copy. Dual declaration makes the dependency binding in both harnesses; neither auto-installs cross-marketplace, and distribution docs already tell users to install tkt explicitly.