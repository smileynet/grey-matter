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
Install `playwright-core@1.64.1` in a disposable probe directory with npm's
`--ignore-scripts --no-audit --no-fund --save-exact` options, then point
`PLAYWRIGHT_MODULE` at its `index.mjs` entry.

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

Final verification on 2026-11-02: both local-file browser scenarios passed again
after closure (18 remaining / 14 done). All 20 pre-merge and seven pre-push checks
passed after correcting the temporary-path documentation and declaring the manual
browser check. The independent critic accepted the final snapshot recorded in
`evidence/orchestration-dashboard/portable-receipt.json`; the original pre-close
receipt and captures remain as historical evidence. The dependency diagram is
internally scrollable, including on a phone. This is rendered-behavior evidence,
not a usability study or proof of every agent capability.

Artifact disposition: promote both capture sets and small review receipts (about
1.8 MB total). Recycle the owned disposable browser module directory (13,658,897
bytes) and temporary capture backup (914,497 bytes) after final verification.
No browser binary was downloaded. Existing unrelated repository scratch and build
artifacts were left untouched; none are required to open the offline page.

The portable receipt supersedes the first final receipt after normalizing the
manifest's line endings to Git's LF bytes. Source and capture digests are unchanged.
