# Orchestration dashboard

Open [the offline dashboard](../../orchestration.html). It has two views: findings
with visible evidence limits, and the complete `stream:orchestration` ticket log.
All ticket details start collapsed. Dependency lines reflect `blocked_by`, while
the suggested queue follows the first matching row in `docs/plan.md`.

## Remote access

The [private hosted dashboard](https://orchestration-findings.sambiggins.chatgpt.site)
is available while signed in as its owner. Published through Sites on 2026-11-02;
the native deployment returned `succeeded`, with no failure message.

- Site: `appgprj_6ae8c6a5462481918dbcf580c7fa764e` (reuse; do not create another).
- Pushed Site source: `16e94154ee8622967e0e059950390968459b9f19`.
- Deployment: `appgdep_6ae974d05ff08191952708953639128c`.
- Version: `appgprj_6ae8c6a5462481918dbcf580c7fa764e~appgver_f33b52d3dbf48191a4a34ba18a04bd09`.

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

### Reproducible evaluations (#174 and #199, 2026-11-02)

The latest publication has 14 findings and 35 scoped tickets: 27 done and eight
remaining. The selected runner demonstrated two implementation tasks; its
fixture dashboard is now frozen after preflight detected drift from unrelated
template maintenance. Historical native runs retain their original provenance.
Implementation and review trials are dispatched in separate worktrees, with
independent protocol reviews and serialized model measurements. #189 remains
blocked; ACP research stays last.

Both pages passed actual interaction/overflow checks at 1280×900 and 390×900.
The delivery checker reported 43 entries, 197 tickets and no issues. The critic
inspected all ten final captures and accepted the effort receipt
`49ae91a3f9cad705a4ad09eca65606199e1b4cd8b50b409104ec1326a0af8dcc`
in `evidence/orchestration-dashboard/t199-final/` and delivery receipt
`a2fd2cec280f4fa140d60d7b0b74b7f489e488716c7550a35c6d6dccc73c3fce`
in `evidence/orchestration-dashboard/t199-status-final/`.
Source/captures were committed and pushed as `f4cc882`; selected pre-merge and
pre-push gates passed. Sites returned `succeeded` for the current deployment
above; production browser interaction remains unverified. Audience is unchanged.

Intermediate unpublished captures/receipts (2,744,423 bytes) were recycled after
the final set passed independent review. The successful publication archive
(48,256 bytes) is disposable; keep the reusable browser/helper/Site checkout
through the workstream. The 45,998-byte frozen seed is durable benchmark input,
not a current dashboard template.

### Follow-up findings (#173, #189, #190, #193, #194, 2026-11-02)

The current snapshot has 13 findings and 34 tickets: 25 done and nine remaining.
It distinguishes documented GUI candidates from verified GUI steering, the
bundled KAS callback route from untested vault delivery, and requested models
from served model identity. #189 remains blocked by the observed Kiro shutdown
error; the dashboard does not present its diagnostic work as a fix.

Both widths passed interaction and overflow checks. An independent critic
inspected all ten captures and accepted the effort receipt
`edc42d76dc8db94a5cc438a8a5e6b2b3a14490d5da738a3fe47a9a197036df69`
in `evidence/orchestration-dashboard/t193-t190-t194-final/` and the delivery receipt
`f97fa2e9481513370d7e3e9591e627c3fd98e064219fc6d6985754484a27cdfe`
in `evidence/orchestration-dashboard/t193-t190-t194-status-final/`.
Selected pre-merge and pre-push gates passed before source commit `a0322c4`.
Sites returned `succeeded` for the deployment recorded above; production browser
interaction was not checked. The Site remains owner-private.

The 46,032-byte publication archive is disposable after successful publication.
Keep the browser module, administration helper and Site checkout through this
workstream so later closures can reuse them. Accepted source/capture receipts
are durable evidence. The generated 24,451,674-byte deployment bundle remains
until the next skill deployment.

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

### Kiro monitor and Codex tool-host findings (#161 and #188, 2026-11-02)

Both isolated worker branches passed independent critics before parent
integration and closure: #161 scored 8/10 with limits; #188 scored 0.92/high.
The Kiro run launched a recipe, continued after an input pause and restarted a
failed step. It did not complete or demonstrate isolated worktrees, accepted
review, safe-boundary pause or landing. Approval interaction and inherited
global hooks remain uncertain. The Codex matched executable control ran one
read-only command from the complete installed package; the internal package
path is not a stable launcher guarantee and no durable install repair was made.

The effort dashboard has 12 findings and 34 tickets (13 remaining, 21 done).
Both viewport scenarios passed, and the independent critic accepted receipt
`a1495fabd2a6abb6675ea1fd67dd43625a1ea2598c82c523ba4961cebd834883`
in `evidence/orchestration-dashboard/t161-t188-final/` (five sources, four
captures). The shared `docs/status.html` was also updated with two learning
entries and the full 193-ticket snapshot. Its static checker passed with no
errors/warnings; all three tabs rendered without overflow/script errors at
1280×900 and 390×900. Independent acceptance is recorded in
`evidence/orchestration-dashboard/t161-t188-status-v2/`, receipt
`6ea9c1269c6ba5b0f2f8b7e48dfc3deba4186e2d6b8935fc64a8259b7cb65704`.
The initial capture assertion raced the asynchronous hash navigation; waiting
for selected-tab state fixed that test without changing product code.

The same owner-private Site publication returned pending, then native status
reported succeeded for the exact deployment/version listed above. The returned
production URL is now `https://orchestration-findings.sambiggins.chatgpt.site`;
older URLs in historical notes are not an alias guarantee. Local rendering and
native publication were verified; production browser interaction was not.

Selected parent syntax/doc-link/home-path/coverage gates passed; a private
scratch citation failure was corrected before pushing. Ticket validation passed
with the same seven historical unchecked-acceptance warnings on other tickets.
Owned fixture/raw/private-profile disposal and exact process settlement are in
the promoted receipts. No global trust/configuration or installed binary edit
was made. Promote reports, receipts, independent audits and accepted captures.
Recycle browser module (13,658,899 bytes), publication archive (43,213 bytes),
Site preparation script (837 bytes), status update/capture scripts (2,577/1,465
bytes), and superseded unaccepted capture (91,864 bytes). Retain Site checkout
(471,087 bytes) until next publication. App archival refused the clean managed
#161 worktree (20,653,596 bytes) because another active task uses it, and #188
(20,653,032 bytes) because it is the primary checkout. Keep these recoverable
attachments until host release; no manual deletion bypass. The pre-existing
generated plugin bundle (18,834,184 bytes) and unrelated worktrees were left
untouched. The check-in monitor ends once these reviewed dispatches settle.

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
