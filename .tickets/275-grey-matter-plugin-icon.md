---
id: "275"
title: "Show a Grey Matter brain icon in plugin catalogs"
status: done
blocked_by: []
validation_criteria:
  - "test -s .kimi-plugin/icon.png && test -s .claude-plugin/icon.png && cmp .kimi-plugin/icon.png .claude-plugin/icon.png"
  - "node scripts/build-kimi-plugin.mjs && cmp .kimi-plugin/icon.png dist/kimi-plugin/icon.png"
  - "node --test scripts/kimi-plugin.test.mjs scripts/release-artifacts.test.mjs"
tags: ["tooling"]
---
Origin: Sam requested a Grey Matter brain or lightbulb-style plugin icon on 2026-11-08.

Scope: add a square, readable source PNG for Grey Matter and use it for the Kimi package and Claude catalog. Keep Codex and Antigravity coverage out of scope unless their native catalog support is implemented separately.

Context: `.kimi-plugin/kimi.plugin.json` has an empty `iconUrl`; Kimi's personal catalog accepts a root `icon.png` by convention. Claude accepts `.claude-plugin/icon.png`. `scripts/build-kimi-plugin.mjs` packages localization but not an icon, `scripts/kimi-plugin.test.mjs` has no icon assertion, and `scripts/release-artifacts.test.mjs` already seeds `.kimi-plugin/icon.png` in its fixture.

Done: the tracked icon is visually reviewed, packaged byte-for-byte by the Kimi builder, covered by regression tests, validated by the native Kimi validator, committed, pushed, deployed, and reflected on the delivery dashboard.

## Resolution (2026-11-08)

Added a visually reviewed 512px brain/lightbulb PNG to the Kimi and Claude catalogs. The Kimi builder now requires and packages it byte-for-byte, regression tests cover it, and manifest checks enforce parity. Deploy completed; Antigravity still reports its separate missing-logo warning. Removed disposable generation scripts and scratch images; dist/kimi-plugin remains reproducible build output.

### Verification
1. ✓ test -s .kimi-plugin/icon.png && test -s .claude-plugin/icon.png && cmp .kimi-plugin/icon.png .claude-plugin/icon.png — "node scripts/build-kimi-plugin.mjs && cmp .kimi-plugin/icon.png dist/kimi-plugin/icon.png: passed; node --test scripts/kimi-plugin.test.mjs scripts/release-artifacts.test.mjs: 35 passed; native Kimi validator: 0 errors, 2 pre-existing skillOverrides warnings; node scripts/gate.mjs pre-merge: 3 passed; pre-push: 3 passed; pushed e55738c"
2. ✓ node scripts/build-kimi-plugin.mjs && cmp .kimi-plugin/icon.png dist/kimi-plugin/icon.png — "(no evidence)"
3. ✓ node --test scripts/kimi-plugin.test.mjs scripts/release-artifacts.test.mjs — "(no evidence)"
