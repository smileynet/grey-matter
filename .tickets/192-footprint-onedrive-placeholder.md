---
id: "192"
title: "Validate footprint reporting for an owned OneDrive online-only placeholder"
status: open
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
Current prerequisite: an approved fixture path and permission for the intended operation;
none has been supplied. This ticket is independently actionable when that prerequisite exists,
with no false dependency on #132.

## Acceptance criteria

- [ ] An owner-approved online-only OneDrive fixture is identified without hydrating or changing unrelated cloud data.
- [ ] Logical bytes, allocated/local bytes and inspector coverage are observed before and after only the authorized fixture operation; unknowns are reported explicitly.
- [ ] Any inspector defect is fixed with a meaningful regression, or evidence shows correct bounded handling; applicable project checks pass.
