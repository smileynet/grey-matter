# #118 execution workflow projection

## Current implementation

The generated `gm-tickets.executionOrder` contains the first occurrence of each ticket ID in the
ordered tables in `docs/plan.md`. Repeated rows keep their first position; status changes do not
renumber the authored order. The Route view projects this order while placing unfinished
prerequisites first, without changing the plan or inventing `blocked_by` edges. Missing authored
positions remain labeled unsequenced; an older off-mode snapshot without execution order uses
native-frontier markers and labels all other tickets unsequenced.

The Plan flow has three views over one snapshot. Focus shows one selected ticket with immediate
prerequisites and dependents, with an all-ticket picker. Route is a compact numbered list that
wraps on narrow screens and labels actual prerequisite IDs. DAG draws only actual dependency
edges. Selection persists across views, status uses gem-tone accents with text and glyph labels,
and the DAG has keyboard-accessible zoom controls inside its scroll area. A current/next summary
remains visible; ticket details and history remain reachable below.

Execution admission remains opt-in through `gm-config.executionPolicy.mode` (`off`, `serial` or
`parallel`); absent policy means `off`. The full-board read-only checker rejects multiple active
tickets in serial mode. Parallel mode requires a unique nonempty native `assignee` for each active
ticket. Snapshots omit native assignee metadata unless parallel mode is selected. `--claim ID`
checks the full board and maintained plan; parallel preflight also takes `--agent OWNER`. It is not
an atomic reservation. Run the native claim immediately after a passing preflight and refresh or
recheck after tracker changes. No Git hook, claim mutation, second owner registry or new dependency
edge was added.

The source branch preserved the original #118 commits and merged current main at `b87eeced`.
Integration adopted the reviewed renderer in `docs/status.html` and refreshed `gm-tickets` from the
maintained board. The repository dashboard keeps execution policy off by default.

## Verification

Before ticket closure, the refreshed projection contained 257 tickets, 61 unfinished tickets, 41
frontier IDs and 171 authored plan IDs. The parent strict check caught a Markdown alignment divider
in the initial projection. The parser repair and exact fixture removed that spurious ID. No
unfinished ticket was absent from the authored order.

## Integrated review

The independent Playwright critic reviewed `da3e59a37a02d4629e19f44999055b65163ce47d` at
1280px and 390px on the current board and worked example. The critic reproduced hidden Route
details and offscreen keyboard focus after Focus-neighbor and late Route selection. The reviewed
repair places selection details first and moves focus to their visible heading. Route provides a
return control that restores visible focus to the selected row. The critic also verified graph
selection, zoom and reset, status colors and viewport bounds. The exact-pin review, captures and
regression logs remain local under the ticket's retained worker evidence. These browser viewport
checks cover the file dashboard and worked example.

The layout probe used the current full board at phone width to test whether Route could stay
readable with 61 unfinished tickets. The one-column-per-ticket layout was replaced with compact
rows and the Focus picker was constrained to the viewport. The remaining confirmed issues had
direct repairs and browser regressions.

| Integrated check | Result |
| --- | --- |
| `node --test --test-timeout=20000 scripts/delivery-dashboard.test.mjs scripts/delivery-dashboard-browser.test.mjs` with local Playwright, Chrome and the current dashboard | Pass, 75/75. Includes the full board at both widths, offline view switching and the late Route row focus regression. |
| `node skills/productivity/delivery-dashboard/scripts/check-dashboard.mjs docs/status.html --repo . --strict` | Pass, 257 tickets and zero errors or warnings. |
| `node scripts/gate.mjs pre-merge --include skill-syntax-fixtures` | Pass, dashboard contract and syntax fixtures. |

## Earlier worker evidence

| Check | Result |
| --- | --- |
| `node --test scripts/delivery-dashboard.test.mjs` | Pass, 64/64. Covers malformed rows and claim preflight returning structured errors, plan order, policy modes, projection and assignee omission outside parallel mode. Raw log `resume-unit-final-4.log`, SHA-256 `0434FA9B91382A0B8F40266C9ED428E4771207A3A6395CEBDC40EEC029DA41D1`. |
| `node --test scripts/delivery-dashboard-browser.test.mjs` with local Playwright and Chrome | Pass, 11/11 at 1280px and 390px. Exercises Focus, Route, DAG, selection persistence, true dependency labels, unsequenced fallback, keyboard selection, 150% DAG zoom with internal scrolling, and the current 257-ticket snapshot in all views. The actual snapshot view is switched after `BrowserContext.setOffline(true)`. Raw log `resume-browser-final-5.log`, SHA-256 `…`. |
| `node --check` on both dashboard tests and both dashboard scripts; strict checker on template and example | Pass. |
| `git diff --check` | Pass before commit. |
| `node scripts/skill-syntax.test.mjs` | Infrastructure error: `yaml` is not installed in the assigned worktree. No dependency install attempted. Raw log `resume-skill-syntax.log`, SHA-256 `F224217CAE7A151EE28ED5BE5BF415D9906D0274AD5E1D2FA3C58B090E6AA6A5`. Parent owns integrated gates. |

The 390px actual-board captures are local headless observations against the read-only full snapshot,
not the published Site or a physical phone. DAG image `consumer-dag-390.png` SHA-256 `88DE720708CD7D5F58D1D531B2E20CBD39A45BA9831E1ECAC1E4E0FBDEE3D2E8`; Route
`consumer-route-390.png` SHA-256 `9A2CC789C57AAA58722BCAF154AD3949E7004691DF2787762F13E35793F3DFD7`; Focus `consumer-focus-390.png` SHA-256 `F8078A9446B85FC4EF545E626A7B429F29DC2C796ECB6D5715BA30866F6ECD96`. Captures and the
snapshot stay in the private ticket evidence family, not in Git. The browser passed page-width
checks for DAG, Route and Focus. No user-visible app surface or physical-device use is claimed.

Earlier failing attempts and the original #118 evidence remain retained separately; this candidate
does not erase them. The previous candidate's 195px viewport comparison is half-width reflow
simulation, not native zoom, and is historical. The latest 150% check uses the DAG zoom controls.
Earlier `claim-bypass-red.log` still records the CLI exit-0/API `ok:true` defect; the repaired
preflight guard is covered by the current 64/64 suite. The former overflow, zoom-control placement,
selection and fixture failures remain identifiable by their prior raw log filenames. Current
passing logs above supersede their checks without rewriting those records.
