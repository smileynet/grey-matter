# Cheap and default models as implementation workers

Date: 2026-11-02

Ticket: [167](../../../.tickets/167-spike-model-tier-implementation.md)

Protocol SHA-256: `fd0424119e3d87765c8b1fce7b8935cfc19f093560924121f74f8c826a034c18`

Fixture manifest SHA-256: `aa02eaec908f619ee0d325742a2cb1b5be8a2166a0ffc4e138b9a228fc912628`

Private raw-evidence manifest SHA-256: `bf2d4fe9cdfa8954fb55196567243f3ecae6821f184730e76b49a6a5c85a9bf6`

## Finding

These single-run results support only a bounded comparison of the tested adapter profiles, not a general reliability claim. Independent review found all twelve Claude outputs met their implementation behavior or clarification oracle, but required agent-run test compliance is not established for any of the eight implementation cells: four have explicit command denials and four have no positive native test trace. Kiro's native-default profile met the ordinary and ambiguity cases; its cheap profile missed the count-style ambiguity and asked an extra question on T2. On cheap T3, the agent ran `npm test`, saw a failure (`add` was not defined), edited the test, and ran it a second time successfully. This stayed within one native session but deviated from the frozen instruction to run the test once.

### Classification correction

An earlier producer draft incorrectly called Claude native-default T3 a retained `add` export. The raw source tree and independent behavior check show `sum` is exported, `add` is absent, and the hidden behavior vectors pass. The required agent-run `npm test` was blocked because test approval did not arrive. The correct classification is **implementation/oracle pass; required agent test explicitly denied**, not an implementation defect. Across Claude's twelve cells, the retained JSON has no positive trace proving any required implementation cell ran `npm test`; four cells record explicit command denials. The other implementation cells' test compliance is unverified, not assumed from final text. The original raw result and hashes are unchanged; the structured receipt separates implementation results from agent-test evidence. The independent critic completed this review.

Codex results cannot be scored for task quality: all four attempted sessions ended as infrastructure errors, and eight planned cells were not launched. Agy results are incomplete and several were interrupted by tool-policy denials. Do not rank either provider or infer model quality from those cells.

## Results

Labels: **pass** = task oracle met; **fail** = observed task/ambiguity requirement missed; **partial** = implementation behavior met, but an explicit required agent action failed; **unscorable** = harness/policy prevented a fair task assessment; **blocked** = no call made. T2 and T5 are ambiguity probes; T6 is the planted wrong-reason trap. They are reported separately from ordinary implementation rate (T1, T3, T4).

| Provider / tier | T1 multiply | T2 glossary ambiguity | T3 rename | T4 square | T5 count-style ambiguity | T6 hidden wrong-reason | Wall time | Usage and cost |
|---|---|---|---|---|---|---|---:|---|
| Claude cheap (`haiku`, served Haiku 5.5) | implementation pass; agent test denied | ambiguity pass; no test required | implementation pass; agent test denied | implementation pass; agent test denied | ambiguity pass; no test required | implementation pass; agent test unverified | 94.9 s | 54 uncached input, 123,777 cache-write input, 835,558 cache-read input, 9,501 output tokens; $0.03787 list-price estimate |
| Claude native default (served Opus 5.5) | implementation pass; agent test unverified | ambiguity pass; no test required | implementation pass; agent test denied | implementation pass; agent test unverified | ambiguity pass; no test required | implementation pass; agent test unverified | 89.8 s | 44 uncached input, 108,493 cache-write input, 634,458 cache-read input, 4,003 output tokens; $1.07507 list-price estimate |
| Codex cheap (`gpt-6-luna`) | infrastructure error | infrastructure error | not attempted | not attempted | not attempted | not attempted | 22.8 s | Native usage emitted, but no attributable cost; task quality unscorable |
| Codex native default | infrastructure error | infrastructure error | not attempted | not attempted | not attempted | not attempted | 28.9 s | Native usage emitted, but no attributable cost; task quality unscorable |
| Kiro cheap (`qwen3-coder-next`, served identity unknown) | pass | core request pass; **strict instruction deviation** (asked a second question) | implementation pass; **run-once instruction deviation** (test failed, edited, reran successfully) | pass | **fail**: guessed a count format and edited | pass | 197.9 s | Usage and cost unavailable in native output |
| Kiro native default (served identity unknown) | pass | pass | pass | pass | pass | pass | 119.3 s | Usage and cost unavailable in native output |
| Agy cheap (`gemini-3.8-flash-low` observed on four model turns) | setup failure | unscorable: discovery command denied and final response empty | pass; optional diagnostic denied after test | unscorable: fixture discovery denied | fail: empty final response, no clarification | blocked | 29.5 s | 118,589 native total tokens across four model turns; cost unavailable |
| Agy native default (served identity unknown) | partial: implementation/hidden vectors pass; required agent test denied | unscorable: discovery denied and final response empty | pass | partial: implementation/hidden vectors pass; agent test could not run in sandbox | unscorable: listing denied and final response empty | blocked | 214.0 s | 103,706 native total tokens plus 166,583 cache-read tokens across five model turns; cost unavailable |

Codex attempted only T1/T2 at both tiers. The four native invocations reported exit zero but nested code-mode errors; they are infrastructure failures, not model-quality failures. One T1 cheap output made a single CUA app/window inventory inspection call; no UI mutation or browser interaction occurred. The private raw includes app/window metadata and is not reproduced here.

Agy attempted ten of twelve planned cells. Cheap T1 failed before model launch because the CLI interpreted `--mode` as the `--print` prompt; it was not retried. T1 default's required test command was denied by the initial scoped command rule. On T4 default, the sandbox could not find `npm`; a second test attempt received a stop-all-tools pre-tool-hook denial. The independent critic reviewed that raw and approved stopping Agy. T5 cheap returned no clarification; its denied `git status` diagnostic was nonblocking and did not prevent task-context access, so this is an ambiguity failure. T5 cheap/default had already started and settled before the parent hold arrived; T6 cheap/default were never launched. No setting, PATH, provider, or prompt workaround was made after the stop-hook finding.

## Interpretation and recommendation

- **Claude:** both tiers passed all four implementation behavior oracles and all four ambiguity probes in this one batch. The critic found no positive agent `npm test` trace for any of the eight implementation cells: four explicit denials and four unverified cells. Neither profile met the full predefined task bar, so this batch does not support a tier recommendation. Native identities were Haiku 5.5 and Opus 5.5, with no effort override.
- **Kiro:** keep native default for this task class if ambiguity handling is part of the bar. Both tiers passed the ordinary tasks and T6, but cheap failed T5 and deviated from the one-question instruction on T2. Served model identities and usage are unknown, so this does not isolate model quality from adapter defaults.
- **Codex:** no recommendation; all observed cells were infrastructure failures and the rest were not attempted.
- **Agy:** no recommendation; partial cells include setup, tool-policy, and test-execution failures, and T6 was blocked. Several implementation behaviors passed, but the full task bar cannot be compared fairly.

The ticket's requested-versus-observed identities are recorded in the private evidence receipt. Cost values are list-price estimates only where explicitly stated; they are not billing records. Agy/Kiro quotas and spend were unknown, and no usage probe or provider fallback was added. All native sessions respected the frozen 120-second ceiling. No native-session reruns occurred; Kiro cheap T3 did make two test-command attempts inside its single session, as noted above.

The public frozen inputs, rehydration script, and sanitized rubric are in the [ticket 167 fixture bundle](evidence/model-tier-implementation-t167/README.md). Agy used per-cell settings files; their hashes are retained in the private evidence receipt. No global settings were changed. The private oracle remains separate under its documented [retention lifecycle](evidence/model-tier-implementation-t167/private-oracle-lifecycle.md).

## Evidence and retention

The private 38-row evidence manifest binds result and raw-stream hashes, fixture/task identifiers, requested and observed model identities, session IDs when emitted, usage, settings hashes, terminal outcomes, test/oracle results, and denied-tool evidence. Its exact hash is in the heading. All twelve Kiro native sessions were deleted through the CLI's v2-only session-delete operation after independent raw review; a private receipt records every ID, native confirmation, and complete before/after list verification. The raw stdout/stderr, task roots, per-cell settings, hidden answer key, and Kiro IDs remain in the ticket-local private scratch directory until the full audit and parent integration are complete; they must not be published. The manifest does not contain the hidden answer key. Parent integration owns final acceptance, any table update in `models-and-usage.md`, disposition of remaining scratch roots, and ticket closure.
