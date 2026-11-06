---
id: "118"
title: "Show a complete visual execution queue with one active ticket in serial mode"
status: done
blocked_by: []
validation_criteria:
  - "Template and worked example show all unfinished tickets in a connected dependency diagram with stable execution order"
  - "Seeded serial-WIP, owner, ordering, snapshot, and visual-evidence failures are rejected"
  - "Phone/laptop and offline dashboard checks plus node scripts/gate.mjs pre-merge pass"
tags: ["stream:tooling","kind:enhancement","epic:outcome-orchestration"]
priority: low
assignee: "codex-orchestration-118"
---

# Show a complete visual execution queue with one active ticket in serial mode

## Intent

Sam requested this ticket on October 30, 2026 to incorporate the dashboard practices
learned in Philippines Family Trip into grey-matter. Ticket 100 already delivered
per-ticket visual entries and a Plan tab. This follow-up addresses the later
expectation: an actual connected workflow diagram and an enforceable execution
order, rather than only lists or depth lanes.

## What to build

A person opening the evolving dashboard can see what changed for them, inspect
labeled evidence, and follow the current ticket and next execution steps. Maintain
one durable dashboard and relevant tabs; avoid a new HTML report for every update.

After each completed ticket, publish a ticket-linked entry in plain, neutral
language about what the work lets the user do. Include a labeled visual, mock or
actual capture. Process/research work uses a workflow or benefit visual without
inventing an app feature. Separate implemented, locally tested, distributed and
physically observed outcomes. Captures with synthetic data do not establish
production delivery. Keep private codes, identities and personal content out.

Extend the separate Plan tab to cover every ticket, with unfinished/open work first,
searchable details and completed/deferred work still accessible. Show every
unfinished ticket in a connected dependency graph; diagrams must not silently
omit blocked or deferred prerequisites. Preserve an explicit stable execution
sequence, while prerequisites take precedence. Distinguish dependency edges from
suggested execution order; independent branches are not fabricated dependencies.
Identify current and next work, blockers, status and execution numbers. Support
zoom/scroll, keyboard access, readable narrow screens and ticket-detail links.

In serial mode allow at most one in-progress ticket, with an actionable gate before
claim and after status changes. Return or finish the current ticket before claiming
another. Explicit parallel mode requires distinct named owners for active tickets;
research helpers on the same ticket do not create extra active-ticket ownership.
Make this opt-in/configurable for adopting projects rather than overwriting their
workflow. Keep the existing tracker the source of truth; generate snapshots and
reject stale or incomplete views instead of hand-maintaining a second ticket list.

Verify the relevant dashboard view after each ticket, including offline/local
assets and evidence labels, then open or refresh that same view for the user.
A requested LAN address must actually be reachable from the LAN; a file URL is not
that proof. LAN access and public-internet publication are separate scopes. Do not
silently publish a dashboard publicly or serve private repository directories.

## Context

Read `skills/productivity/delivery-dashboard/SKILL.md`,
`references/dashboard-contract.md` and `assets/dashboard-template.html` in that
skill, its snapshot/check scripts, and `scripts/delivery-dashboard.test.mjs`.
Coordinate with completed ticket 100 and open tickets 89/90 (dashboard adoption and
critics) and 109 (cancelled status); retain their ownership and status semantics.

Pinned source evidence from Philippines Trip commit `b570747`:

- [Execution-order gate and renderer](https://github.com/smileynet/philippines-trip/blob/b570747/tools/update_dashboard.py).
- [Ordering and ownership regressions](https://github.com/smileynet/philippines-trip/blob/b570747/tools/test_dashboard_order.py).
- [Saved execution sequence](https://github.com/smileynet/philippines-trip/blob/b570747/.memory/dashboard-execution-order.json).
- [Worked dashboard](https://github.com/smileynet/philippines-trip/blob/b570747/docs/proposal-dashboard.html).

The repository is private; this ticket contains the required behavior independently
of access to those links. Study patterns rather than copying the project’s large
embedded-art payload or app-specific ordering. Keep evidence assets scoped and
retrievable under the artifact-hygiene guidance.

## Acceptance criteria

- [x] Skill, contract, template and worked example distinguish the connected dependency graph from execution sequence and cover all unfinished tickets.
- [x] Explicit sequence remains stable across status changes while dependencies override position; current and next tickets are visible.
- [x] Opt-in serial mode rejects multiple active tickets; parallel mode rejects missing or duplicate active owners.
- [x] Fixtures reject cycles, missing dependencies, incomplete graph/snapshot, stale snapshots and missing ticket-entry visuals; repaired cases pass.
- [x] Per-ticket entries describe user outcomes with accurate fidelity and delivery limits, including a process/research example.
- [x] Completed, cancelled and deferred tickets remain inspectable with the established tracker semantics; no work is silently marked done.
- [x] Offline, keyboard and phone/laptop checks show readable diagrams and usable ticket details; the relevant same dashboard view is opened/refreshed for the user.
- [x] Reachability guidance distinguishes local-file, LAN and public scope and preserves private content boundaries.
- [x] Applicable dashboard tests and `node scripts/gate.mjs pre-merge` pass.

## October 31 follow-up: bounded inspection

An unrestricted search of the embedded source dashboard produced roughly3.94 million output tokens. Prefer the existing consistency check and metadata-only ticket/queue queries; avoid printing image payloads or full minified lines. The source project now supplies `--summary` and `--ticket ID`, explicitly separate from HTML freshness checks. Extend the existing snapshot/query seam if reusable support is needed; do not copy its large HTML payload. Verify metadata inspection is read-only and excludes bodies/media. #116 owns current-readiness derivation.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain visual execution-flow behavior ownership; #205 owns publication preflight using existing receipt checks. Remaining/deferred tickets must remain visible; no receipt/schema check substitutes for rendered interaction proof.

## Note — 2026-11-04

By: codex-orchestration-118

<!-- tkt-note:v1 61332-1793831690559079600 -->
Parent acceptance held after two candidate rounds. Initial ba2c6b8 claim preflight silently passed with off policy, missing repo and nonexistent ticket; revised247c53b fixes that, focused63/63 PASS and unchanged renderer browser7/7 remains scoped. Parent then observed serial policy with snapshot tickets=[null] throws null.id, while base139 returns structured validation errors. Human ruling requested per orchestrate SKILL two-round rule before another fix round. Worker instructed to hold source edits; no118 integration, push, deployment, closure or publication. Parent repro and raw logs retained with synthetic fixture; durable custody record docs/agents/handoffs/orchestration-custody-20261104.md. Worker syntax check remains infrastructure error from missing yaml; parent integrated gates remain pending. Ticket stays in_progress, not falsely done or dependency-blocked.

## Note — 2026-11-05

By: codex-orchestration-118

<!-- tkt-note:v1 43416-1793837613315643600 -->
Design direction from Sam: include both Focus and Route views plus a DAG-style graph view, rather than choosing only one. Updated the interactive mock with three switchable views over the same8 example tickets. Graph arrows represent prerequisites; selecting a node explains and highlights its prerequisite path. Independent and deferred work stays accessible with explicit counts. Local Chrome check-queue-mock.mjs PASS at1024/390/320 for switching, disclosures,8nodes/4edges, keyboard selection, ancestor highlighting, no overflow/runtime errors. Mock data is illustrative, not native tracker or production evidence. This adds the three-view design requirement; it does not approve another code-fix round or accept/integrate the held118 candidate. Implementation and independent source review remain pending.

## Resolution (2026-11-06)

Implemented Focus, Route and gem-tone DAG in the existing dashboard, repaired malformed snapshot validation, and added opt-in execution preflight. Verified offline local dashboard and keyboard paths. Existing in-app tab refresh was blocked by its file URL policy.

### Verification
1. ✓ Template and worked example show all unfinished tickets in a connected dependency diagram with stable execution order — "Reviewed renderer da3e59a on main e0fee3a. Independent Playwright critic passed Focus, Route and DAG on real and example boards at 1280 and 390 px. node --test --test-timeout=20000 scripts/delivery-dashboard.test.mjs scripts/delivery-dashboard-browser.test.mjs passed 75/75 with full-board fixture. Strict local dashboard check passed all 257 tickets with zero errors or warnings. node scripts/gate.mjs pre-merge --include skill-syntax-fixtures passed 2/2, pre-push 6/6, and node scripts/deploy.mjs --no-agy --no-kirocrew installed 50 skills. See docs/agents/research/t118-execution-workflow.md."
2. ✓ Seeded serial-WIP, owner, ordering, snapshot, and visual-evidence failures are rejected — `node --test scripts/delivery-dashboard.test.mjs` passed 64/64, including structured malformed-row errors, serial and parallel claim checks, stale order and snapshot rejection, and ticket-entry visual validation.
3. ✓ Phone/laptop and offline dashboard checks plus node scripts/gate.mjs pre-merge pass — Full-board Playwright checks passed at 1280px and 390px with offline view switching and visible keyboard focus. `node scripts/gate.mjs pre-merge --include skill-syntax-fixtures` passed both selected checks.
