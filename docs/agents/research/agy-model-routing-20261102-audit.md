# Independent audit: agy child model routing

**Audited commit:** `800d2681388216e8452df0eaeb3e63154ff015e4`
**Audited files:** [findings](agy-model-routing-20261102.md), [evidence receipt](evidence/agy-model-routing-20261102.json)
**Overall trust score:** 0.92 — the technical findings are accurately bounded and supported; ticket acceptance still needs the parent-owned comparison cross-reference.

## Claim review

| Claim | Verdict | Audit |
| --- | --- | --- |
| Custom subagent `model` frontmatter requests `inherit`, `flash`, or `pro`. | supported | Current official CLI docs list those values and describe the field as the tier used when invoked. The v1.1.5 changelog independently describes the same control for subagent invocation. These support request semantics only. ([docs](https://antigravity.google/docs/subagents?tab=cli), [changelog](https://antigravity.google/docs/changelog?tab=cli)) |
| Installed workflow `agent(..., model=...)` accepts `inherit`, `flash_lite`, `flash`, and `pro`, and workflow agents are main agents. | supported | Independently re-read the installed `run-workflow/SKILL.md`: 10,315 bytes and SHA-256 `4A524107CB6173D75A54C2A7DE3ADDEB413D7BDB868C8279682DED74672BEB1E`, matching the reported version-specific evidence. This is local interface guidance, not a served-model trace. |
| #157 requested-control and metadata observations are transcribed without asserting a served model. | supported | The #157 source report, source guide, and receipt hashes match the hashes in the audited receipt. The cases distinguish frontmatter, explicit workflow `model="pro"`, and `invoke_subagent`; the opaque labels are explicitly not treated as identity. |
| `modelName` in hooks or status-line `model` proves a child’s served model. | supported (bounded negative claim) | Official docs define hook `modelName` for an invocation and status-line `model` for the active conversation; neither specifies child-level attribution. The report correctly calls child applicability unverified. ([hooks](https://antigravity.google/docs/hooks), [status line](https://antigravity.google/docs/cli/statusline/)) |
| No documented, independently interpretable child identity was verified for installed `agy 1.4.12`. | supported as an investigation result | The report scopes this to the consulted official docs, installed skill, and #157 evidence; it does not claim no such field can exist anywhere. Leaving served identity unknown satisfies the ticket’s evidence boundary. |

No unsupported or weak factual claims found. The distinction among requested model, opaque route label, and served identity is clear throughout. No new model call is needed to support this bounded conclusion.

## Required before ticket acceptance

1. The #157 comparison still needs a concise parent-owned cross-reference clarifying that request controls are documented while the served tier remains unverified. The parent will update and review this comparison during integration; this worker did not edit the shared #157 report.

## Post-audit cleanup (2026-11-03)

The parent coordinated clearance for exactly the 12 #157 model-control history sets listed in the #157 receipt's `cleanup.disposition`; no other history was in scope. A metadata-only re-inventory matched all 48 receipt entries and their recorded byte sizes (6,816,238 bytes total). The 11 brain trees, 36 database/sidecar entries, and nine non-hardlink files in the `be551…` brain tree were sent to the Windows OS Recycle Bin. The nine `be551…` files totaled 26,466 bytes. Overall, 56 recorded items representing 6,724,590 bytes were recycled; the one zero-byte `.db-wal` entry was recycled in the first verified call and is included in the records. Direct post-checks found all approved operation paths absent.

The `be551703-5692-4940-841f-6a57daa1b754` brain directory was preserved. Its `t157-python-runtime/python3.exe` hardlink (91,648 bytes) was neither moved nor deleted; its SHA-256 before and after cleanup is identical, and the hardlink inventory still lists the original CPython path. The directory contains no other files. Exact paths, bytes, dispositions, and the hardlink digest are in the [#194 evidence receipt](evidence/agy-model-routing-20261102.json). No OS refusal occurred and no unlisted history was touched.

## Decision

**Research and cleanup accepted; parent integration remains.** The research content is accepted on substance, and the cleared native histories were recycled with the preserved hardlink verified. The ticket remains open until the parent refreshes and reviews the shared comparison. Do not infer ticket completion from this audit alone.
