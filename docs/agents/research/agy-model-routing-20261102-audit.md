# Independent audit: agy child model routing

**Initial research audit:** `800d2681388216e8452df0eaeb3e63154ff015e4`

**Supplemental final review:** `d3d9f2c676504b515b79e9324238bb3fc01da994`
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

## Parent-owned comparison review

The parent’s comparison diff in `harness-experimental-features-20261101.md` satisfies the ticket’s comparison-update criterion. Its new #194 section and revised #157 qualification distinguish documented request controls from unverified served identity, separate custom subagent and workflow interfaces, and state that hook/status-line fields and opaque labels do not prove the child’s served model. It links the qualified findings, receipt, and audit. The worker did not edit this shared comparison. Parent integration and ticket closure remain parent-owned.

## Post-audit cleanup (2026-11-03)

The parent coordinated clearance for exactly the 12 #157 model-control history sets listed in the #157 receipt's `cleanup.disposition`; no other history was in scope. A metadata-only re-inventory matched all 48 receipt entries and their recorded byte sizes (6,816,238 bytes total). I independently checked the final receipt against that inventory: it contains 56 removal operations covering exactly the same 12 IDs and totaling 6,724,590 bytes. I independently confirmed all 56 operation paths are absent. The 11 brain trees, 36 database/sidecar entries, and nine non-hardlink files in the `be551…` brain tree were sent to the Windows OS Recycle Bin. The nine `be551…` files totaled 26,466 bytes. The zero-byte `.db-wal` entry was recycled in the first verified call and is included in the 56 operations.

The `be551703-5692-4940-841f-6a57daa1b754` brain directory was preserved. I independently confirmed it now contains only `t157-python-runtime/python3.exe` (91,648 bytes, `HardLink`); its SHA-256 is `B20403B111271EDDE227E38E73C55887BBABF0B82E1C2AD2A21F38F04EEDCD98`, matching the before/after values in the receipt. `fsutil hardlink list` still lists the original CPython target. Exact paths, bytes, dispositions, and the hardlink digest are in the [#194 evidence receipt](evidence/agy-model-routing-20261102.json). No OS refusal occurred and no unlisted history was touched.

After the final critic metadata review, the worker recycled its own metadata-only scratch artifacts to the OS trash: `.scratch/t194-cleanup.ps1` (6,650 bytes), `.scratch/t194-promote-cleanup.ps1` (3,820 bytes), `.scratch/t194-cleanup-result.json` (13,223 bytes), and the now-empty worker-created `.scratch` directory (0 bytes). All four paths were verified absent; the result facts were promoted to the receipt first. Total worker scratch data recycled: 23,693 bytes. The only artifact retained from the probe is the parent-owned runtime hardlink described above.

## Decision

**Research, comparison qualification, and cleanup accepted; parent integration remains.** The findings are supported, AC2’s comparison update has been reviewed, and the exact native histories were recycled with the preserved hardlink independently verified. Parent integration and ticket closure remain. Do not infer ticket completion from this audit alone.
