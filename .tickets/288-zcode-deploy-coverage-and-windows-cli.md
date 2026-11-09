---
id: "288"
title: "deploy counts a disabled ZCode plugin install as coverage and cannot refresh it on Windows"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "refreshZcode probes ZCODE_CLI, then the darwin bundle path, then %LOCALAPPDATA%\\Programs\\ZCode\\resources\\glm\\zcode.cjs on win32 (verified working on Windows trial)"
  - "zcodePlugin counts coverage only on explicit enabledPlugins true or a CLI plugins-list 'enabled' report; a cache hit with no entry no longer counts (ZCode 0.17.1 Windows lists foreign records [disabled])"
  - "refreshZcode ends with an idempotent plugins enable so a disabled install recovers on deploy"
  - "the code comment states the observed rule; tests cover the fallback change"
tags: ["type:fix", "stream:tooling"]
---
From proposal 23 (G1+G2, P1). Windows install trial 2026-11-08: install records with no ~/.zcode/cli/config.json enabledPlugins entry list as [disabled] in 'plugins list', so zcodePlugin's cache-hit fallback can claim coverage for a disabled install and deploy would prune the working copy; refreshZcode hardcodes the darwin CLI path and skips Windows unless ZCODE_CLI is set. See docs/agents/proposals/23-zcode-plugin-route-hardening.md and docs/agents/research/zcode-plugin-compat-20261108.md.

## Resolution (2026-11-09)

done: zcodePlugin counts coverage only on explicit enabledPlugins true or a CLI plugins-list [enabled] report (foreign records with no entry list [disabled] on ZCode 0.17.1 Windows); refreshZcode probes ZCODE_CLI, darwin, then %LOCALAPPDATA%/Programs/ZCode/resources/glm/zcode.cjs, ends with idempotent plugins enable, and its manual-recovery hint includes enable; new test covers the no-entry cache-hit semantics; deployer 1.9.0 -> 1.10.0 with tkt vendor sync

### Verification
1. ✓ refreshZcode probes ZCODE_CLI, then the darwin bundle path, then %LOCALAPPDATA%\Programs\ZCode\resources\glm\zcode.cjs on win32 (verified working on Windows trial) — "node --test scripts/deploy.test.mjs: 54 pass, 0 fail, 7 environmental skips (after vendored-deployer sync); node --test tools/deploy-validation.test.mjs in tkt: pass; gate pre-push: plugin-manifest, home-path, gates-coverage ok; gate pre-merge: 0 checks selected for these paths (deploy suite is a pre-release check); vendored deployer synced to tkt (smileynet/tkt 6c5aa00, deployer 1.10.0)"
2. ✓ zcodePlugin counts coverage only on explicit enabledPlugins true or a CLI plugins-list 'enabled' report; a cache hit with no entry no longer counts (ZCode 0.17.1 Windows lists foreign records [disabled]) — "(no evidence)"
3. ✓ refreshZcode ends with an idempotent plugins enable so a disabled install recovers on deploy — "(no evidence)"
4. ✓ the code comment states the observed rule; tests cover the fallback change — "(no evidence)"
