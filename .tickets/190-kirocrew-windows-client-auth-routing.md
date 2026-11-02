---
id: "190"
title: "Resolve: Kiro Crew Windows host-auth relay must select client ownership explicitly"
status: open
blocked_by: ["186"]
validation_criteria:
  - "The Windows omitted-flag routing mismatch is reproduced or marked fixed on the selected Crew/CLI versions, with credential-free callback evidence."
  - "A supported upstream version or explicitly scoped integration remedy selects client ownership for Crew-owned auth, with failure handling and CLI-owned behavior verified separately."
  - "Guidance records identity assumptions and limits; private processes/data are disposed and required checks pass without global credential changes."
tags: ["stream:orchestration", "kind:bug"]
---

# Resolve: Kiro Crew Windows host-auth relay must select client ownership explicitly

## What to build

Resolve the Windows host-auth routing mismatch confirmed by #186 for installed
Kiro Crew 0.11.1 and kiro-cli 2.37.1. Crew's `host_auth=True` relay builder omits
`--auth-method`; its Windows resolver uses the same self-contained CLI executable
and no POSIX chat sibling. The omitted command completed a prompt without
forwarding token callbacks, matching explicit CLI ownership. Explicit `client`
forwarded nine callbacks to the controlled host and failed authentication when
that host deliberately supplied no credential.

Intent source: [#186's auth routing findings](../docs/agents/research/kirocrew-orchestration.md#ticket-186-auth-owner-routing-2026-11-02)
and [sanitized receipt](../docs/agents/research/evidence/kas-auth-ownership-20261102.json).
Recheck the installed versions, actual selected executable and builder before
changing anything. Find a supported upstream correction/version or an explicitly
scoped integration remedy that selects client ownership for Crew-owned auth.
Verify its negative credential path and CLI-owned path independently. Real
vault-delivery verification must use authorized existing identities without
printing tokens; unavailable identity is a setup limit, not permission to
create, switch or sign out accounts.

The owning repository is grey-matter, not the installed Crew product. Do not
patch that installation or open an upstream issue/message without explicit
authorization. Guidance may document a supported remedy once verified. The
private CLI-owned route remains usable for #156, so this is not a blanket
blocker on Mate or GUI probes. POSIX and standalone-bundle behavior require
separate evidence; do not extrapolate the Windows result.

## Acceptance criteria

- [ ] The Windows omitted-flag routing mismatch is reproduced or marked fixed on the selected Crew/CLI versions, with credential-free callback evidence.
- [ ] A supported upstream version or explicitly scoped integration remedy selects client ownership for Crew-owned auth, with failure handling and CLI-owned behavior verified separately.
- [ ] Guidance records identity assumptions and limits; private processes/data are disposed and required checks pass without global credential changes.
