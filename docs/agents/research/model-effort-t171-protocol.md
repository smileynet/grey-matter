# Ticket 171: fixed-model effort sweep

**Preparation only.** No provider or model was invoked. The native run remains held until a critic accepts the exact controller, fixtures and protocol, and the parent releases the measurement lease. The Google/Agy cells are blocked by the workstream security decision and have no launch plan.

## Question

On two small tasks, does increasing the requested effort improve the answer enough to justify longer runs and greater reported usage? This is a directional comparison of requested invocation profiles. It is not a reliability estimate.

## Frozen inputs and scoring

The diagnosis task asks the agent to explain why an old asynchronous read can overwrite a newer cache value and specify a regression test. The design task asks for an idempotent webhook workflow and contains a deliberate conflict between indefinite response replay and hard deletion of all records after 30 days. A sound answer must identify that conflict and request a decision; it must not invent an archive or partner response guarantee.

Each prompt and source file is frozen in `scripts/fixtures/model-effort-t171/`. The private key and rubric are held separately; they are not included in either prompt or task checkout. An independent reviewer will score one final response per task in a fresh context, without provider, model, or effort labels. The review measures required facts, unsupported material claims, format, and duplicate findings. Time and native usage are separate operational measures.

The diagnosis rubric requires the stale-read/cache-overwrite ordering, a per-key generation or equivalent stale-write guard, and a deferred-read test that proves the newer cached value survives. The design rubric requires a unique account/key boundary, request fingerprint conflict detection, durable pending work and outbox state, retry-safe use of the partner's idempotency key, and explicit handling of the 30-day replay/deletion conflict. Equivalent implementations are allowed if they preserve the stated guarantees.

## Candidate levels and evidence boundary

Candidates use one explicitly requested model throughout each provider's sweep. The frozen requested models are Claude Opus 5.5, OpenAI GPT-6.1 Sol, and Kiro Qwen3 Coder Next. The five levels are `low`, `medium`, `high`, `xhigh`, and `max`; Google's cells are blocked and never launched. OpenAI `ultra` is excluded because it changes sub-agent fan-out as well as reasoning effort.

The retained local guide and official [Claude model configuration](https://code.claude.com/docs/en/model-config) support the five requested Opus 5.5 settings; the retained install was Claude Code 2.1.316, above the documented Opus 5.5 minimum. Claude's environment variable can override the command-line setting, so the controller sets it to the same requested value in the child process only; it changes no persistent setting. The official [OpenAI deployment checklist](https://developers.openai.com/api/docs/guides/deployment-checklist) and retained local `models_cache.json` identify GPT-6.1 Sol's five requested levels; `ultra` is excluded. Kiro's [reasoning-effort guide](https://kiro.dev/docs/models/effort/) says model support varies. Retained pinned evidence does not establish these five levels for Qwen3 Coder Next under installed Kiro CLI 2.37.1 V2. Current Kiro docs cannot prove support in that pinned version. Therefore its ten cells are held without an executable plan until independent pinned evidence or a separately authorized preflight resolves support. This is an evidence hold, not a model outcome. Google's ten descriptors are security-blocked and have no command.

Official pages were checked 2026-11-03 and may describe later releases than pinned local executables. Documentation establishes advertised choices only; returned native identity and effort must still be observed. If a requested level is rejected, rounded, or not confirmed in output, classify it as such; do not relabel it as a successful observation of the requested level.

The retained local guide identifies Claude's default effort as medium for Opus 5.5 and this Codex installation's GPT-6.1 Sol default as low. A level matching that setting is included as a same-run reference point. Kiro's current model and effort defaults are not inferred from the generic model list.

## Planned cells and limits

| Provider | Requested model | Requested levels | Tasks | Planned cells |
|---|---|---|---:|---:|
| Anthropic / Claude Code | `claude-opus-5-5` | low, medium, high, xhigh, max | 2 | 10 |
| OpenAI / Codex CLI | `gpt-6.1-sol` | low, medium, high, xhigh, max | 2 | 10 |
| Amazon / Kiro CLI | `qwen3-coder-next` | low, medium, high, xhigh, max | 2 | 10, held: pinned V2 support unverified |
| Google / Agy | none | blocked | 2 | 10 blocked, no calls |

One attempt per planned cell, with a 120-second timeout. No retries or extra usage probes. Claude is capped at USD 0.10 per call and USD 1.00 aggregate; these are request ceilings, not a billing estimate. Codex and Kiro cost remain unknown unless the native call reports them. Stop a provider on a usage limit, failed native completion, or budget anomaly. Do not replace a cell with another provider or effort level. A provider's cells run serially.

Calls use unique fresh empty temporary working directories, read-only or no-tool permissions, no repository checkout, and no user MCP configuration. Task source is embedded in the prompt. A prepared manifest binds the exact argv and cwd before authorization; the runner refuses to launch if the plan, protocol, controller, executable or empty directory changed. It serializes launches under one native-lease lock and writes a one-shot reservation before spawn, preventing retries after a crash. The controller passes an explicit operating-system environment allowlist; Claude's effort variable is set to the same requested level because it overrides `--effort`. No persistent settings, provider defaults, model defaults, or trust lists change. Raw stdout, stderr, final text, session identifiers, private rubric, and per-cell crosswalk remain in ignored private scratch through the #169–#172 handoff. Published results contain aggregate facts only.

## Binding and release

The prepared plan records each exact executable path and hash, argv array, working directory, task/source hashes, private answer-key and rubric hashes, requested model and effort, protocol hash, and controller hash. It creates and validates every unique empty directory before the plan is frozen. Execution must consume that exact plan and argv; it must not rebuild a different command after authorization. Offline integration tests inject a fake spawn into the actual run function and compare observed command, argv, and working directory with the plan.

Every reviewer is a fresh collaboration context. The private `reviewer-envelope-template.json` binds the actual task-dispatch identity, completion identity, exact dispatch/completion trace paths and hashes, fixture hash, response hash, and body hash outside the model-authored semantic body. The task-specific review body contains no reviewer identity. Retain every receipt, including invalid ones, with an attempt sequence; do not retry grading to obtain a favorable score. Review output is unscorable unless independent reviewer evidence and response-hash binding are valid.

**Release hold:** parent critic review and explicit parent authorization are still required. This preparation does not authorize provider CLI calls, session cleanup, a push, ticket closure, dashboard publication, or changes to shared model guidance.
