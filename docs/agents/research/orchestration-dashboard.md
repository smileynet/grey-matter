# Orchestration dashboard

Open [the offline dashboard](../../orchestration.html). It has two views: findings
with visible evidence limits, and the complete `stream:orchestration` ticket log.
All ticket details start collapsed. Dependency lines reflect `blocked_by`, while
the suggested queue follows the first matching row in `docs/plan.md`.

## Remote access

The [private hosted dashboard](https://orchestration-findings.honestriver130.chatgpt.site)
is available while signed in as its owner. Published through Sites on 2026-11-02;
the native deployment returned `succeeded`, with no failure message.

- Site: `appgprj_6ae8c6a5462481918dbcf580c7fa764e` (reuse; do not create another).
- Pushed Site source: `09937a0f2577453f4430ff99fb237d30a54c7e4f`.
- Deployment: `appgdep_6ae8c6fe17288191bb85cf2fdd19544a`.
- Version: `appgprj_6ae8c6a5462481918dbcf580c7fa764e~appgver_347159afd8e881919113db1b0d7b73c6`.

The hosted page preserves the reviewed UI and embeds the same findings/tickets;
its evidence and source links target GitHub so they work remotely. This is a
published snapshot; later local ticket changes need republication. No audience
change was made. Source is retained in Sites' repository and can be reopened with
the source helper using a new write credential for the same Site. The small local
Site checkout is retained until its next update; packaging output and preparation
script are recycled after successful publication. Initial packaging failed because
GNU tar interpreted the Windows drive prefix as a remote host; rerunning with
Windows System32 first on the child process PATH succeeded. No plugin code changed.

## Maintain it

The historical #156 update had seven findings, two unproven
possibilities, 17 open and 15 completed tickets. Native Sites publication returned
`succeeded` for source `120e4e9e2375b05846541c69f00122b21e83d156`, deployment
`appgdep_6ae8ccbd32448191a570f96cd998522d`, version
`appgprj_6ae8c6a5462481918dbcf580c7fa764e~appgver_eda12d11b0f08191b33fe03e267914c0`.
The final reviewed local captures and accepted receipt are in
`evidence/orchestration-dashboard/t156-final/`. The hosted copy changes repository
link targets only; production publication is verified by Sites, while rendered
interaction checks cover the local copy at laptop and phone widths.

The #158 update is now live at the same private URL: eight findings, two unproven
possibilities, 17 open and 16 completed tickets. The new #193 follow-up is in the
queue before the final ACP research ticket. Sites returned `succeeded` for source
`64629ed997d7c3e759066f3f23cada064ed2afd3`, deployment
`appgdep_6ae8d373351c8191b9b5c6ca4c382104`, version
`appgprj_6ae8c6a5462481918dbcf580c7fa764e~appgver_826638958078819191aeb8cbe1101988`.
Accepted local captures and the final receipt are in
`evidence/orchestration-dashboard/t158-final/`. The same link-target-only hosting
transformation and local-versus-production verification boundary apply.

After the #158 publication, the stale broad-command recommendation in the
Antigravity reference was replaced by the tested narrow controls and the Ask
overlap limit. `node scripts/deploy.mjs` refreshed 50 skills and passed native
plugin validation with the existing generic-icon notice. The generated bundle
(14,971,048 bytes) is retained for the installed pack until the next deployment.
The disposable browser module (13,658,897 bytes), publication archive (38,979
bytes), and preparation script (1,063 bytes) were recycled. The three probe
configuration files still matched their pre-probe hashes after deployment.

### Native workflow finding (#157, 2026-11-02)

The current published dashboard has 34 scoped tickets (17 remaining, 17 done)
and nine findings. The new partial finding shows typed jobs in separate
worktrees, a scripted question/answer continuation and outside review/merge;
per-role model selection remains unresolved in #194. The dated source report,
20-case receipt and independent audit distinguish those limits.

Both local-file browser scenarios passed at 1280×900 and 390×900 after closure.
The independent critic accepted final source/captures in
`evidence/orchestration-dashboard/t157-final-v2/`, receipt
`7d9053cebcda5e48a3bb621833205de78474c2d4013c9a4e0766d0b625166486`.
Preclose evidence remains historical; the superseded unaccepted first final
captures (1,094,010 bytes) were recycled. The final receipt binds five sources
and four captures. `tkt validate --brief` passed with seven existing
unchecked-acceptance warnings on other closed tickets; none concerns #157.

The same owner-private Site was updated from pushed source
`f53c49ce831ad6c4457bb789fd6f5f962cbccaa0`. Native publication succeeded as
deployment `appgdep_6ae8e545469c8191bd9187a44e184522`, version
`appgprj_6ae8c6a5462481918dbcf580c7fa764e~appgver_3a9e9036e8788191b4049bc037fe80aa`.
The hosting transformation changes local evidence links to GitHub links only.
Local rendering and native deployment success were verified; a production
browser interaction pass was not performed. Opening the URL in Codex was queued.

Artifact disposition: promote the report, sanitized tool evidence, audit and
accepted capture sets. Fixture/worktree/probe disposal and retained model-control
histories are recorded in `evidence/agy-workflows-20261102.json`. Retain the Site
checkout (358,812 bytes) until the next update. Recycle the disposable browser
module (13,658,899 bytes), publication archive (40,471 bytes), preparation script
(902 bytes) and cleanup script (3,723 bytes) after publication. The pre-existing
generated `dist/agy-plugin` (16,464,451 bytes at this check) was left untouched;
this ticket changes research and the effort dashboard, not distributed skills.

### Supervised dispatch findings (#159 and #160, 2026-11-02)

Both isolated worker reports passed separate independent critics (0.92/high),
were integrated by the parent, and closed through tkt with evidence. Codex
process feature toggles are confirmed; its native dispatch/wake behavior remains
unverified behind the missing companion host. Claude confirmed one same-machine
message/reply/idle exchange; fixture background dispatch and worktree creation
were trust-blocked. Neither report treats an idle notice or exit zero as accepted
ticket output. Settings snapshots do not establish before/after equality.

The effort dashboard now has 34 tickets (15 remaining, 19 done), ten findings,
and the existing two-tab layout. Local browser checks passed both viewport
sizes and all interactions. The independent dashboard critic accepted receipt
`804ae2a01ff7a77ddc18dc9a28f428d88f48ba17ed9c24f3e3ffa1f3a0039515`
in `evidence/orchestration-dashboard/t159-t160-final/` (five sources, four
captures). Updating the plan did not change the rendered HTML hash; receipt
verification still accepted the exact sources. Parent syntax fixtures and
selected pre-push checks passed. The initial audit path-normalization failures
were corrected and rerun; the worker's missing-yaml syntax infrastructure error
was superseded by the passing parent run. Ticket validation passed with the
same seven historical unchecked-acceptance warnings on other closed tickets.

The existing owner-private Site publication succeeded from pushed source
`cacaa192133d83825478cbb0a0a796987b5c62c1`: deployment
`appgdep_6ae8f07cf72081918b15ba24bffff1a1`, version
`appgprj_6ae8c6a5462481918dbcf580c7fa764e~appgver_558d846660508191868487d0f201d745`.
Only evidence-link targets differ in the hosted copy. Local browser behavior and
native deployment success were verified; production browser interaction was not.

Promote the reports, native receipts, companion audits and accepted captures.
Both receipts record exact fixture/raw disposal. Claude's owned marker session
was stopped and removed before cleanup; Codex's exact saved record was recycled.
Recycle the disposable browser module (13,658,899 bytes), publication archive
(41,599 bytes) and preparation script (837 bytes). Retain the Site checkout
(413,245 bytes) until its next update. App archival refused the two clean managed
worker checkouts: #159 (19,337,323 bytes) is still referenced by an active task;
#160 (19,367,661 bytes) is the task's primary checkout. Keep these recoverable
attachments until the host releases them; do not bypass the refusal with manual
deletion. The pre-existing generated plugin bundle (17,579,656 bytes), other
worktrees, and another session's plan/status edits were left untouched. Only
the orchestration plan hunks were selected into the parent commit.

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
Set `DASHBOARD_CAPTURE_DIR` to a fresh ticket/attempt evidence folder to preserve
earlier accepted capture bytes. Create a new manifest and receipt for each update.

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
