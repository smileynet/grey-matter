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

A project allows moving work by adding this section to its `AGENTS.md`. Every field is required, so the permission is explicit:

```markdown
## Provider fallback

- **Allowed:** yes
- **Providers, in order:** anthropic, openai
- **Task classes:** implementation, review, research
- **Not for:** secrets, credentials, customer data, release publishing
- **Announce:** yes
```

- **Allowed** must be `yes`; anything else means the default rule.
- **Providers, in order** lists the only providers work may move to, in preference order.
- **Task classes** names the kinds of work that may move. Work outside them stays put.
- **Not for** lists work that never moves, whatever else the section says.
- **Announce: yes** means the agent says before moving: which task, from which provider to which, and why. `no` is allowed but not recommended.

A missing section, a malformed one, or one the agent can't parse means **no opt-in**.

## Who applies it

- The orchestrate skill (ticket 111) reads the section at orient, and states the result in its plan message.
- Any skill that dispatches workers across harnesses applies the same rule.
- An agent that hits a limit mid-task outside a skill follows the default behaviour above.
