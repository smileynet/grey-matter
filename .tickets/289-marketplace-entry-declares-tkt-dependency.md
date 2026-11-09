---
id: "289"
title: "mirror the tkt dependency on the marketplace entry so ZCode resolution sees it"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - ".claude-plugin/marketplace.json grey-matter entry carries dependencies [{\"name\":\"tkt\",\"marketplace\":\"tkt\"}], identical to the plugin manifest declaration"
  - "no version pins anywhere in the dependency (plugin.json version silently wins; docs warn against duplication)"
  - "deploy check --static asserts entry and plugin-manifest dependency sets agree, so they cannot drift"
tags: ["type:enhancement", "stream:tooling"]
---
From proposal 23 (G3) with the researched resolution (docs/agents/research/zcode-marketplace-prior-art-20261108.md, finding 1): Claude Code binds dependencies in plugin.json (a dependency starts enabled regardless of defaultEnabled); ZCode resolves only the marketplace entry copy. Dual declaration makes the dependency binding in both harnesses; neither auto-installs cross-marketplace, and distribution docs already tell users to install tkt explicitly.

## Resolution (2026-11-09)

done: grey-matter marketplace entry declares dependencies [{name: tkt, marketplace: tkt}] identical to plugin.json (object form, no version pins); deploy's static check fails when entry and plugin-manifest dependency sets disagree; Claude binds the manifest copy, ZCode resolves the entry copy (prior-art finding 1)

### Verification
1. ✓ .claude-plugin/marketplace.json grey-matter entry carries dependencies [{"name":"tkt","marketplace":"tkt"}], identical to the plugin manifest declaration — "node --test scripts/deploy-validation.test.mjs: 5 pass, 0 fail (includes the new drift test; also fixes the pre-existing Windows --import bare-path failure via pathToFileURL); node scripts/check-plugin-manifest.mjs: OK (50 skills, 4 dirs); node scripts/deploy.mjs check --static: OK; gate pre-push: plugin-manifest, home-path, gates-coverage ok; vendored deployer re-synced to tkt (smileynet/tkt d856a79)"
2. ✓ no version pins anywhere in the dependency (plugin.json version silently wins; docs warn against duplication) — "(no evidence)"
3. ✓ deploy check --static asserts entry and plugin-manifest dependency sets agree, so they cannot drift — "(no evidence)"
