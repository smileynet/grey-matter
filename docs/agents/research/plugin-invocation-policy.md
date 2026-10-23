# Native plugin invocation policy

Tested 2026-10-23 on macOS. Ticket 73 distinguishes user-facing discovery from the
context sent to a model. Catalog visibility alone is not an invocation test.

## Observed contract

| Host | Tested version | Policy input | Implicit context | Explicit human invocation |
| --- | --- | --- | --- | --- |
| Codex | 0.147.0 | `agents/openai.yaml` → `policy.allow_implicit_invocation: false` | Unique human-only description marker and body excluded | `$policy-probe:probe-human` expands body |
| Claude Code | 2.1.223 and 2.1.309 | `disable-model-invocation: true` | Unique human-only description marker and body excluded | `/policy-probe:probe-human` expands body |
| Antigravity | 1.4.5 and 1.4.6 | `disable-model-invocation: true` | Unique human-only description marker and body excluded | `/policy-probe:probe-human` expands body |

[L1:verified] Each host passes three controlled cases: ordinary context includes an
open twin and excludes the human-only description marker and body; an explicit human command includes its
body; removing the policy makes its metadata appear in ordinary context. Codex's
fixture uses only its sidecar policy, not Claude frontmatter. Antigravity's read-only
`/skills` catalog also reports `model_invocable: false` for the restricted control
and `true` for the open control. The full user-facing catalog includes both.

These observations resolve the earlier unknown for these versions. Antigravity's
published frontmatter documentation still omits the field: runtime evidence proves
observed support, not a vendor promise about every version. Preserve the field and
re-run the probe when upgrading. There is no need to remove human-only skills or
substitute a different customization format.

This is a context/activation eligibility guarantee, not a filesystem security boundary.
The probe does not claim a hostile model cannot request an arbitrary file by its path,
that all skill instructions execute correctly, or that other clients/platforms behave
identically. Full candidate package loading and upgrade coverage remain ticket 69.

## Reproduction and isolation

Run each command separately:

```text
node scripts/probe-invocation-policy.mjs codex
node scripts/probe-invocation-policy.mjs claude
node scripts/probe-invocation-policy.mjs agy
```

The script creates disposable homes and projects. Codex installs its local fixture
marketplace/plugin there; Claude loads an explicit fixture plugin directory;
Antigravity discovers its fixture under the disposable plugin root. All controls
have unique descriptions and bodies, avoiding reliance on a model's self-report.

A loopback HTTP server captures constructed requests and returns a terminal 400.
Nonzero host exits are expected; the probe passes only when captured context matches
all controls. No model response or tool call is executed. macOS `sandbox-exec` denies
network access except loopback. The subprocess environment contains an allowlist,
not inherited credentials/configuration. Claude and Antigravity receive fabricated
API-key strings for the local endpoint; Codex's provider requires no authentication.
The probe is macOS-only and is an explicit native check, not part of offline check-repo.

Machine-readable [results](evidence/invocation-policy-20261023.json) record client
versions, three-case outputs, expected host exits and the exact probe SHA-256.
To repeat with another Claude version, prepend its isolated binary directory to the
subprocess PATH; do not update or authenticate the maintainer's installed CLI merely
for validation. The [current Claude report](claude-current-validation.md) gives
reproducible acquisition and validation commands for 2.1.309.

## Primary sources and limits

All retrieved/read on 2026-10-23; no publication date is inferred from retrieval.

- [L4:verified] [OpenAI skill metadata](https://learn.chatgpt.com/docs/build-skills#optional-metadata)
  defines the Codex sidecar policy. [Provider configuration](https://learn.chatgpt.com/docs/config-file/config-reference)
  documents custom `base_url`, `wire_api`, authentication and retry settings used by
  the fake endpoint. The fixture never routes to the default OpenAI provider.
- [L4:verified] [Claude invocation controls](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill)
  document model-only/user-only activation boundaries. The
  [Anthropic-compatible endpoint setting](https://code.claude.com/docs/en/llm-gateway)
  is used solely for local capture; the sandbox independently blocks external access.
- [L4:verified] [Antigravity authentication/custom endpoint](https://www.antigravity.google/docs/install?tab=cli#using-a-gemini-api-key)
  documents `modelProvider: gemini`, `GEMINI_API_KEY` and `GOOGLE_GEMINI_BASE_URL`.
  [Skills](https://www.antigravity.google/docs/skills/) do not document the human-only
  field. The runtime/context observations above, rather than an absent documentation
  claim or binary strings, support the version-specific result.

Current Claude syntax validation is a separate gate. Version 2.1.309 accepts both
repositories' manifests, but a seeded invalid-description array is missed in
grey-matter's nested custom paths. The same 44 exact skill files validate in a flat
temporary layout, where the seed fails and the restored files pass. Candidate
validation in tickets 65/67 must retain that component check; a green root validator
alone cannot waive it. Native icon/README directory advice is release-artifact work
under ticket 71, and root CLAUDE.md is repository context, not shipped plugin context.
