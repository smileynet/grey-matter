# Provider switching when usage runs out

**Rule:** when a session, a 5-hour window or a weekly limit runs out, an agent **never moves work to another provider by default**. It stops that work, says which limit ran out and when it resets, and waits for the user or the reset. A project can opt in to moving work, and only to the extent its `AGENTS.md` says.

**Why:** each provider is a different plan, data path and trust boundary. Moving a task from, say, Claude Code to Codex sends the repository and the conversation to another company, spends another subscription, and changes the model that judges the work. Those are the user's decisions, and they differ per project.

## Terms

- **Provider:** the company whose models and subscription serve the work: Anthropic, OpenAI, Amazon (Kiro), Google. A harness can reach several providers; for example Kiro serves Claude models, and agy serves Claude and GPT-OSS models. What counts is whose subscription and data path the work uses, not which binary runs.
- **Moving work:** continuing a task, or dispatching a worker for it, on another provider because the current one hit a limit. A user who picks a harness for a task up front is not moving work.
- **Exhausted:** a session, 5-hour or weekly limit reported as used up, or a hard rate-limit error that carries a reset time. How to read each provider's usage is in [models and usage](./harness-surfaces/models-and-usage.md#usage).

## Default behaviour (no opt-in)

1. Finish or checkpoint the current step, so nothing is left half-written.
2. Report the limit, the reset time if known, and what is paused.
3. Don't start the task on another provider, and don't ask a worker on another provider to pick it up.
4. Within the same provider, a smaller or cheaper model is allowed only where the task class already permits it (see [models and usage](./harness-surfaces/models-and-usage.md#which-model-for-what)). It is never a silent fallback.

## Per-project opt-in

### Scaffold: start from the off state

Add this to the project's `AGENTS.md` exactly as shown, even when the project doesn't opt in. The explicit off state makes the decision visible. It also means turning it on later is an edit to known fields, not a new section written from memory:

```markdown
## Provider fallback

Off. Validate after any edit: `node scripts/check-provider-fallback.mjs AGENTS.md`.

- **Allowed:** no
- **Providers, in order:** none
- **Task classes:** none
- **Not for:** none
- **Announce:** yes
```

### Turning it on

Change only the field values:

```markdown
- **Allowed:** yes
- **Providers, in order:** anthropic, openai
- **Task classes:** implementation, review, research
- **Not for:** secrets, credentials, customer data, release publishing
- **Announce:** yes
```

| Field | Values | Meaning |
|---|---|---|
| **Allowed** | `yes` or `no` | `no` keeps the default rule. |
| **Providers, in order** | `none`, or a comma list from `anthropic`, `openai`, `amazon`, `google` | The only providers work may move to, in preference order. Must be `none` when Allowed is `no`, and non-empty when it is `yes`. |
| **Task classes** | `none`, or a comma list from `orchestration`, `implementation`, `review`, `research`, `docs`, `triage` | The kinds of work that may move. Work outside them stays put. The same rules as providers. |
| **Not for** | `none`, or a free comma list | Work that never moves, whatever else the section says. |
| **Announce** | `yes` or `no` | `yes`: say before moving which task, from which provider to which, and why. `no` is allowed but not recommended. |

### Validate, don't infer

Run the validator after every edit. An agent applying the policy runs it too, instead of reading the section by eye:

```bash
node scripts/check-provider-fallback.mjs AGENTS.md          # one-line policy, exit 0 valid / 1 invalid
node scripts/check-provider-fallback.mjs AGENTS.md --json   # {present, errors, policy} for a skill to read
```

- An absent section is valid and means no opt-in.
- A present section with any error (a missing, unknown or duplicated field; a value outside the lists; `yes` with no providers; `no` with providers still listed; two sections) exits 1. It is treated as **no opt-in** until fixed.
- This repo's own section is checked by `node --test scripts/check-provider-fallback.test.mjs`.

The script lives in grey-matter's `scripts/`. Until the orchestrate skill (ticket 111) ships it with the skill, a project outside this repo runs it by path from a grey-matter checkout.

## Who applies it

- The orchestrate skill (ticket 111) reads the section at orient, and states the result in its plan message.
- Any skill that dispatches workers across harnesses applies the same rule.
- An agent that hits a limit mid-task outside a skill follows the default behaviour above.
