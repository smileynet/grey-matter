---
id: "230"
title: "Deployer suite takes 21 min on Windows vs 92s measured and times out its 600s gate"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Per-test timings for deploy.test.mjs and deploy-validation.test.mjs on Windows are recorded with the dominant cost named (subprocess, git, copy or AV)"
  - "node scripts/gate.mjs pre-merge --include deployer finishes inside timeout_s on an idle Windows host, or timeout_s/measured are updated with recorded evidence"
tags: ["kind:bug", "stream:test-verification"]
---

# Deployer suite takes 21 min on Windows vs 92s measured and times out its 600s gate

## What to build

Intent source: the 2026-11-03 deployer comparison for ticket 122. On the Windows host, the deployer suite (`node --test --test-timeout=120000 scripts/deploy.test.mjs scripts/deploy-validation.test.mjs`) took **1,286 s on clean `2fd6e4e`** and 1,308 s with the sandbox change (`dc7c134`). `gates.json` records 91.9 s (2026-11-01), so `node scripts/gate.mjs pre-merge --base HEAD --include deployer` timed out at 604 s.

Slowest base tests: "default roots: plugins count as the copy, and stale copies are taken back" 181.6 s; "agy: without the CLI, the deployer replaces only its own earlier copy" 104.6 s; "default roots: each harness gets one copy" 82.4 s; "Codex plugin removes owned copies…" 82.1 s; six more at 54–65 s. Single-test costs of 25–60 s point at per-test subprocess work (git, codex/claude/agy CLI probes, full skill copies), at host load, or at AV scanning of `%TEMP%`. Ticket 217's artifact-hygiene check also ran about 25x slower the same day, so check for a host-wide cause first (Defender exclusions, load) before changing tests.

Related: ticket 122 (deployer intermittency), 137 (slow gate groups), 216 (temp cleanup EPERM).

## Acceptance criteria

- [ ] Per-test timings for deploy.test.mjs and deploy-validation.test.mjs on Windows are recorded with the dominant cost named (subprocess, git, copy or AV)
- [ ] `node scripts/gate.mjs pre-merge --include deployer` finishes inside timeout_s on an idle Windows host, or timeout_s/measured are updated with recorded evidence
