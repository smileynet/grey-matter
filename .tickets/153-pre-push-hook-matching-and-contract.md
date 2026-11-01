---
id: "153"
title: "Pre-push hook: match only real publishing commands, document the consumer contract and pass context"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Hook matches only real publishing commands with tests"
  - "Consumer contract documented in init-project and conformance-audit"
  - "Hook passes publishing context and a documented environment"
tags: ["stream:tooling"]
---

# Pre-push hook: match only real publishing commands, document the consumer contract and pass context

## Origin

Field report from the consumer repo `philippines-trip`, 2026-11-01, where the Claude
plugin pre-push hook (`.claude-plugin/hooks/pre-push.mjs`, ticket 63) blocked or
misfired repeatedly in one session. Companion to 152 (scope commit gates to vital,
changed parts and bound verification scratch); this ticket covers the hook itself and
its contract, 152 covers what a consumer gate runs and the scratch it leaves.

## Observed problems

1. **Command matching** (regex run in node against real commands):
   - False positives that ran the gate: `git stash push`, `git stash push -m wip`,
     `git log --grep push`, unquoted `echo git push`, and push text inside a quoted
     heredoc or a quoted argument (a `tkt new` title containing "real git push" ran the
     consumer gate).
   - Misses: `/usr/bin/git push`, `git.exe push` (PowerShell).
2. **Wrong repository**: the hook always checks `$CLAUDE_PROJECT_DIR`, so a command
   publishing a different repo (`cd ../other && …`, `git -C other …`) runs the launch
   project's gate instead of the target's.
3. **No consumer contract**: nothing in init-project, adopt-project or conformance-audit
   says what a bare `node scripts/check-repo.mjs` must do. The consumer's wrapper required
   `plan|run --stage …`, so every publish failed with a usage error until the consumer
   redefined the bare call. grey-matter's own checker rejects unknown arguments, so the
   hook cannot simply add one.
4. **Environment**: the hook spawns the checker with Claude's environment, not the
   operator's shell. The consumer's identity-bound receipts depended on `NODE_PATH` and
   similar variables and failed to verify until the consumer replayed a recorded env.
5. **No publishing context**: the hook passes no remote, refs or base, so consumers infer
   `@{upstream}`. With nothing ahead of upstream the consumer gate reported "No changed
   inputs" and blocked a command that published nothing.
6. **Concurrent sessions**: other sessions' uncommitted edits in the same checkout blocked
   the consumer gate (snapshot/freshness checks over the working tree). The consumer added
   a committed-only mode; the contract should say gates judge what is being published, not
   the working tree.
7. **Slow tracker publishing**: `tkt new` in this repo hung on its publish step while the
   repository's git pre-push hook ran (two sessions observed at once); worth confirming
   whether the git hook's checker is slow or stuck.

## Acceptance criteria

- [ ] Each observed problem is reproduced or rejected with evidence before changing code.
- [ ] The hook gates only a real `git … push`: global options (`-C x`, `-c k=v`,
      `--git-dir=…`) are skipped, the next word must be `push`, quoted strings and heredoc
      bodies are ignored, and `/path/git` and `git.exe` are recognised;
      `scripts/claude-hooks.test.mjs` covers every case listed above.
- [ ] The hook checks the repository the command targets (or documents and tests why it
      cannot).
- [ ] The consumer contract is documented in the README and in init-project and
      conformance-audit: bare call means verify what is being published, exit 0/non-zero,
      no side effects, pass when nothing is ahead of upstream, ignore unrelated working-tree
      edits.
- [ ] The hook passes publishing context through documented environment variables (for
      example `GREY_MATTER_GATE=claude-pre-push`, remote and refspec when parseable) and the
      contract names which environment variables a checker can rely on; `.githooks/pre-push`
      sets the same variables and forwards Git's stdin refs.
- [ ] philippines-trip's push gate still passes after the change.
