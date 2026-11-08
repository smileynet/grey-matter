---
id: "275"
title: "Show a Grey Matter brain icon in plugin catalogs"
status: open
blocked_by: []
validation_criteria:
  - "test -s .kimi-plugin/icon.png && test -s .claude-plugin/icon.png && cmp .kimi-plugin/icon.png .claude-plugin/icon.png"
  - "node scripts/build-kimi-plugin.mjs && cmp .kimi-plugin/icon.png dist/kimi-plugin/icon.png"
  - "node --test scripts/kimi-plugin.test.mjs scripts/release-artifacts.test.mjs"
tags: ["tooling"]
---
Origin: Sam requested a Grey Matter brain or lightbulb-style plugin icon on 2026-11-08.\n\nScope: add a square, readable source PNG for Grey Matter and use it for the Kimi package and Claude catalog metadata. Keep Codex and Antigravity coverage out of scope unless their native catalog support is implemented separately.\n\nContext: .kimi-plugin/kimi.plugin.json has an empty iconUrl; .claude-plugin/plugin.json has no icon. scripts/build-kimi-plugin.mjs packages localization but not an icon, scripts/kimi-plugin.test.mjs has no icon assertion, and scripts/release-artifacts.test.mjs already seeds .kimi-plugin/icon.png in its fixture.\n\nDone: the tracked icon is visually reviewed, packaged byte-for-byte by the Kimi builder, covered by regression tests, validated by the native Kimi validator, committed, pushed, deployed, and reflected on the delivery dashboard.