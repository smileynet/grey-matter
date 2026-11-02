---
id: "186"
title: "Probe: KAS relay authentication ownership with current kiro-cli"
status: in_progress
blocked_by: ["185"]
validation_criteria:
  - "Runtime observations distinguish CLI-owned from client-owned authentication on the actual Crew launch argv without exposing tokens."
  - "The supported launch recipe or bounded compatibility failure is recorded with installed versions and a sanitized receipt."
  - "Private probe data is recycled, configuration changes are restored or recorded, and required repository checks pass."
tags: ["stream:orchestration", "type:research"]
priority: high
---

# Probe: KAS relay authentication ownership with current kiro-cli

## What to build

Determine which process actually owns authentication when installed Kiro Crew
launches its KAS relay, and record a supported recipe for each available owner.

Intent source: the unresolved compatibility gap in
[ticket 185's dated KAS research](../docs/agents/research/kirocrew-orchestration.md#kas-under-kiro-crew-0111-2026-11-02).
Crew 0.11.1's `acp/kas_transport.py::build_kas_argv(host_auth=True)` omits
`--auth-method`; installed CLI 2.37.1 help and current first-party ACP guidance
say omission defaults to CLI ownership and client ownership requires `client`.
The prior initialize-only handshake did not exercise token callbacks.

Trace the actual selected CLI executable and Crew launch plan, then compare
explicit CLI ownership, Crew's omitted-flag path and explicit client ownership
in a private probe. Capture callback method names and outcome classes without
recording token values. Use existing authorized sign-ins; missing identity is a
reported setup limit, not permission to create or change credentials. An
authentication-needed session may be necessary to reach the callback; stop
before unrelated worker/tool execution.

Record CLI/Crew/engine versions, sanitized argv and an independent observed
result for each exercised path. Distinguish help/source intent from runtime
behavior. If the mismatch is confirmed, document a supported workaround or an
upstream fix/version prerequisite; do not patch the installed product in this
ticket. #156 can use an already verified CLI-owned path independently; this
ticket is only a prerequisite if that probe chooses Crew-owned relay auth.

## Acceptance criteria

Observed findings: [dated auth routing section](../docs/agents/research/kirocrew-orchestration.md#ticket-186-auth-owner-routing-2026-11-02)
and [sanitized receipt](../docs/agents/research/evidence/kas-auth-ownership-20261102.json).
On these Windows versions, the constructed omitted-flag command behaved like
CLI ownership, while explicit client ownership forwarded token requests and
handled the controlled credential-unavailable error. No live Crew vault was
accessed. The integration correction is tracked separately in #190; the known
EOF teardown error remains #189.

- [ ] Runtime observations distinguish CLI-owned from client-owned authentication on the actual Crew launch argv without exposing tokens; unavailable paths are labeled with the exact setup limit.
- [ ] The supported launch recipe or bounded compatibility failure is recorded in the KAS research note with installed versions, primary-source excerpts and a sanitized receipt.
- [ ] Private probe data is recycled, configuration changes are restored or recorded, and required repository checks pass.

## Out of scope

Global credential/configuration changes, upstream product patches, provider
switching, a new model benchmark, and repeating #155's unsupported backend split.
