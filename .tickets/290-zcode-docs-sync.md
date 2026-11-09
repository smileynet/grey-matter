---
id: "290"
title: "sync AGENTS.md deploy paragraph and distribution docs with the ZCode plugin route on Windows"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "AGENTS.md deploy paragraph names the ZCode plugin refresh alongside Claude/Codex/Antigravity/Kimi"
  - "distribution-maintenance.md ZCode section records the Windows CLI path, the state layout (cli/plugins/{marketplaces,cache,known_marketplaces.json,installed_plugins.json}, config at cli/config.json, app at %LOCALAPPDATA%\\Programs\\ZCode), and the one-route-per-machine rule phrased after the lineage's pick-one-per-agent"
tags: ["type:chore", "stream:tooling"]
---
From proposal 23 (G4). AGENTS.md's deploy paragraph omits the ZCode refresh deploy.mjs performs (tickets 274/280); distribution-maintenance.md documents only the macOS CLI path. Route rule resolved by research: plugin route for managed machines, copy route only where deploy owns the checkout, never both (user-scope copies shadow plugin skills).