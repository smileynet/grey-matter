---
id: "94"
title: "Kiro hook: run check-repo.mjs before an agent's git push"
status: open
blocked_by: []
priority: low
tags: ["stream:tooling", "type:enhancement"]
---

# Kiro hook: run check-repo.mjs before an agent's git push

## What to build

Ticket 63 gave Claude a `PreToolUse` push gate (`.claude-plugin/hooks/pre-push.mjs`). Kiro
pushes are ungated: the Git `pre-push` hook does not run because `core.hooksPath` points at
another tool's hooks directory. Add the Kiro twin.

Kiro hooks live in `~/.kiro/crew/hooks.json` (Kiro Crew) or `agent.kiro_hooks` in
`~/.kiro/crew/config.json` (kiro-cli, survives updates; absolute command path required). Both
are user-level, so the hook must no-op unless `scripts/check-repo.mjs` exists in the session's
project directory. Exit 2 denies; any other non-zero also denies, so crashes must not block
unrelated tools. Kiro's shell tool name differs from Claude's (`shell` / `execute_bash`), and
there is no `CLAUDE_PROJECT_DIR`; read the project from the hook's stdin JSON (`cwd`) and
verify the field name against a real event before relying on it.

Limit to document: a `PreToolUse` hook only votes when the gateway approves the call; when
kiro-cli already approved it, the hook is informational.

## Acceptance criteria

- [ ] A Node hook script blocks a Kiro agent's `git push` when `check-repo.mjs` exits non-zero, naming the failure on stderr.
- [ ] It is a no-op (exit 0) for non-push commands, other tools, and repos without `scripts/check-repo.mjs`.
- [ ] Fixtures cover push-pass, push-fail, unrelated repo, and malformed input.
- [ ] Install path (deploy step or documented manual step) is recorded in distribution maintenance docs.
- [ ] `node scripts/check-repo.mjs` passes.
