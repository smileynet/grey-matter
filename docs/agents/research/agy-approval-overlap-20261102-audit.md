# Independent audit: Antigravity CLI Ask/Allow overlap

**Audited:** 2026-11-02 (America/Los_Angeles) against commit `38098d808dd6992d9ec87852dc6703a900f0c125`.

## Per-claim verdicts

- **Supported (bounded observation):** Identical regex Ask and Allow rules allowed `git --version` to run in the native event, producing `git version 2.53.0.windows.2`. The receipt contains the session settings, conversation ID, native tool state/output, and assertion-failure classification. This establishes the observed result for the recorded agy 1.4.12 session only.
- **Supported (bounded controls):** The literal Ask and broad Ask controls produced native permission errors without command output; identical regex Deny produced the native matching-deny error. The report correctly says headless rejection alone cannot prove which Ask rule matched.
- **Supported (documented expectation, not a runtime explanation):** Current Antigravity CLI docs state `Deny > Ask > Allow`, document regex targets for `command` and `unsandboxed`, and say `command` applies inside and outside the sandbox. These primary docs establish the expected policy and target forms; they do not explain the reproduced discrepancy. [Permissions documentation](https://antigravity.google/docs/permissions)
- **Supported as a limitation:** The receipt records that no effective permission enumeration occurred: although init advertised `list_permissions`, the attempted model invocation refused and no native listing event was produced. The report appropriately leaves parser behavior, effective inherited scopes, and internal cause unknown.
- **Supported (qualified mitigation):** The receipt’s regex Deny control matched and rejected the tested command. The report limits its recommendation to an explicit matching Deny where blocking is intended, validated by a native result; it makes no general confinement claim.

## Trust score

**High for the narrow experiment; low for any broader generalization.** The findings cite retained native-event receipts with exact settings and outputs. The official docs are first-party and current for the documented expectation, but do not resolve the runtime discrepancy. No source code or effective permission listing was obtained.

## Findings for the producer

No material claim mismatch found. Keep the diagnosis unresolved and bounded as written. The updated receipt inventories the four new probe IDs, associates each with its native event summary, and names the brain and conversation database paths. I independently checked those paths on disk; their byte totals match the receipt (497,526; 498,908; 498,908; 499,320; 1,994,662 bytes combined). The receipt's six older #158 histories total 2,797,398 bytes and remain a separate inventory. Do not include #157 or #194 model histories in this cleanup.

## Acceptance recommendation

**Accept the research result. Cleanup clearance is granted for the four #193 histories identified in the receipt and the six named legacy #158 histories, totaling 4,792,060 bytes, after parent coordination.** This clearance excludes every other native history, especially #157 and #194 model histories.

## Artifact disposition verification

After parent coordination, the worker recycled only the 20 cleared paths (ten `brain/<conversation-id>/` directories and ten `conversations/<conversation-id>.db` files) to the OS trash. They total 4,792,060 bytes: 1,994,662 bytes for the four #193 histories and 2,797,398 bytes for the six #158 histories. The worker verified all 20 inventoried paths absent afterward and confirmed there were no database sidecars. No #157 or #194 histories were touched.

The worker also recycled its four temporary session settings files (792 bytes total); no private fixture was created. The evidence receipt now records these sizes and the observed post-cleanup disposition.

**Final disposition:** cleanup clearance fulfilled for the exact inventoried scope. No native histories remain to retain for ticket #193.
