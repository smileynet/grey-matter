---
id: "45"
title: "Global AGENTS.md: author the 6-line guardrail+shim file and install it per harness (manifest-tracked, no clobber)"
status: in_progress
blocked_by: []
priority: high
validation_criteria:
  - "Global AGENTS.md source exists in repo, <=3KB, matches proposal 04 draft"
  - "install-skills.mjs (or sibling) installs it to kiro/codex/claude/opencode user paths, manifest-tracked, refuses to clobber a foreign file, supports --dry-run/list/uninstall"
  - "check-repo.mjs covers it (size budget + installer ownership test)"
tags: ["type:enhancement", "stream:migration"]
---

# Global AGENTS.md: author the 6-line guardrail+shim file and install it per harness (manifest-tracked, no clobber)

## What to build

grey-matter replaces crew-research's ~29 KB of always-on steering with one lean, portable
user-level AGENTS.md (decision: no steering; skills + AGENTS.md only). Author it from the draft in
[proposal 04 § Global AGENTS.md](../docs/agents/proposals/04-crew-research-migration.md):
5 guardrail lines (evidenced-done, git-diff scope, minimal code, trust-boundary validation,
observed-beats-documented) + the `.memory/` compat shim.

Teach the installer to place it per harness:
- kiro: `~/.kiro/steering/AGENTS.md` (Kiro picks AGENTS.md up there, always-on)
- codex: `~/.codex/AGENTS.md` (currently a crew-research-generated file; the cutover ticket removes it first)
- claude: `~/.claude/CLAUDE.md`
- opencode: `~/.config/opencode/AGENTS.md`

Same safety contract as skills: manifest-tracked, refuse to overwrite a file it didn't install
(unless `--force`), `--dry-run` / `list` / `uninstall`. Verify agy/Crush global paths or record
them as unsupported in `docs/agents/harnesses.md`.

Evidence: `docs/agents/research/{kiro-steering-empirical,kiro-steering-docs,steering-vs-agents-md-portability}.md`,
`docs/agents/research/crew-research-relevancy/d-partials-guardrails.md` (the guardrail verdicts).

## Acceptance criteria

- [ ] Source file in repo, <= 3 KB, content matches the proposal 04 draft (or the deltas are recorded there).
- [ ] Installer installs/lists/uninstalls it for kiro, codex, claude, opencode; foreign file is never clobbered.
- [ ] `check-repo.mjs` enforces the size budget and the ownership test covers the new target.
- [ ] `docs/agents/harnesses.md` documents the per-harness global path.
