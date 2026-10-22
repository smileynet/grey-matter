---
id: "48"
title: "Fold crew-research nuggets into harnesses.md, doc-conventions, windows gotchas"
status: done
blocked_by: []
validation_criteria:
  - "harnesses.md: kiro agent-config gotchas, images, Claude /review alias note"
  - "doc-conventions prose-tells note; windows gotchas bash/MSYS section"
  - "check-repo.mjs green"
tags: ["type:chore", "stream:migration"]
---

# Fold crew-research nuggets into harnesses.md, doc-conventions, windows gotchas

## What to build

Doc-level folds (exact text in [../docs/agents/research/crew-research-relevancy/b-ops.md](../docs/agents/research/crew-research-relevancy/b-ops.md), [../docs/agents/research/crew-research-relevancy/c-writing.md](../docs/agents/research/crew-research-relevancy/c-writing.md), [../docs/agents/research/crew-research-relevancy/a-review-eval.md](../docs/agents/research/crew-research-relevancy/a-review-eval.md)):

- **`docs/agents/harnesses.md`:**
  - kiro agent-config gotchas: `@builtin` plus every `@server`; `allowedTools` doesn't inherit
    into subagents; AIM rewrites agent JSON, so copy rather than symlink; verify with a live
    negative probe.
  - Images: native in all three harnesses. After compaction, re-ask in a fresh headless run;
    resize to tier; label each image's role.
  - Claude Code: grey-matter's `code-review` replaces `/code-review`, but `/review` still runs the
    built-in reviewer.
- **`docs/agents/doc-conventions.md`:** a prose-tells note (cluster rule, short banned-word list, no
  em dashes in shipped prose; re-verify claims after a prose edit). decksmith `prose-lint` stays
  project-level.
- **`docs/agents/windows-powershell-gotchas.md`:** a bash/MSYS section (IFS empty-field collapse, uv
  shims under MSYS, `\r` strip, `as_posix()`).

Context: [proposal 04](../docs/agents/proposals/04-crew-research-migration.md).

## Acceptance criteria

- [x] harnesses.md carries the kiro config, images, and /review alias notes.
- [x] doc-conventions prose-tells note and windows gotchas bash/MSYS section added.
- [x] `node scripts/check-repo.mjs` green.

## Resolution (2026-10-22)

done: mcp-partitioning, image-handling, writing-style, prose-check, script-authoring nuggets folded into docs

### Verification
1. ✓ harnesses.md: kiro agent-config gotchas, images, Claude /review alias note — "harnesses.md: kiro agent-config gotchas, an Images section, and the Claude /review alias note"
2. ✓ doc-conventions prose-tells note; windows gotchas bash/MSYS section — "doc-conventions prose-tells section; windows gotchas bash/MSYS section"
3. ✓ check-repo.mjs green — "node scripts/check-repo.mjs all invariants pass"
