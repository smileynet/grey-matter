---
id: "195"
title: "Keep slash-style CLI arguments out of missing-skill errors"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "The current AGENTS.md Git Bash argument example no longer produces a missing-skill error, without editing that example or hard-coding args as a builtin."
  - "Public checker fixtures distinguish CLI argument examples and ambiguous slash tokens from explicit missing skill references; valid references and existing detection stay covered."
  - "Applicable checker fixtures and repository gates pass; guidance audit results distinguish baseline worktree path limitations from checker regressions."
tags: ["stream:test-verification", "type:bug"]
---

# Keep slash-style CLI arguments out of missing-skill errors

## What to build

Origin: #183's guidance audit. On unchanged main AGENTS.md line 36,
`node scripts/check-guidance.mjs --repo . --no-global` reports `dead-skill` for the
Git Bash argument example `/args`. The text describes command argument rewriting, not
a skill invocation. Source inspection confirms that every slash-starting inline code span
is currently added to the named-skill check in scripts/check-guidance.mjs.

Distinguish explicit skill references from argument examples and ambiguous bare slash
tokens. Preserve deterministic missing-skill errors where the source actually names a
skill; ambiguous text may be a judgment finding, not a manufactured mechanical error.
Do not add an args-specific builtin exemption or rewrite AGENTS.md to hide the problem.
Use public checker fixtures with both false-positive and real missing-skill controls.

Read scripts/check-guidance.mjs, scripts/check-guidance.test.mjs and #88's checker contract.
The main checkout's prior-art sibling resolves, while a nested private worktree lacks that
sibling and reports a separate dead-path result. Keep that environment limitation distinct;
do not edit unrelated project references, global rules or installed skill roots.

No live provider/model call, user-data operation, new approval gate or broad parser rewrite
is part of this ticket. #183's ownership guidance can land independently.

## Acceptance criteria

- [x] The current AGENTS.md Git Bash argument example no longer produces a missing-skill error, without editing that example or hard-coding args as a builtin.
- [x] Public checker fixtures distinguish CLI argument examples and ambiguous slash tokens from explicit missing skill references; valid references and existing detection stay covered.
- [x] Applicable checker fixtures and repository gates pass; guidance audit results distinguish baseline worktree path limitations from checker regressions.

## Implementation and acceptance 2026-11-02

Worker 44614dd reproduces the false positive before the fix, then distinguishes explicit
skill references, CLI argument examples and ambiguous bare slash tokens in the existing
checker. Explicit missing skills remain errors; ambiguous tokens are judgment findings.
The args token was not added to a whitelist, and AGENTS.md/global rules were unchanged.
Independent critic accepted the parser and its public false-positive/true-positive controls.

Root checker fixtures passed 7/7, no skips, in 0.787 s. The new checker against the main
checkout reported zero errors and six judgment notices; the former args error disappeared.
The nested worker's separate missing prior-art sibling remained an environment limitation,
not a source regression. Root integrated at 8d5c49f, pre-merge selected syntax/agent-guidance
2/2 passed, pre-push 6/6 passed, and the coordinated guidance deployment installed 50 skills.
No full repository or model/provider run was needed for this narrow parser change. Retain
t195-worker through the current #182 combined source/evidence audit, then retire it; all
fixture data was disposable and no user data or global settings were changed.

## Resolution (2026-11-02)

done: guidance checker no longer treats slash arguments as missing skills; ambiguity is judgment and explicit missing references remain errors. Reviewed, merged, pushed; coordinated guidance deployment passed. No AGENT/global rule or user-data edits. Keep t195-worker through current182 combined audit, retire afterward; temporaryfixturedata runner-cleaned.

### Verification
1. ✓ The current AGENTS.md Git Bash argument example no longer produces a missing-skill error, without editing that example or hard-coding args as a builtin. — "ActualmainAGENTline36argsfalsepositive reproducedbeforefix; newcheckeragainstunchangedmain0errors6judgment. NoAGENTrewrite/args-specificwhitelist."
2. ✓ Public checker fixtures distinguish CLI argument examples and ambiguous slash tokens from explicit missing skill references; valid references and existing detection stay covered. — "Rootpubliccheckerfixtures7/7noskips0.787s includeCLIargexamples,ambiguousbaretokensjudgment,explicitmissingskillerrorsandvalidreferences. CriticSpec/Standardsaccepted2filescope44614dd."
3. ✓ Applicable checker fixtures and repository gates pass; guidance audit results distinguish baseline worktree path limitations from checker regressions. — "Rootintegrated8d5c49fpremerge2/2pass, prepush6/6pass; docs/syntax/invocationpassed. Workerrelativepriorartdead-pathseparatelyclassifiedenvironment; mechanicalmainaudit0errorsnotclaimalljudgmentresolved. Sourcepushed."
