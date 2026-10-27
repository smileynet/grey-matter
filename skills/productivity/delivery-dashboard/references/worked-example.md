# Worked example

[dashboard-example.html](../assets/dashboard-example.html) is a finished dashboard for a made-up
project, "Trailhead", a weekend hike planner. Open it, then read this page to see why each entry
is written the way it is. Start new dashboards from the blank
[dashboard-template.html](../assets/dashboard-template.html), never from the example.

The example passes `check-dashboard.mjs --strict`. The numbers and screens are invented; the
shapes are the point.

## What to notice on the page

| Where | What it shows |
| --- | --- |
| Needs you | Two open asks from different entries, newest first. Each has a recommended option that is also one of the options, an impact line saying what it decides, and a button that prepares the reply. |
| Latest | The weather entry: outcome headline, two changes, one before-and-after visual, a "Mocked: sample data" label, a try link, and everything technical folded under Details. |
| Earlier | Four collapsed rows. A row carries date, headline, type and a "Needs you" marker when one of its asks is open. |
| All entries | Nine rows, including the four older than the overview. Try searching "daylight" or filtering to Blocked. |

## Entry by entry

| Entry | Kind and fidelity | Why it is written this way |
| --- | --- | --- |
| Weather per day | progress, mocked | Headline says what the person can do. The visual answers "did it change?" with a `compare`. The honest limit (sample data) is in the summary and the rung label. The open ask carries the decision the next step needs. |
| Packing list remembers ticks | shipped, live | A `metrics` visual gives two numbers that matter to the person. The method (closed the app five times) is in Details, not the headline. No asks, so none appear. |
| One trip at a time | decision | A decision is an entry too. `steps` shows where we are. The ask is already `answered`, kept as the record. |
| Offline maps waiting | blocked | Blocked work states the cause in plain words and asks for the one decision that unblocks it. Licence detail and the trail count sit in Details. |
| Tap to add a stop | shipped, live | A real capture (`image`) with alt text and a caption saying what it shows. |
| Daylight, not distance | learning | A finding worth keeping, no visual needed. Not every entry needs one. |
| Sketch a route | progress, mocked | `progress` shows how far along without pretending it is done. |
| How planning will work | progress, wireframe | A wireframe says "nothing built yet" in its summary and its label. |
| First version scope | decision | The oldest entry shows the history tab keeps the starting point. |

## Rewriting for the person

The same events as an agent might first report them, and the version the dashboard wants:

| First draft (process voice) | Dashboard voice |
| --- | --- |
| "Closed ticket 41; refactored plan screen into WeatherRow component; 14 tests added" | "You can check the weather for each day of your trip" |
| "Implemented persistence layer using local storage with debounce" | "Your packing list remembers what you have ticked" |
| "Blocked: tile licence incompatible with bundling; see docs/maps/licensing.md" | "Offline maps are waiting on a choice of map source", plus an ask with a recommendation |
| "Decision recorded in ADR 0007" | "We chose to plan one trip at a time for now" |
| "WIP: route tool 60% done" | "You can sketch a route and see how far it is", with a `progress` visual and a "Mocked" label |

Checks that fail a first draft: it names a ticket, a file, a component or a test count; it
describes what the agent did instead of what the person can now do; it hides the decision the
person must make; it claims "done" for something mocked.

## Where the technical record goes

The weather entry's Details hold "built on the existing plan screen" and "14 of 14 checks pass".
That is enough for a reader who wants evidence and costs the others nothing. Link to the test
output, ticket or commit there if the reader needs to follow it.
