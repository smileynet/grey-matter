---
id: "158"
title: "Spike: agy command(regex:...) rules narrower than command(*)"
status: done
blocked_by: ["124","129"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
---

# Spike: agy command(regex:...) rules narrower than command(*)

## What to build

Probe agy 1.4.12's documented `command(regex:...)` permission rules headless, plus `write_file(path)`, for workers that need `git`, `npm` and `tkt`. Ticket 129 saw `command(git)`, `command(git *)`, `command(git:*)` and an exact command all denied; only `command(*)` worked.

**Question:** Is there any working rule narrower than `command(*)` for headless agy workers on this account?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [x] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [x] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [x] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Preparation in this chat created a 98,400-byte private fixture and its baseline npm test passed 1/1; no regex or write-boundary probe has run. Retain it only through this ticket, then recycle it. Current first-party Windows guidance recommends regex matching; workspace writes may be implicitly allowed, so a successful in-workspace write alone does not prove the write_file rule bounded access. Use harmless negative controls and verify file bytes/command results.

## Live probe update (2026-11-02, after preparation)

The preparation note above is historical. The 22-case matrix now records working
exact regex and literal command grants, rejected near misses, an external folder
grant with positive/negative byte checks, and explicit workspace denial. An
overlapping regex Ask/Allow mismatch reproduced twice is separately tracked by
#193, blocked on this evidence ticket; it is not a blocker on every #157 workflow.
The earlier prepared fixture was not located in bounded current scratch/TEMP/
D:/tmp searches; no deletion of that unknown location is claimed. Fresh probe
folders have an explicit audit/cleanup disposition in the native receipt.

Read the dated Ticket 158 section in
`docs/agents/research/harness-experimental-features-20261101.md` and
`docs/agents/research/evidence/agy-permissions-20261102.json`.

## Resolution (2026-11-02)

done: narrow headless agy grants work for tested fixed git/npm/tkt commands and one external folder boundary on1.4.12. Preserved native positive/negative controls and file bytes; no whole-machine confinement claim. Reproduced overlapping regexAsk/Allow mismatch twice, tracked in193 without blocking all157 workflows. Promoted findings/sourceguide/audit/native receipt and reviewed dashboard; recycledownedprobe/filecontrols and16nativehistories, kept6historycontrols only for193. Finalclosed-state dashboard refresh and privatepublication follow.

### Verification
1. ✓ Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented. — "Dated Ticket158 section and 22-case sanitized native receipt recorded, with exact per-case session settings, native parameters/results and file bytes. Independent audit8/10 read all22 raw cases and native histories. Findings distinguish observed passes, reproduced Ask-regex assertion failures, TEMP controls uninformative for confinement, and unverified effective-scope enumeration."
2. ✓ The question above answered yes or no, or listed under "couldn't verify" with what was tried. — "YES: exact regex grants ran git --version, npm test(PASS1/1) and tkt ready, rejected named near-miss/chain; exact literal grants also worked. External folder nested write succeeded with exactbytes and baseline/sibling writes denied; explicitworkspaceDeny preservedBEFORE_T158. Askregex+sameAllow unexpectedly ran twice; separate openfollow-up193 captures diagnosis. BothviewportdashboardtestsPASS and independentUIreceipt a1c462988e7f610ae216c88b8eb5653cf7e9314e7d52880cb42d6fd63bbe56ce accepted. Applicable premerge2/2 and prepush3/3 passed."
3. ✓ Sandbox folders removed after the run; settings changed for the spike restored or recorded. — "Recycled777344-byte privateprobe,98411-bytefixture,41-byteTEMPcontrols,14-byteexternalcontrols and32nativehistorypaths7474074bytes after raw audit. Retained6nativeconversations/12paths2797398bytes only until193closes; exactIDs inreceipt. All22CLIparents waitedtoexit; no recordedagy.exeidentityliveatfinalcheck; sharedbackendnotterminated. ThreeglobalconfigfilesunchangedbySHA256. Earlierpreparedfixturelocationnotfound/no deletionclaimed. Browsermoduleretainedonlythroughfinaldashboardpublication thenrecycle."
