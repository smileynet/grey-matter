# Ticket 139 dashboard projection scenarios

Date: 2026-11-04

## Contract decision

Preserve complete board coverage while separating current unfinished work from terminal
history. Open, in-progress and backlog tickets belong in the current Plan projection.
Done and cancelled tickets remain visible in an explicitly labelled, searchable Ticket
history namespace, never in current execution flow. This follows the Plan inventory
contract and does not hide or retire terminal tickets. The custom hook's
`plan.currentIds` and `plan.historyIds` express those namespaces; authored order in
each list is preserved. The shipped renderer adds a Ticket history heading above its
existing collapsed Done and Cancelled groups.

## Comparison owner

`check-dashboard.mjs` owns the pre-publication projection comparison for both the
shipped template and custom pages. Without `--repo`, it checks local structure and
the documented custom hook. With `--repo`, it reads `tkt query --all-context`, the
ordered `tkt ready` frontier and current ticket-file bytes; compares every ticket
fact, the complete ID set, frontier and Git blob identity with `gm-tickets`; then
runs read-only `tkt sync-plan --check --strict --brief`. This reuses tkt's full-board
query and plan status/coverage rules. Active tag context is rejected without being
cleared, and neither projection is repaired by the check. No closure hook is added;
the supported sequence remains close → explicit plan sync → snapshot refresh →
publication comparison.

`body_id` is calculated in one `git hash-object --stdin-paths --no-filters` batch
over the current ticket files' bytes. It reflects valid uncommitted edits and is not
derived from HEAD.
It reuses Git's content identity, not a second receipt or hash framework. Existing
review receipts and publication preflight keep their separate source/capture and
publication-integrity roles.

## Custom page migration

An adopter can copy the shipped template and edit its data blocks, or retain a custom
renderer with an `application/json` block named `gm-dashboard-contract`. Version 1
declares ordered views, open ask IDs, entries, overview/history entry IDs,
searchable-history support, the complete ticket snapshot, and current/history Plan
IDs. Overview IDs must be a newest-first prefix of up to five entries; searchable
history IDs contain every entry, including entries also shown in the overview. The
ordinary snapshot CLI writes only `gm-tickets`; custom pages refresh their hook's
ticket facts through exported `authoritativeProjection(projectRoot)`, then safely
serialize the hook JSON while preserving authored current/history ordering. The
checker validates data semantics. It cannot prove the custom page visibly
renders those semantics or that its controls work; a browser/UI check remains separate.
Full-board publication checks must pass `--repo <project-root> --strict`.

## Acceptance scenarios and observed results

| Requirement | Scenario and result |
| --- | --- |
| Custom data hook and contract rules | Synthetic custom page passes; seeded Needs-you order, overview limit, omission of any All entries/history row, terminal-in-current and unfinished-in-history violations fail. Authored current order can differ from snapshot order and is preserved. |
| CLI and custom-renderer boundaries | Local CLI check passes without `--repo`; a dangling final `--repo` now exits 2 with a required-root error. A custom hook with `history-search` and a non-template shell passes without template tablist/`q` selectors; semantics remain covered by the hook and visible interaction proof remains separate. |
| Custom refresh adapter | A refreshed custom hook uses `authoritativeProjection` to replace only ticket facts, safely escapes script-closing text, preserves authored current/history order and passes the `--repo` comparison. |
| Template default and terminal history | Blank template and worked example pass strict checker fixtures; template and example renderer remain byte-identical. Configured overview count accepts 3 and rejects 6; the overview stays capped at five while searchable history retains all entries. Renderer labels terminal groups as Ticket history while retaining collapsed Done/Cancelled groups. |
| Full board, maintained plan and generated projection | Refreshed template snapshot compared against the live checkout: 252 ticket rows, 42 frontier IDs, no current tag context; strict `tkt sync-plan` and `check-dashboard --repo --strict` passed. |
| Authored facts and scoped queries | Seeded status override fails; body identity mismatch and missing row fail. The checker issues explicit `query --all-context`; active `.tickets/.context` fails before tracker calls and its bytes remain unchanged. |
| Stale plan and no repair | A failing strict plan command fails the full comparison. The command is check-only; no sync/fix/closure command is called. The actual current checkout's strict plan check reported `pass (0 finding(s))`. |
| Close-before-refresh workflow | Snapshot refresh writes the complete current tracker projection without running or repairing the plan. The separate `--repo` checker gates publication on strict plan status/coverage. |
| Required projection inputs and source discovery | `--repo` with missing/malformed `gm-tickets` fails even without `--strict`; a malformed `.tickets/140-broken.md` cannot vanish as an empty board. `.tickets/README.md` is explicitly supported as non-ticket Markdown. |
| Receipt amendment | Existing receipt comparison helpers and receipt tests are unchanged; no new receipt/hash store or acceptance waiver is introduced. |

## Verification

- Final `node --test scripts/delivery-dashboard.test.mjs` after standards fixes: PASS,
  56/56, zero skipped; exact output is inventoried in the [worker evidence index](evidence/dashboard-139-20261104/worker-evidence.json).
- Final live snapshot: PASS, `{"tickets":252,"frontier":42}`, output at
  the worker evidence index.
- Final live `check-dashboard.mjs <scratch-dashboard> --repo <this-checkout> --strict`:
  PASS, `ok: true`, no errors or warnings, 252 tickets; output at
  the worker evidence index.
- `tkt sync-plan --check --strict --brief`: PASS, `pass (0 finding(s))`.
- Retained isolated fixture using installed tkt 0.4.0 (`e755765`), imported
  `scripts/test-git-env.mjs` before child calls, and had no remote: open ticket/plan
  passes; changed ticket status to done with stale plan fails and reports the tracker
  finding; synchronized plan with stale dashboard fails on ticket facts/frontier;
  explicit strict plan check and refreshed done snapshot pass; a missing unfinished
  plan row fails; refreshing the restored current row passes; active tag context is
  rejected and its bytes remain unchanged. Complete command records and raw output
  metadata are in the worker evidence index. The first disposable setup attempt exposed
  missing stdout/stderr propagation, corrected before the verified run.
- Measured actual 252-ticket cost: per-file Git hashes took 6.001s for snapshot and
  5.903s for check. The existing Git `hash-object --stdin-paths --no-filters` batch
  seam reduced them to 0.406s and 0.520s, respectively; each result passed. No hash
  framework or dependency was added.
- `node --test scripts/delivery-dashboard-browser.test.mjs`: infrastructure error,
  exit 1 before tests because Playwright is not installed at the script's configured
  Node module path. No package was installed, so browser rendering and interaction remain
  unverified. The raw failure record is identified in the worker evidence index.

Raw records, byte lengths, SHA-256 hashes, and retention terms are maintained in the
[worker evidence index](evidence/dashboard-139-20261104/worker-evidence.json). Raw
fixture trees, logs and the generated dashboard remain privately retained by filename
through queue review; the index contains no copies of those artifacts. The first fixture
attempt exposed missing stdout/stderr propagation, and a later test run exposed two
mocks that did not return a batched hash list. Both failed attempts remain classified
separately from passing evidence.

A previous broad search of a multi-megabyte embedded dashboard exceeded output limits.
That is an infrastructure coverage gap, not evidence that the source content is absent.

## Limits

The hook does not prove custom renderer visibility, accessibility or interactions.
The projection comparison establishes tracker/plan/dashboard consistency, not the truth
of authored narrative, external delivery readiness or visual acceptance. Those remain
under their existing readiness, review-receipt and publication checks.
