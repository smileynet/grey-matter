---
id: "192"
title: "Validate footprint reporting for an owned OneDrive online-only placeholder"
status: backlog
blocked_by: []
priority: medium
validation_criteria:
  - "An owner-approved online-only OneDrive fixture is identified without hydrating or changing unrelated cloud data."
  - "Logical bytes, allocated/local bytes and inspector coverage are observed before and after only the authorized fixture operation; unknowns are reported explicitly."
  - "Any inspector defect is fixed with a meaningful regression, or evidence shows correct bounded handling; applicable project checks pass."
tags: ["stream:test-verification", "type:chore"]
---

# Validate footprint reporting for an owned OneDrive online-only placeholder

## What to build

Follow-up explicitly permitted by #132's placeholder acceptance criterion. The Windows
observation report records no owned online-only fixture, so local NTFS tests do not establish
cloud-placeholder allocation or hydration behavior. See
[the current observations](../docs/agents/research/footprint-commands-by-os-20261031.md).

Identify an owner-approved disposable OneDrive online-only file before probing. Do not
enumerate unrelated personal cloud data, read file content, hydrate it or change its provider
state without authorization for that exact fixture. Observe metadata/logical size versus
local allocation and the inspector's coverage. If a state-changing comparison is needed,
name its ownership and expected terminal state first. Provider listings and logical bytes
alone do not prove local availability, allocated storage or preservation.

Read the maintained artifact-hygiene skill, Windows footprint reference, inspector module
and its fixture tests. Fix a confirmed defect at the existing boundary; otherwise record
bounded evidence. No new storage/account API or live provider call is implied by this brief.
The user supplied an exact fixture path in chat on 2026-11-02 in response to the metadata-only
inspection request. Authorization covers that file's metadata, not content reads, hydration or
provider-state changes. The worker will confirm its actual placeholder state; the path alone
does not establish that it is online-only. Committed evidence uses an alias rather than exposing
the personal path. There is no dependency on #132.

## Acceptance criteria

- [ ] An owner-approved online-only OneDrive fixture is identified without hydrating or changing unrelated cloud data.
- [ ] Logical bytes, allocated/local bytes and inspector coverage are observed before and after only the authorized fixture operation; unknowns are reported explicitly.
- [ ] Any inspector defect is fixed with a meaningful regression, or evidence shows correct bounded handling; applicable project checks pass.

## Approved-file observation 2026-11-02

The supplied path was inspected with metadata-only APIs, followed by one exact-file
inspector pass without deduplication, then the same metadata snapshot. The sanitized
[evidence record](../docs/agents/research/evidence/onedrive-placeholder-192-20261102.json)
uses fixture alias A; the private path/name and content are not committed.

The actual file is regular/local: 11,745,765 logical bytes, 11,747,328 allocated bytes,
archive-only attributes, no reparse tag and Cloud Files state NO_STATES. The inspector
reported 11,747,328 bytes, exit 0, status review and incomplete open-file coverage. The
before/after metadata and timestamps matched. No content was read/hashed/copied and no
provider-state operation was requested. Provider contact was not instrumented and is not
claimed absent. CfGetPlaceholderInfo returned undecoded 0x80070178 with no information.

This qualifies handling of that local file only. It does not meet the online-only fixture
criterion or establish a placeholder defect. The critic caught a blanket no-provider-call
claim in the surrounding report; a621fe9 corrected its scope and renewed review accepted.
Root integrated at 700de75; explicit pre-merge agent-guidance passed 1/1 in 1.0 s and
pre-push doc-links/home-path passed 2/2. JSON parsing and docs consistency passed; no code
changed and no full test gate was repeated for this evidence-only update.

Resumption requires another owner-approved file already showing an online-only cloud icon.
This is pending at the user's request; no further fixture request or probe is planned until
they resume it. Do not change the current file's availability to manufacture a fixture.
The completed metadata-only worker unit does not satisfy the missing online-only prerequisite.
Retain the named t192-evidence checkout (14,585,938 file bytes at worker measurement)
through the next fixture comparison/final platform audit, then retire it. Metadata handles
belonged to terminated probe processes; no persistent helper or raw private-path output
was created. The original user file remains outside repository artifact cleanup scope.

## User deferral 2026-11-02

The user instructed: move on to other work and leave OneDrive pending. Parked in backlog;
no further fixture request, file inspection or availability change is planned until the user
resumes this work. The supplied file's local-only observation remains valid within its recorded
scope; online-only placeholder acceptance is still unmet.

## Independent follow-up after core delivery — 2026-11-02

The user accepted the test-verification core as delivered and separated this ticket from
its completion gate. This remains an independent unfinished follow-up with its existing
status, acceptance criteria and activation conditions preserved; the stream tag records
lineage rather than a blocker on adoption. No Mac/OneDrive deferral is revoked, no missing
failure is explained by a green rerun, and no new platform pass or cleanup is claimed.
See the [delivery/adoption record](../docs/agents/research/test-verification-delivery-20261102.md)
and [plan](../docs/plan.md#independent-verification-follow-ups).
