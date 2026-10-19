# Writing Agent Briefs

An agent brief is the authoritative specification an AFK agent works from. It goes in the tkt ticket that triage moves to `triage:ready-for-agent`. The original request and discussion are context; the brief is the contract.

The brief states **what the agent should do**. For a request built from nothing, that's the whole change; for a PR's referencing ticket, it's what's left to do *to the existing diff*: finish it, close gaps, address review points. Same principles either way; the PR example below shows the difference.

## Principles

### Durability over precision

The ticket may sit in `ready-for-agent` for days or weeks, and the codebase will change meanwhile. Write the brief so it stays useful as files are renamed, moved, or refactored.

- **Do** describe interfaces, types, and behavioral contracts.
- **Do** name specific types, function signatures, or config shapes the agent should look for or modify.
- **Don't** reference line numbers; they rot the instant anything above them changes.
- **Don't** assume the current implementation structure will remain the same.

**Anchors, not paths.** A purely path-free brief is durable but taxes the implementing agent with full rediscovery every time. Prefer **stable anchors** (module/package names, public API symbols, command names), which rot far slower than line numbers, and when a file path genuinely helps orientation, give it as a **non-binding hint explicitly marked as possibly-stale** ("the auth flow currently lives around `src/auth/`, verify before relying on it"). The rule is: no instruction should *depend* on a path being current; a hint that may be wrong is fine, a step that breaks when a path moves is not.

### Behavioral, not procedural

Describe **what** the system should do, not **how** to implement it. The agent explores the codebase fresh and makes its own implementation decisions.

- **Good:** "The `SkillConfig` type should accept an optional `schedule` field of type `CronExpression`."
- **Bad:** "Open the skill-config file and add a schedule field."
- **Good:** "When a user runs `/triage` with no arguments, they should see a summary of items needing attention."
- **Bad:** "Add a switch statement in the main handler."

### Complete, testable acceptance criteria

The agent needs to know when it's done. Every brief has concrete, independently verifiable acceptance criteria, each one something the agent could write a failing test from. These become the ticket's `validation_criteria`, so `tkt close --check-all` gates on them.

- **Good:** "`triage list --json` emits valid JSON for both success and error cases."
- **Bad:** "Triage should work correctly."

### Explicit scope boundaries

State what is out of scope, so the agent doesn't gold-plate or drift into adjacent features.

## Template

```markdown
## Agent Brief

**Category:** bug / enhancement
**Summary:** one-line description of what needs to happen

**Current behavior:**
What happens now. For bugs, the broken behavior. For enhancements, the status quo
the feature builds on. For a PR, the state of the diff.

**Desired behavior:**
What should happen after the work is complete. Be specific about edge cases and
error conditions.

**Key interfaces / anchors:**
- `TypeName`: what needs to change and why
- `functionName()`: what it currently returns vs what it should
- Config shape: any new options needed
- (optional, stale-marked) orientation hint: "currently around <module>, verify"

**Acceptance criteria:**
- [ ] Specific, testable criterion 1
- [ ] Specific, testable criterion 2

**Out of scope:**
- Thing that should NOT be changed
- Adjacent feature that seems related but is separate
```

## Examples

### Good agent brief (bug)

```markdown
## Agent Brief

**Category:** bug
**Summary:** Skill description truncation drops mid-word, producing broken output

**Current behavior:**
When a skill description exceeds 1024 characters it is truncated at exactly 1024
characters regardless of word boundaries, producing descriptions that end mid-word
(e.g. "Use when the user wants to confi").

**Desired behavior:**
Truncation breaks at the last word boundary before 1024 characters and appends "..."
to indicate truncation.

**Key interfaces / anchors:**
- The skill-metadata `description` field: no type change, but the logic that
  populates it must respect word boundaries
- The function that reads SKILL.md frontmatter and extracts the description

**Acceptance criteria:**
- [ ] Descriptions under 1024 chars are unchanged
- [ ] Descriptions over 1024 chars truncate at the last word boundary before 1024
- [ ] Truncated descriptions end with "..."
- [ ] Total length including "..." does not exceed 1024 chars

**Out of scope:**
- Changing the 1024 char limit itself
- Multi-line description support
```

### Good agent brief (PR)

For a PR, "Current behavior" describes the state of the diff, and the brief asks the agent to finish or fix it rather than build from scratch.

```markdown
## Agent Brief

**Category:** enhancement
**Summary:** Finish the contributor's `--json` output flag for `triage list`

**Current behavior:**
The PR adds a `--json` flag that serializes the issue list to JSON. The happy path
works and the diff matches the command structure. Two gaps remain: errors still print
as human text (not JSON), and the flag has no test coverage.

**Desired behavior:**
With `--json`, all output including errors is well-formed JSON on stdout, and exit
codes are unchanged. Human-readable output is untouched when the flag is absent.

**Key interfaces / anchors:**
- The command's error path should emit `{ "error": string }` under `--json`
- Reuse the serializer the PR already added; don't introduce a second

**Acceptance criteria:**
- [ ] `triage list --json` emits valid JSON for both success and error cases
- [ ] Exit codes match the non-JSON command
- [ ] A test covers the `--json` success output and one error case
- [ ] Default (non-JSON) output is unchanged

**Out of scope:**
- Adding `--json` to any other command
- Changing the success-payload JSON shape the PR already defined
```

### Bad agent brief

```markdown
## Agent Brief

**Summary:** Fix the triage bug

**What to do:**
The triage thing is broken. Look at the main file and fix it. The function around
line 150 has the issue.

**Files to change:**
- the triage handler (line 150)
- the types file (line 42)
```

Bad because: no category; vague ("the triage thing is broken"); depends on line numbers that will go stale; no acceptance criteria; no scope boundaries; no current-vs-desired behavior.
