---
id: "252"
title: "Keep mandatory gates scoped to durable safety checks"
status: done
blocked_by: []
tags: ["stream:test-verification"]
---
Intent: owner authorized implementing the mandatory-gate review recommendations. Split native Claude validation and experimental/model-specific scenarios into on-demand suites; preserve cheap safety fixtures; narrow blanket full triggers while retaining unknown-range safety. Acceptance: blocking manifests select durable safety cases; on-demand suites remain runnable; required checks pass; commit, push and local redeploy complete. Related: ticket 175 and ticket 250.

## Acceptance criteria

- [x] Native installed-tool validation is on-demand; static manifest checks remain blocking.
- [x] Experimental fixture and model-specific scenarios are separately runnable on-demand; safety cases remain blocking.
- [x] Known changes select affected checks; unknown ranges and explicit releases retain conservative coverage.
- [x] Required checks pass and changes are committed, pushed and locally redeployed.

## Resolution (2026-11-04)

done: cheap scoped safety remains blocking; native Claude, model expectations and spike demonstrations are on-demand. Manifest edits no longer fan out unrelated merge suites; unknown ranges and release checks remain conservative. Updated dashboard and policy; tkt native-test follow-up parked as tkt ticket262. No full release or cross-platform matrix claimed.

## Note — 2026-11-04

By: anonymous

<!-- tkt-note:v1 71894-1793817564711136000 -->
Fresh verification evidence: node scripts/gate.mjs pre-merge --base HEAD^ on code commit0901159 passed5/5 selected checks, no SKIP. node --test scripts/deploy.test.mjs scripts/deploy-validation.test.mjs passed60/60, no skips,58.7s. Runner fixtures30 pass/1 Windows-only skip. Split fake probe suites18 pass/5 platform skips; final on-demand pair rerun6 pass/2 Windows skips. Static-check fixtures12/12 and static/native boundary4/4 passed. Actual push passed6/6 selected pre-push checks. Docs, tool catalog149 paths, coverage44 gated/8 reasoned exclusions, and diff checks passed. tkt vendor consistency and applicable Node fixtures12/12 plus8 selected cases passed. Portfolio deployment refreshed both packs, strict Antigravity validation passed; audit retained only3 pre-existing unowned-root findings. No live model, whole-host scan, Rust rebuild or full release/platform matrix was run. Shared scratch/build outputs preserved; task transformation helpers moved to Trash; unrelated untracked proposal7414 bytes preserved.
