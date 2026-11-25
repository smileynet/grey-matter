---
id: "293"
title: "Fix check-guidance plugin roots, Kimi multiline description, DSH syntax keys, and model/research drift"
status: done
blocked_by: []
validation_criteria:
  - "check-guidance discovers ~/.kimi-code/skills, linked Qwen extensions, and installed DSH bundles (unit-tested)"
  - "build-kimi-plugin handles YAML block-scalar descriptions without returning literal > or |"
  - "check-skill-syntax rejects DSH-forbidden camelCase invocation keys (unit-tested)"
  - "models-and-usage.md and harness-model-optimization-20261125.md match OpenCode v2.4.1, GPT-6.2/Gemini 4, and DSH bundle object schema"
tags: ["stream:tooling", "kind:bug"]
---

# Fix check-guidance plugin roots, Kimi multiline description, DSH syntax keys, and model/research drift

## What to build

Address four review gaps discovered after comparing the AI Harness & Plugin Research work (`e994df9`, `5e6f5f3`) with the OpenCode 2.4.1, DSH `0.2.2-rc.5`, Qwen Code `0.28.4`, and Kimi Code CLI `2.7.3` integrations:

1. `scripts/check-guidance.mjs` (`installedSkills()`): include `$KIMI_CODE_HOME/skills` (`.kimi-code/skills`), linked/installed Qwen extensions under `$QWEN_HOME/extensions/` (resolving `.qwen-extension-install.json` links), and installed DSH bundles under `$DSH_HOME/profiles/*/package.json`, with regression tests in `scripts/check-guidance.test.mjs`.
2. `scripts/build-kimi-plugin.mjs` (`skillDescription()`): parse YAML folded/literal block scalars (`>`, `>-`, `|`, `|-`) cleanly instead of returning literal `>` or `|`, with unit tests in `scripts/kimi-plugin.test.mjs`.
3. `scripts/check-skill-syntax.mjs`: reject DSH-dropped legacy camelCase invocation keys (`disableModelInvocation`, `modelInvocable`, `userInvocable`) with diagnostics pointing to the hyphenated replacement, with tests in `scripts/skill-syntax.test.mjs`.
4. Reconcile doc drift in `docs/agents/harness-surfaces/models-and-usage.md` (OpenCode V2 `#variant` syntax; `gpt-6.2-sol`/Astra and `Carbon`/`Neon` in the default table) and `docs/agents/research/harness-model-optimization-20261125.md` (OpenCode V2.4.1 `disable-model-invocation` enforcement; DSH `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }` object schema; current `check-skill-syntax.mjs` coverage).

## Acceptance criteria

- [x] `check-guidance.mjs` discovers `~/.kimi-code/skills`, linked Qwen extensions, and installed DSH bundles (`node --test scripts/check-guidance.test.mjs` passes).
- [x] `build-kimi-plugin.mjs` parses folded/literal YAML block-scalar descriptions cleanly (`node --test scripts/kimi-plugin.test.mjs` passes).
- [x] `check-skill-syntax.mjs` rejects DSH-forbidden camelCase invocation keys (`node --test scripts/skill-syntax.test.mjs` passes).
- [x] `models-and-usage.md` and `harness-model-optimization-20261125.md` match OpenCode `v2.4.1`, GPT-6.2/Gemini 4, and the DSH bundle object schema (`node scripts/check-docs-consistency.mjs` passes).

## Resolution (2026-11-25)

done: fixed check-guidance plugin roots, build-kimi-plugin multiline description parsing, check-skill-syntax DSH camelCase rejection, and OpenCode V2/GPT-6.2/Gemini 4/DSH doc drift

### Verification
1. ✓ check-guidance discovers ~/.kimi-code/skills, linked Qwen extensions, and installed DSH bundles (unit-tested) — "node --test scripts/check-guidance.test.mjs: 9/9 passed incl. ~/.kimi-code/skills, linked Qwen extensions, and DSH profile bundles (commit 2abcf71)"
2. ✓ build-kimi-plugin handles YAML block-scalar descriptions without returning literal > or | — "node --test scripts/kimi-plugin.test.mjs: 4/4 passed incl. folded/literal YAML block-scalar skillDescription unit test (commit 2abcf71)"
3. ✓ check-skill-syntax rejects DSH-forbidden camelCase invocation keys (unit-tested) — "node --test scripts/skill-syntax.test.mjs: 13/13 passed rejecting disableModelInvocation, modelInvocable, and userInvocable (commit 2abcf71)"
4. ✓ models-and-usage.md and harness-model-optimization-20261125.md match OpenCode v2.4.1, GPT-6.2/Gemini 4, and DSH bundle object schema — "gate pre-merge (4/4) and pre-push (6/6) incl. doc-links passed after reconciling models-and-usage.md and harness-model-optimization-20261125.md (commit 2abcf71)"
