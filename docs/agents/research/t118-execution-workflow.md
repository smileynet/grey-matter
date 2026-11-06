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

The source branch preserves the original #118 commits and merges current main at `b87eeced`; the
live `docs/status.html` remains parent-owned. Its saved snapshot is currently missing `executionOrder`,
so parent integration must refresh `gm-tickets` before publishing the updated Route view.

## Verification

The read-only snapshot from current main contained 257 tickets, 61 unfinished tickets, 41 frontier
IDs and 172 authored plan IDs; no unfinished ticket was absent from the authored order. The saved
`docs/status.html` projection still has an empty `executionOrder`, so the parent-owned refresh is
required before publication. No ticket identities were copied into this report.

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
