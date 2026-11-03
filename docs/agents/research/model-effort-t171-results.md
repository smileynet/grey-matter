# Ticket 171: fixed-model effort sweep results

**Status: partial; no effort recommendation is supported. Keep the existing defaults.** The native wave produced 11 complete responses, two timeouts and one consumed setup failure. Of the 11 complete responses, one received a valid independent pass and ten are unscorable because their review bodies failed the frozen evidence-binding rules. An unscorable review is not a model-quality failure.

This was a one-attempt-per-cell directional probe, not a reliability estimate. Actual effort was not reported for any completed call. The valid pass is the Codex diagnosis response requested at `max`; the actual Codex model and effort were not reported, so this is not evidence that `max` itself caused the pass.

## Results by completed cell

Usage below preserves the provider's own field names. Claude: `input / cache-write / cache-read / output / thinking tokens`. Codex: `input / cached-input / cache-write / output / reasoning-output tokens`. Do not sum these across providers. Cost figures are provider-reported estimates, not billed totals.

| Provider / requested model | Task / requested effort | Native result; time | Native usage | Review outcome | Observed model / effort | Reported cost |
|---|---|---:|---|---|---|---:|
| Claude / `claude-opus-5-5` | Diagnosis / low | Complete; 12.580 s | 2 / 2,836 / 1,569 / 1,123 / 141 | Unscorable: format-validity mismatch | `claude-opus-5-5` / unknown | $0.0454698 estimate |
| Claude / `claude-opus-5-5` | Diagnosis / medium | Complete; 20.148 s | 2 / 2,012 / 2,387 / 1,907 / 633 | Unscorable: source quote was not exact | `claude-opus-5-5` / unknown | $0.0547214 estimate |
| Claude / `claude-opus-5-5` | Diagnosis / high | Complete; 19.708 s | 2 / 2,014 / 2,387 / 1,849 / 691 | Unscorable: source quote was not exact | `claude-opus-5-5` / unknown | $0.0535774 estimate |
| Claude / `claude-opus-5-5` | Diagnosis / xhigh | Complete; 31.228 s | 2 / 2,014 / 2,387 / 3,020 / 1,827 | Unscorable: source quote was not exact | `claude-opus-5-5` / unknown | $0.0769974 estimate |
| Claude / `claude-opus-5-5` | Diagnosis / max | Timed out; 120.046 s | No usage receipt | Not graded; no complete response | Unknown / unknown | Unknown |
| Codex / `gpt-6.1-sol` | Diagnosis / medium | Complete; 17.617 s | 18,247 / 12,416 / 0 / 382 / 154 | Unscorable: source path was outside the expected set | Unknown / unknown | Unknown / not reported |
| Codex / `gpt-6.1-sol` | Diagnosis / high | Complete; 25.440 s | 19,189 / 12,416 / 0 / 660 / 402 | Unscorable: source quote was not exact | Unknown / unknown | Unknown / not reported |
| Codex / `gpt-6.1-sol` | Diagnosis / xhigh | Complete; 43.488 s | 19,185 / 12,416 / 0 / 1,174 / 937 | Unscorable: source path was outside the expected set | Unknown / unknown | Unknown / not reported |
| Codex / `gpt-6.1-sol` | Diagnosis / max | Complete; 67.545 s | 19,179 / 12,416 / 0 / 2,007 / 1,746 | **Pass** | Unknown / unknown | Unknown / not reported |
| Codex / `gpt-6.1-sol` | Design / low | Complete; 19.646 s | 19,198 / 12,416 / 0 / 633 / 80 | Unscorable: unsupported fact had a nonempty response quote | Unknown / unknown | Unknown / not reported |
| Codex / `gpt-6.1-sol` | Design / medium | Complete; 30.387 s | 18,258 / 12,416 / 0 / 676 / 127 | Unscorable: unsupported fact had a nonempty response quote | Unknown / unknown | Unknown / not reported |
| Codex / `gpt-6.1-sol` | Design / high | Complete; 59.819 s | 19,196 / 12,416 / 0 / 1,485 / 815 | Unscorable: response quote was not exact | Unknown / unknown | Unknown / not reported |

## Consumed, held and blocked cells

| Cell | Result |
|---|---|
| Codex diagnosis / low | Consumed by a pre-spawn pinned-host guard failure. The provider process was not launched and native model-call count is zero. The retained evidence is a transcription, not raw stderr; cost is unknown. Do not retry. |
| Codex design / xhigh | Timed out after 120.239 s. Do not retry. A complete final response was not captured; the retained stdout and stderr streams are nonempty. Identity, effort, usage and cost remain unknown. |
| Codex design / max | Not attempted after the preceding timeout. |
| Claude design / all five levels | Held; no calls. |
| Kiro / all ten planned cells | Held because pinned CLI support for the requested levels was not established. |
| Google/Agy / ten planned cells | Blocked by the workstream security decision; no commands ran. |

There were 14 consumed cell records: 13 provider `spawnSync` invocations (five Claude and eight Codex), 11 complete responses, two timeouts, and the one pre-spawn setup failure. There were no retries or provider fallbacks. The timeout records do not support a zero-execution or zero-cost claim. The Codex setup failure's zero native calls also does not establish zero cost.

## What the reviews establish

The independent grading audit verified the frozen ledger and raw packet, assignment and review hashes, then reproduced the same validation failure for each of the ten unscorable rows. The failures were four inexact source quotes, two unsupported facts with nonempty response quotes, two source paths outside the expected set, one inexact response quote, and one mismatch between `formatValid` and the candidate's task-specific JSON shape. The sole bound review was the Codex diagnosis cell requested at `max`.

These results do not compare effort quality: ten completed responses have no valid score, only one score is usable, and requested effort is not observed effort. Claude's four completed responses report canonical `claude-opus-5-5` in retained `modelUsage`; their effort fields are absent. Codex actual identity and effort are absent from the retained receipt and selected raw metadata. The two timeouts have unknown actual identity and effort. Codex cost is unreported, and aggregate billed cost is unknown. Provider usage fields differ, so the raw usage values are retained per cell without cross-provider arithmetic.

The evidence therefore does not justify an effort-level change or a model-selection recommendation. Retain the repository's current defaults until a future, independently reviewed sample provides enough valid quality outcomes. No user or global model settings were changed for this spike.

## Provenance, retention and limits

The grading ledger and trace records are parent transcriptions of collaboration events, not platform-authenticated exports. The independent audit found their packet/task/output/hash bindings internally consistent; the parent reports checking those transcriptions against live collaboration history. The retained records alone do not cryptographically prove runtime origin.

Historical grades remain bound to binder commit `4e90b304af5a4f4025ccc4edb5eef56108c5563e`. The later hermetic test refactor is commit `9340ed1362681804b9a380eed7f23238cd9180d9`; it was not used to rebind or rescore any review. Its focused test passed 3/3 in a fresh detached checkout with `.scratch` and the private key absent. Those tests exercise the synthetic core and write-once behavior, not the production wrapper's private-input loader; the parent registered the appropriate repository gate for that boundary. Private prompts, raw model output, answer key, rubric, review bodies, crosswalk, native receipts and reviewer traces remain in ignored scratch for parent integration. No raw artifacts or sessions were deleted.

The parent-authorized cleanup plan rechecked all 20 exact native working-directory identities, real-directory status, containment and emptiness immediately before recycling each target. All 20 paths were then absent. The private raw receipt retains each original path, matched identity and operation result (SHA-256 `827adcbff6f6a87b84667700e0b162344c78ae42da6bad5a0a60fa836d12fcd5`); Recycle Bin destination identifiers were not recorded. The [sanitized cleanup receipt](evidence/model-effort-t171-cleanup.json) records the target IDs and verification results without publishing temporary paths. Raw model evidence, provider sessions, rubric/key, held-out files and unrelated directories were not touched.

The accompanying [evidence index](evidence/model-effort-t171.json) records exact SHA-256 bindings for the frozen plans, native streams, receipts, responses, packets, reviews, assignments and trace transcriptions, plus per-cell usage and status. It contains hashes and metadata, not raw response text or private rubric contents.
