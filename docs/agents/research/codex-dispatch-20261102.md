# Codex CLI dispatch toggles: ticket 159 (2026-11-02)

## Result

**Couldn't verify the ticket's runtime question.** The installed Codex CLI accepts all three feature names as process overrides, and `codex features list` reports the overrides as enabled only for that invocation. Runtime dispatch did not produce a worker in either the no-flag baseline or the `multi_agent_v2` run. Each emitted the same missing code-mode-host error; a native `wait` event had an empty receiver list, after which the model printed the requested marker without a child result. CLI exit 0 therefore does not mean dispatch succeeded.

The no-flag and v2 prompts were identical and ran against the same disposable fixture. They do not show a change in dispatch behavior. They also do not isolate the missing-host cause from other runtime behavior. The saved-session v2 attempt repeated the result, so ephemeral storage alone does not explain the empty receiver list. No actual child existed to test nesting, a ticket question/answer, message delivery, wake behavior, or whether message-board events can replace polling. No `agent_message_board` or `wake_on_agent_messages` runtime call was attempted after the shared setup failure; only their process-scoped catalog toggles were checked.

## Evidence

The current installed CLI reported version `0.166.0`, executable SHA-256
`9D563EE4E0441FF9D59D612013E0460DDF8E5709735C2D9F6B98B7EF8CA4EB42`.
Its `codex features list` reported:

| Feature | Default state | With process `--enable` | Catalog stage |
| --- | --- | --- | --- |
| `multi_agent_v2` | false | true | stable |
| `agent_message_board` | false | true | under development |
| `wake_on_agent_messages` | false | true | under development |

The exact native CLI events, commands and summarized output are preserved in
the [evidence receipt](evidence/codex-dispatch-20261102.json). On both v2 runs,
event order was: `thread.started`; an error item saying the code-mode host could
not start; `turn.started`; an agent message; a `collab_tool_call` named `wait`
with `receiver_thread_ids: []`; then the requested marker text and
`turn.completed`. No spawn event, child thread ID, message-board event or wake
event appeared. The marker was generated after an empty wait and is not a child
result. Both process exits were 0. The no-flag control had the same sequence and
host error.

The failed host path, normalized here, was
`%USERPROFILE%/.bun/bin/codex-code-mode-host.exe`; `Test-Path` found no file at
that location. This is also tracked independently by ticket 188. That known
infrastructure failure was not repaired in this spike. The only other CLI
diagnostic was a parser rejection when `--ask-for-approval` was passed to
`codex exec`; the invocation was not run. Removing that unsupported option and
using a read-only sandbox allowed the probes above to start.

The fixture was created by
`node scripts/spike-orchestrate-fixture.mjs create --variant trunk --dir
<TEMP>/gm-t159-fixture`, with tree hash
`7fd72339921451e85440698acda748c0bde512bb`; it has no remote. Prompts asked
for one read-only child to return marker `T159_CHILD_DONE`. They did not grant
file writes or ask a child to spawn further children.

## Scope of sources

Installed CLI output is the authority for this version's flag names, stages and
effective states. The current [OpenAI subagents guide](https://developers.openai.com/codex/multi-agent)
describes subagents across Codex clients and says current local Codex CLI
releases support them; it does not document these three flags or their specific
runtime effects. It cannot establish that this installed headless invocation
dispatches a child with the missing host. Do not transfer behavior from the
desktop collaboration API to this CLI probe.

The process used `--enable` arguments only; it did not run `codex features
enable` or edit `config.toml`. The CLI's own help says `--enable` is equivalent
to a command-line config override. No credential, global setting or persistent
feature write was made. The saved-session run did create an ordinary Codex
session record; its local identity is listed in the receipt for later cleanup.

## Artifact status

The independent audit accepted the evidence at 0.92/high and cleared cleanup.
After promoting the selected results and file hashes, I recycled the exact
98,400-byte fixture, the 6,206-byte raw transcript folder, and the 172,195-byte
saved CLI session record to the OS trash. Verified that all three paths are
absent. The audit and sanitized receipt are retained in the repository. No
harness configuration needs restoring; a before/after config hash was not
captured, as the receipt states.
