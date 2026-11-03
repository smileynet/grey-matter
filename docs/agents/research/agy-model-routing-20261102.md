# Antigravity child model routing: request controls and evidence boundary

**Checked:** 2026-11-02, Windows, locally installed `agy 1.4.12`. **Conclusion:** model tiers can be requested through two documented interfaces, but the prior native probe does not establish which model served a workflow-created child. Until Antigravity exposes a child-scoped, documented identity field or descriptor, do not use per-role model tiers as a cost or capability guarantee.

## Verified controls

Confidence for this section: **high** for documented request semantics; it does not imply the requested tier served a response.

### Custom subagents invoked with `invoke_subagent`

The official [Custom subagents documentation](https://antigravity.google/docs/subagents?tab=cli) lists frontmatter `model` as a tier used when invoked, with `inherit`, `flash`, and `pro` values. The [CLI changelog's v1.1.5 entry](https://antigravity.google/docs/changelog?tab=cli), dated July 21, 2026, also describes tier selection and the inherited-parent default for subagent invocation. The supported claim is about the *request/control* for `invoke_subagent`; it is not proof of the effective model returned by a particular request.

> “`model` | `string` | `inherit` | Model tier used when invoked (`inherit`, `flash`, or `pro`).”

Public docs are current as accessed 2026-11-02; installed CLI was `agy 1.4.12`. These controls and versioned descriptions should not be conflated with workflow `agent(...)` children.

### Workflow-created agents

The installed `%USERPROFILE%/.gemini/antigravity-cli/builtin/skills/run-workflow/SKILL.md` (10,315 bytes; SHA-256 `4A524107CB6173D75A54C2A7DE3ADDEB413D7BDB868C8279682DED74672BEB1E`, read 2026-11-02) documents this signature:

> `agent(prompt=None, schema=None, role=None, type_name="self", workspace="inherit", model=None)`

It documents `model` values `inherit`, `flash_lite`, `flash`, and `pro`, with default `inherit` (the current model), and describes workflow agents as main agents rather than subagents. This is locally installed interface guidance for `run_workflow`, not an identity report. The official SDK changelog also documents Python workflow primitives separately; it does not establish that SDK and CLI model routing are interchangeable.

The custom subagent docs describe `model` for a subagent invocation. They do **not** specify whether `agent(type_name=<custom profile>)` uses that profile's frontmatter `model` when the workflow call omits its own `model` argument, or how an explicit workflow argument interacts with frontmatter. Treat that interaction as unspecified.

## Prior native observations (ticket #157)

The [#157 user-facing research report](harness-experimental-features-20261101.md#ticket-157-native-agy-workflows-2026-11-02), [source guide](agy-workflows-source-20261102.md), and [native evidence receipt](evidence/agy-workflows-20261102.json) record the requests and observed route labels. Exact native history ownership and disposition remain in that receipt; 12 model-control history sets were retained through ticket #194 for independent review. This ticket did not open, alter, or delete those histories.

| Native case | Request made | What the observation supports |
|---|---|---|
| `12-model-roles` | Workflow `agent(type_name=...)` selected three custom profiles with frontmatter `flash`, `pro`, and `inherit`; no explicit per-child `model` argument. Parent used Argon Medium. | Flash/pro frontmatter cases had Flash Tiered-looking route labels; inherit had an Argon Medium-looking label matching its parent. Labels only. |
| `16-explicit-model-control` | Workflow `agent(type_name=...)` selected custom flash/pro profiles and explicitly passed `model="pro"`. | Returned markers and Flash Tiered-looking route labels were recorded. This does not show that the request was ignored or that Pro was served. |
| `18-subagent-model-control` | Native `invoke_subagent` selected custom `t157-pro-reviewer`, whose frontmatter requested `pro`; no invocation Model override. | A child result and conversation ID were recorded. The available evidence did not provide an independently interpretable served-model field. |

Across the related #157 model-control cases, the native receipt reports model-label-looking strings extracted from opaque `gen_metadata` blobs. The receipt explicitly marks served identity unverified. No inference from these labels is warranted: they might be routing/display metadata, and no first-party descriptor found in the probe establishes their semantics. A child's own prose naming a model is also not evidence.

The prior source guide's recorded finding is:

> “The runtime probe reports `gen_metadata` label `gemini-3.8-flash-tiered` (internal model M322) for a child requested through frontmatter `flash`, another requested through frontmatter `pro`, and two requested through explicit workflow `model="pro"`; a frontmatter-`inherit` child instead reported `gemini-4.18-argon-medium` (M418), matching its Argon Medium parent. These are metadata route labels, not direct proof of the model that served generation.”

Source: [#157 Antigravity workflows source guide](agy-workflows-source-20261102.md), section “Documented vs unknown — custom agent model pin and workflow-agent model argument are separate controls.” Confidence: **medium** that the request/label pair is accurately transcribed from the captured run; **none** for a served-model conclusion from those labels.

## Identity evidence: what is and is not sufficient

The current first-party [Hooks documentation](https://antigravity.google/docs/hooks), accessed 2026-11-02, defines `modelName` as:

> “The name or identifier of the model handling the invocation”

This is a documented field contract for hook input. However, the documentation does not establish that a hook running in the parent reports a *child* invocation's model, nor that the installed 1.4.12 workflow child surfaces this field in a way tied to its native result. It is therefore a promising future probe target, but not evidence that these tested children ran on a particular model. Confidence: **high** for the documented hook field; **low** for its applicability to child routing in the tested release.

The official [CLI status-line JSON field reference](https://antigravity.google/docs/cli/statusline/), accessed 2026-11-02, defines `model` as:

> “Contains `id`, `display_name`, and `effort`.”

It does not define a per-child value or mapping from a parent status-line record to an `invoke_subagent` or workflow child. Neither this main-session field nor the opaque protobuf label is sufficient for per-role served identity. Confidence: **high** for the active-conversation field contract; **low** as evidence about child identity.

**Couldn't verify:** a first-party field, descriptor, or documented callback that independently identifies the model serving each child in installed `agy 1.4.12`. Searched the official custom subagent, hooks, status-line, and CLI changelog docs plus the installed workflow skill and #157 native receipt. Public hooks provide a documented candidate (`modelName`), but child scope and compatibility with this tested release were not established. Do not reverse-engineer opaque protobuf fields to fill this gap.

## Bounded recommendation for orchestration

- It is supported to configure a requested tier for custom `invoke_subagent` agents and to pass a tier to workflow `agent(...)`, within each interface's documented values.
- Do not assume custom-agent frontmatter routes a workflow-created main agent; the installed skill distinguishes these from subagents.
- Do not promise a served tier, its capability, latency, or cost for a given role based on configuration or opaque route labels.
- If role-to-model guarantees matter, wait for a documented child-scoped model identity contract, then qualify it in the installed release with parent and child controls before making the orchestration depend on it.

This adds the routing qualification to the Antigravity/agy arm of the orchestration comparison summarized in [the #157 research report](harness-experimental-features-20261101.md#ticket-157-native-agy-workflows-2026-11-02). It does not constrain other harnesses or block unrelated orchestration work.

## Cleanup disposition (2026-11-03)

After independent review, the critic cleared the exact 12 #157 model-control history sets, excluding the Python hardlink. The parent authorized cleanup of only those sets. The evidence record contains each recycled path and byte count, the pre/post absence checks, and the saved hardlink hash. The 11 other brain trees and the 36 conversation database/sidecar files were recycled; in `be551703-5692-4940-841f-6a57daa1b754`, only the nine approved non-hardlink native files were recycled, leaving the containing folder and Python runtime path in place. All 56 recorded items are absent; 6,724,590 B were sent to the OS trash. The 91,648 B Python hardlink's SHA-256 is unchanged. No unlisted history was changed.

## Evidence and version notes

Machine-readable request-case identifiers, receipt hashes, source hashes, retained-history ownership, cleanup paths and byte counts, and field-contract classification are in [the evidence record](evidence/agy-model-routing-20261102.json). The [independent audit](agy-model-routing-20261102-audit.md) accepts the research substance at 0.92 and leaves the shared comparison refresh with the parent. Primary public sources and supporting snippets are above. The official changelog's v1.1.5 feature wording predates the locally observed `agy 1.4.12`; it documents the CLI's intended frontmatter control, while local behavior remains limited to the specific #157 observations.
