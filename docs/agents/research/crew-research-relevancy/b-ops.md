# Skill relevancy — batch B (ops): deployment-safety, coding-plan-limits, mcp-partitioning, mise-helper, image-handling

Sources read: `~/code/crew-research/atomics/skills/<name>/SKILL.md` + all `references/` (mise-helper refs only sized,
not read in full: 8 files / 1,802 lines), `~/.kiro/steering/image-handling.md`, grey-matter `skills/meta/compass/SKILL.md`,
grep across `skills/` for deploy/rollback/mise/MCP/image/vision. Local versions observed [L1]: kiro-cli 2.33.1,
Claude Code 2.1.306, codex 0.163.0.

## deployment-safety

1. **What it does:** Generic deploy checklist — state success criteria, rollback plan, smallest increment, canary,
   numeric rollback triggers (>2x errors, >3x latency, 5-min watch), confirm destructive ops, end with a
   DEPLOY CONFIRMED / HOLD / ROLLBACK verdict.
2. **Model-obsolete?** Yes, mostly. Frontier models already ask before destructive/prod actions and plan rollbacks;
   the numeric triggers are arbitrary (not tied to any SLO), and "don't deploy Friday" is folklore. The
   explicit-verdict rule is a last-gen "don't leave things ambiguous" crutch.
3. **Harness-native?** Partly. All three harnesses gate destructive commands via permission/approval modes, and the
   kiro system prompt in this very session mandates confirm-before-prod/destructive [L1: this session's system
   prompt]. Claude Code permission modes / plan mode: https://code.claude.com/docs/en/common-workflows [L4].
   Some machines also inject vendor production-safety and security steering [L1: injected rules].
4. **Covered by grey-matter?** No deploy skill. `release` explicitly scopes out deployment; `sync` is about
   redeploying skills to harness roots, not production. Nothing needed.
5. **Residual unique value:** Essentially none — no environment facts, no tool contracts. The only non-generic idea
   is "define 'healthy' in user terms before deploying", which a strong model does when asked.
6. **Verdict:** `DROP`.
7. **Confidence:** high — content is generic SRE checklist; harness + org steering already cover the safety floor.

## coding-plan-limits

1. **What it does:** Error-classification protocol for Kimi/Qwen/GLM coding-plan endpoints: never trust HTTP 429
   alone, classify by vendor business code into transient/windowed/terminal/config classes, then backoff, circuit
   break, model-fallback, and emit structured JSON status. Reference has per-vendor code tables.
2. **Model-obsolete?** The generic half (Retry-After, capped backoff + jitter, circuit breaker, don't retry 401/400)
   is default knowledge. The vendor code tables are not.
3. **Harness-native?** No. Harnesses retry their own provider calls internally; this targets agents/scripts that
   call third-party coding-plan APIs directly (multi-model dispatch, judge matrices).
4. **Covered by grey-matter?** No. grey-matter targets kiro-cli / Claude Code / Codex, none of which run on these
   vendors; no grey-matter skill builds multi-vendor dispatch.
5. **Residual unique value:** Real, but narrow: GLM business codes 1302/1305/1308-1321 (1305 doubles as content-
   fingerprint block; overload text is Chinese so match codes not strings), Kimi limits are account-level and TPM
   reserves `input + max_completion_tokens`, GLM SSE failures live in `finish_reason` not status. Only matters in a
   repo that dispatches to these vendors.
6. **Verdict:** `PROJECT` — keep in the repo(s) that run Kimi/Qwen/GLM matrix dispatch (e.g. dispatch-review /
   eval-harness tooling); out of scope for a global grey-matter set.
7. **Confidence:** high — outside all three target harnesses; vendor-specific.

## mcp-partitioning

1. **What it does:** Keep the default agent's MCP surface small and push specialist servers into named agents;
   documents kiro-cli agent-config traps (zero-tools whitelist, opt-in `useLegacyMcpJson`), a positive/negative
   sentinel probe pattern, and that an agent-config manager may rewrite `.kiro/agents/*.json` so configs must be copy-deployed, not symlinked.
2. **Model-obsolete?** The "too many tools degrades selection" premise is weakening — harnesses now defer tool
   schemas. The probe pattern ("verify with a live negative probe, not by reading config") is good discipline a
   strong model may skip.
3. **Harness-native?** Largely, now. Claude Code enables MCP **tool search** by default for Opus/Sonnet/Haiku 4.5+,
   deferring tool schemas until searched: https://code.claude.com/docs/en/mcp (section "Scale with MCP tool
   search") [L4:verified, fetched]. kiro-cli 2.33 also defers tools — this session exposes MCP tools via
   `tool_load` / deferred catalog [L1]. Codex per-server tool filtering: not verified this pass [tentative].
4. **Covered by grey-matter?** No. grey-matter has no agent-config / MCP skill.
5. **Residual unique value:** kiro-cli-specific gotchas a model won't know: `tools` must include `@builtin` and every
   `@server` (including inherited) or zero tools load; inheritance requires `useLegacyMcpJson: true`; `allowedTools`
   is trust-only and never inherits into subagents (approval stalls); an agent-config manager may rewrite agent JSON on load (never
   symlink). These are local-machine facts, not methodology.
6. **Verdict:** `FOLD` into grey-matter `docs/agents/harnesses.md` (kiro-cli section), as config gotchas:
   > kiro-cli agent configs: `tools` must list `@builtin` and every `@<server>` (inherited too) or nothing loads;
   > global mcp.json inheritance needs `useLegacyMcpJson: true`. `allowedTools` only auto-approves, and subagents
   > don't inherit the parent's — missing entries stall on approval. Where an agent-config manager runs, agent JSON is rewritten on
   > load: deploy by copy, never symlink. Verify with a live negative probe, not by reading the file.
   The partitioning strategy itself → DROP (tool search makes it mostly moot).
7. **Confidence:** medium — tool-search deferral is documented for Claude Code and observed in kiro-cli; whether
   kiro still needs `useLegacyMcpJson` in 2.33 was not re-verified (docs page is an SPA; key not found in fetch).

## mise-helper

1. **What it does:** mise quick reference (use/pin, tasks, env, lockfile, backend table, activation, key
   commands) with ~1,800 lines of reference docs (config, tasks, envs, backends, security, languages, CI, monorepos).
2. **Model-obsolete?** Mostly. It is a condensed copy of public mise docs (https://mise.jdx.dev); a current model
   knows mise well and can read `mise --help` / docs. The reference bulk is doc mirroring and will drift.
3. **Harness-native?** N/A (third-party tool), but `mise` itself is self-documenting (`mise doctor`, `--help`).
4. **Covered by grey-matter?** No.
5. **Residual unique value:** Not in this skill — the valuable mise facts are environment gotchas living in
   `~/.kiro/steering/references/environment-gotchas.md`: mise venvs have no pip (bootstrap `ensurepip`); `conda:`
   backend works where brew is sandbox-blocked; `mise use` writes global config by default (move pins to project);
   `which python3` resolves to mise global, not the repo `.venv`. None of these are in mise-helper.
6. **Verdict:** `DROP` (skill). If grey-matter wants the gotchas, they belong in an environment-gotchas reference,
   not a mise skill — out of this batch's scope.
7. **Confidence:** high — doc mirror of a public, well-known tool; the real nuggets live elsewhere.

## image-handling

1. **What it does:** kiro-cli image reference: dispatch a fresh headless `kiro-cli chat --no-interactive` session when
   inline images are lost after compaction; a kiro-vs-Claude limits table; patch token formula; pre-resize to
   ≤1568 px; prompting tips (label images, one attribute per question); `tool-dispatch.md` gives kiro/codex/agy
   commands, multi-validator consensus, OCR fallback. `~/.kiro/steering/image-handling.md` is the same body as the
   SKILL.md minus frontmatter [L1: diff].
2. **Model-obsolete?** Partly. Pre-resizing, labeling images, not leading the witness are things a strong model does
   if it thinks about it; the multi-validator consensus is a last-gen "don't trust one model" pattern.
3. **Harness-native?** Yes, all three handle images natively:
   - kiro-cli: JPEG/PNG/GIF/WebP, <10 MB, ≤10 images/request — https://kiro.dev/docs/cli/chat/images/ [L4:verified, fetched].
   - Claude Code: drag-drop, `Ctrl+V` paste, or give a path ("Analyze this image: /path/x.png") —
     https://code.claude.com/docs/en/common-workflows ("Work with images") [L4:verified].
   - Codex: `codex --image` / `codex exec -i <FILE>` and paste in composer —
     https://learn.chatgpt.com/docs/codex/cli [L4:verified]; `-i, --image` in `codex exec --help` [L1].
   - Claude API facts (https://platform.claude.com/docs/en/build-with-claude/vision.md) [L4:verified]: 8000×8000 max;
     tokens `⌈w/28⌉×⌈h/28⌉`; standard tier 1,568 px / 1,568 tokens, high-res (Claude 4.7+) 2,576 px / 4,784 tokens,
     automatic; <200 px hallucination risk; **up to 600 images/request, but >20 images triggers a stricter limit —
     keep each ≤2000 px**; 32 MB request cap. The skill's "20/100+ images" and "coordinates: don't ask for
     measurements" are now stale — the docs ship a coordinates/bounding-box guide (still "approximate, verify").
4. **Covered by grey-matter?** No image skill. `pr` treats screenshots as evidence but says nothing about handling them.
5. **Residual unique value:** Small: (a) the compaction workaround — re-read the image path in a fresh headless
   session (kiro `--no-interactive`, `claude -p`, `codex exec -i`) instead of reasoning from a dropped image;
   (b) pre-resize to the model's tier and stay ≤2000 px when sending >20 images; (c) label each image's role in
   multi-image prompts. The agy/crush dispatch notes are tool-local and the consensus pattern is redundant with
   any general multi-model review skill.
6. **Verdict:** `FOLD` into grey-matter `docs/agents/harnesses.md` (cross-harness "images" note):
   > Images: kiro-cli (path in prompt; ≤10/request, <10 MB), Claude Code (path/paste/drag), Codex (`-i <file>`).
   > If an image dropped out of context after compaction, re-ask in a fresh headless run (`kiro-cli chat
   > --no-interactive`, `claude -p`, `codex exec -i`) rather than recalling it. Pre-resize to the model's long-edge
   > tier (1,568 px; 2,576 px on Claude 4.7+); keep ≤2000 px if sending >20 images. Label each image's role.
   Also: the global steering copy (`~/.kiro/steering/image-handling.md`) is always-on context for a situational
   topic and carries stale limits — retire it when migrating.
7. **Confidence:** medium — harness support verified from current docs; the compaction-loss behavior is field-observed
   (2026-07-22) and not re-tested on kiro-cli 2.33.

## Summary

| skill | verdict | one-line reason |
|-------|---------|-----------------|
| deployment-safety | DROP | Generic SRE checklist; harness approval gates + org steering already cover the safety floor |
| coding-plan-limits | PROJECT | Valuable vendor code tables, but only for repos dispatching to Kimi/Qwen/GLM — not a target harness |
| mcp-partitioning | FOLD → `docs/agents/harnesses.md` | Tool search/deferral makes partitioning moot; keep kiro agent-config + managed-config gotchas |
| mise-helper | DROP | Mirror of public mise docs; the real mise gotchas live in environment-gotchas, not here |
| image-handling | FOLD → `docs/agents/harnesses.md` | All 3 harnesses do images natively; keep compaction workaround + sizing; limits table is partly stale |
