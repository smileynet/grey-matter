# #118 execution workflow projection

## Behavior

The generated `gm-tickets.executionOrder` is the first-occurrence sequence of ticket IDs in the
ordered tables in `docs/plan.md`. Repeated rows keep the first position; changing a ticket status
does not renumber the sequence. All unfinished tickets remain in the dependency diagram and Plan
list. A ticket missing from the authored sequence is shown in a separate Unscheduled list and is
never silently appended to the suggested sequence.

The horizontal numbered rail is a suggested execution sequence. Its arrows are explicitly labeled
as scheduling preference. The graph's arrows remain actual `blocked_by` edges, so independent work
is never presented as a prerequisite. Current work, the first native-frontier ticket eligible by
sequence and real dependencies, deferred status, unresolved planning gates and true blockers are
shown separately. The graph has keyboard-operable zoom controls and an internal scroll region.

Execution admission is opt-in through `gm-config.executionPolicy.mode` (`off`, `serial` or
`parallel`); absent policy means `off`. The full-board read-only checker rejects multiple active
tickets in serial mode. Parallel mode requires a unique nonempty native `assignee` for each active
ticket. `--claim ID` checks the full board and maintained plan; parallel preflight also takes
`--agent OWNER`. It is not an atomic reservation. Run the actual native claim immediately after a
passing preflight and refresh/recheck after tracker changes. No Git hook, claim mutation, second
owner registry or new dependency edge was added.

## Verification

Observed board inventory at implementation time: 252 tickets total, 60 unfinished, and zero
unfinished tickets absent from the authored plan order. No ticket identities were copied into this
report.

| Check | Result |
| --- | --- |
| `node --test scripts/delivery-dashboard.test.mjs` | Pass, 62/62. Raw log SHA-256: `FE5E5E5FA84B4320F25980F62B5AD7A477ABD5E8886ACDE3598B4E36A80A1347`. |
| `node --test scripts/delivery-dashboard-browser.test.mjs` with local Playwright and Chrome | Pass, 7/7 at 1280px and 390px; includes ticket-detail keyboard navigation, offline-after-load state, a 150% graph zoom with internal scrolling, and unscheduled-ticket separation. Raw log SHA-256: `C2C0F73AEE078107E35D760153EBD8C8EAD8129D18E2EE8302A0A9EB4D81AAD`. |
| `node --check` on both dashboard tests and both dashboard scripts | Pass. |
| `git diff --check` | Pass. |
| `node scripts/skill-syntax.test.mjs` | Infrastructure error: the assigned worktree lacks the `yaml` dependency. No dependency install attempted; parent integration can run the repository gate with its dependency tree. |
| 195px effective CSS viewport comparison | Base: 223px document width with a 207px Plan child. Candidate: 195px document width. This simulates a half-width reflow breakpoint; it is not native browser zoom. Raw comparison SHA-256: `147D958E68357686D09E26B38D51E94CD55896ACBB44D5F4BC0388E6E871EFC4`. |

Local headless captures use synthetic data. Laptop screenshot SHA-256:
`75C715BCA9459F322905F97A206B4A5981FA498EDF9F3774E118E49890F1469E`; phone screenshot:
`BA94E8E254F37D126A597D405277CB97798257CE17204FCDD06D508D5FFECAFD`; 150% zoom laptop:
`3E0B8BF85452778955BAFCFC4115F1B2BEC678BDE7000C307185C1A7069438EE`; 150% zoom phone:
`26D645A68037819F14412D2C34A5D7E88694BAD1A01FA9C4EA9F539059D37A63`. These captures prove the renderer against local fixtures, not the deployed Site, actual user data, physical phones or a user-visible app surface. Parent-owned live dashboard integration and pre-merge gate remain separate.

Earlier failing attempts remain as separate raw logs in the retained ticket-scoped worker evidence family; they exposed and corrected test fixture assumptions, the zoom-control placement, and narrow-width overflow. An intermediate browser run (`browser-9.log`) passed 6/6 before graph zoom controls were added; the final `browser-final-2.log` run passed 7/7 with those controls and supersedes that coverage. The final passing logs above do not erase the earlier records. The 637 KB evidence family includes the attempts, browser captures and small helper scripts; it remains retained under ticket #118 for parent integration and final evidence disposition.

Failure classifications: `unit-1.log` did not parse due to a malformed new test fixture; `unit-2.log`
and `unit-final.log` each had one fixture expectation failure (missing execution-order metadata,
then a missing native-frontier fixture value). `browser-1.log` exposed an unsupported `page.setOffline`
API and an incorrect CSS-zoom simulation; the test now uses `BrowserContext.setOffline` and a
half-width effective viewport, separately from actual graph zoom controls. `browser-2.log` through
`browser-9.log` captured the inherited Plan-panel overflow and its narrow-layout iterations;
`baseline-viewport.log` confirmed the 223px/195px overflow existed at base. `browser-10.log` timed
out because zoom controls were inside a collapsed details element; `browser-11.log` had a test click
count that reached 140% while expecting 150%. Those issues were corrected before the final 7/7 run.
