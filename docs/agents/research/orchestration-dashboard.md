# Orchestration dashboard

Open [the offline dashboard](../../orchestration.html). It has two views: findings
with visible evidence limits, and the complete `stream:orchestration` ticket log.
All ticket details start collapsed. Dependency lines reflect `blocked_by`, while
the suggested queue follows the first matching row in `docs/plan.md`.

## Maintain it

Edit `docs/orchestration-findings.json` for findings and short ticket outcomes.
Keep observations distinct from proposed capabilities and preserve source links.
Run `node scripts/build-orchestration-dashboard.mjs` after changing scoped tickets,
the queue, editorial content or `scripts/assets/orchestration-dashboard.html`.
The builder embeds ticket text safely as JSON; the renderer uses text nodes.
The output needs no server, network connection, or external asset.

## Verification

`node scripts/orchestration-dashboard.test.mjs` uses Playwright Core and an installed
Chrome. Set `PLAYWRIGHT_MODULE` to its module entry and `CHROME_BIN` to the browser
executable when the defaults are unavailable. No browser download is required.
The module can be installed in disposable scratch with `npm install --prefix
.scratch/orchestration-browser --ignore-scripts --no-audit --no-fund --save-exact
playwright-core@1.64.1`.

The test opens the real local file at 1280×900 and 390×900, captures both views,
checks collapsed tickets, keyboard tabs, search, status filters, completed-work
visibility, actual dependency edges, and diagram-to-ticket navigation. It checks
page overflow and browser script errors. Captures live in
`evidence/orchestration-dashboard/`; they show this dashboard, not historical
agent product interfaces. Finding diagrams summarize cited observations.

Initial search assertion failure: searching `187` also found another ticket whose
body referenced that number. The test now checks meaningful inclusion/exclusion
rather than incorrectly expecting full-text search to return one row.

The custom two-tab page follows the user's explicit layout rather than the shared
three-tab renderer. Its dedicated browser test verifies that contract; the stock
three-tab checker is inapplicable.
