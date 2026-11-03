# Orchestration dashboard

Open [the offline dashboard](../../orchestration.html). It has two views: findings
with visible evidence limits, and the complete `stream:orchestration` ticket log.
All ticket details start collapsed. Dependency lines reflect `blocked_by`, while
the suggested queue follows the first matching row in `docs/plan.md`.

## Remote access

The [private hosted dashboard](https://orchestration-findings.sambiggins.chatgpt.site)
is available while signed in as its owner. Published through Sites on 2026-11-03;
the native deployment returned `succeeded`, with no failure message.

- Site: `appgprj_6ae8c6a5462481918dbcf580c7fa764e` (reuse; do not create another).
- Pushed Site source: `407f5fdbcb454c620539b6d4f8cf7b4dcf5f7934`.
- Deployment: `appgdep_6aea4d8141a88191b9536689674ae809`.
- Version: `appgprj_6ae8c6a5462481918dbcf580c7fa764e~appgver_53b61b0310648191aa46e4dae0449599`.

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

### Outcome delivery and bounded native handoff (2026-11-03)

The latest snapshot has **24 findings and 46 effort tickets**: 43 done, one
cancelled, one deferred and the broader messaging parent #179 still in progress.
The new delivery tickets #202–#208 and bounded child #210 are closed with evidence.
The page distinguishes the delivered outcome/role guidance and local safeguards
from the one observed idle-agent native receipt; other harnesses, busy sessions,
crash recovery and native goal persistence remain unqualified. #201 stays deferred.
Global delivery retains four tabs, 63 entries, 209 tickets and zero open asks.

An independent critic viewed all twelve desktop/phone captures and accepted the
[effort receipt](evidence/orchestration-dashboard/t203-205-208-final/review.json)
and [delivery receipt](evidence/orchestration-dashboard/t203-205-208-status-final/review.json).
Interaction checks passed at 1280 and 390 pixels; the dashboard checker reported
no errors or warnings. On owner source `f990f625545d81b5ae9d7166754d4924efc9ba80`,
the publication preflight passed the exact review/check bindings and the known
link-transformed Site payload before native publication. It does not prove archive
or remote bytes; the supported Site helper separately committed/pushed/packaged
source `407f5fdbcb454c620539b6d4f8cf7b4dcf5f7934`.

Sites returned terminal `succeeded` at **2026-11-03T21:09:29Z** for the deployment
listed above. The confirmed owner-only custom audience was preserved, without
groups or visitors. Opening the deployed URL in the Codex panel was queued;
this is not a claim of production browser verification. The published archive
(73,942 bytes) was hash-verified and recycled after success. Existing shared
browser/Site tooling is kept for later dashboard updates. Three task-created
managed worktrees are kept because native archival guards report active-task or
primary-checkout protection; no filesystem removal or override was attempted.
All their ignored scratch was copied and hash-verified first (11 files, 57,318
bytes); recovery evidence and explicit retention conditions are in the
[publication/disposition index](evidence/orchestration-delivery-publication-20261103.json).

Earlier dated sections below describe their historical snapshots, not this latest
ticket count or delivery state.

### Fast-model scope clarified (2026-11-03)

The user meant fast models such as Claude Haiku 5.5 and GPT Luna, rather than
paid fast mode. Existing tier comparisons already cover that intent, with
quality, infrastructure, grading and served-identity limits kept distinct.
Independent scope review found no newly requested comparison goal. Ticket #172
was cancelled as obsolete, not completed; none of its twelve paid-fast-mode
cells ran. Its credit question is answered by the scope correction and retained
in history, without inferring anything about account entitlement.

At that scope-clarification snapshot, the page had 20 findings and 36 scoped tickets: 34 done, one cancelled
and only #189 unfinished. Cancelled work has an explicit label/filter/count
and is absent from the default active diagram. The delivery page has 54 entries,
zero open asks and the existing four-tab decision interface preserved. All 53
earlier entries were retained, with only the former ask's answer and explanatory
detail updated. The old capture helper's three-tab assumption failed, then was
corrected; fresh four-tab checks passed at both viewport widths.

An independent critic inspected all twelve laptop/phone captures and accepted
dedicated receipt `70a068dbf1fcc7cd3379d72477143554cebba81862d3988cd7613f49babd2509`
in `evidence/orchestration-dashboard/t172-model-scope-final/` and delivery receipt
`7dafecc21d6c07a7f93d2474d4a162ffc3e4c04cbdaa19460d1b4c92933d0b4a`
in `evidence/orchestration-dashboard/t172-model-scope-status-final/`. Scope,
snapshots and captures were pushed as `d71bb48`; three explicit pre-merge checks
and all three applicable pre-push checks passed. Native publication succeeded
at 14:48:18 UTC, preserving owner-private access with no failure message.
The packaged cancellation, active count and all 36 ticket links were checked;
production browser interaction was not checked. Supervision remains active
only for the Kiro shutdown condition. The obsolete paid-mode plans must not run.

### Current blocker snapshot (2026-11-03)

That publication included the reconciled plan and then-current fast-mode hold
in ticket #172. Its expanded dashboard description now states that credits
must already be enabled and no fast-mode model calls have run. Completed
writing, effort and ACP work is no longer described as upcoming. Counts remain
20 findings, 36 scoped tickets, 34 done and two unfinished; the delivery page
retains 51 entries and one account-fact question.

Both pages passed fresh Chrome checks at 1280×900 and 390×900, including the
visible #172 hold. An independent critic inspected all ten current captures
and accepted dedicated receipt
`90846fd34a87c1b2b75639c2778c81261d22b0db8c59e7528b233ecb1868b0c0`
in `evidence/orchestration-dashboard/t187-current-blockers-final/` and delivery
receipt `af5f180959e361ed336afd33a0eec28579dfaf31c3ee3c46a178c6b2e9089fee`
in `evidence/orchestration-dashboard/t187-blockers-status-final/`. The first
new assertion incorrectly expected full ticket prose in the compact view;
the existing summary data was updated and the visible hold check then passed.
The superseded capture was recycled. No renderer or style changed.

Plan/ticket notes were pushed as `99871c7`; reviewed UI and captures as
`28cb01c`. The three explicit UI pre-merge checks and all three applicable
pre-push checks passed. Ticket validation passed with 16 existing warnings
outside these edits; they were not silently repaired. The packaged payload,
all 36 ticket links and the durable hold were checked. Native publication
succeeded at 12:35:37 UTC with no failure message and owner-private access
preserved. Production browser interaction was not checked. Supervision remains
active for the user account fact and the upstream Kiro shutdown condition.

### ACP findings (#187, 2026-11-03)

That publication had 20 findings and 36 scoped tickets: 34 done and two
unfinished. It explains ACP's documented communication boundary while keeping
scheduling, isolation and acceptance with the supervisor. The source audit
rechecked official protocol, SDK and MCP sources; no new actionable spike was
recommended. No new native runtime or cost advantage is claimed.

Both pages passed Chrome checks at 1280×900 and 390×900. The delivery checker
reported 51 entries, 198 tickets, one open account-fact question and no errors
or warnings; all 50 earlier entries were preserved exactly. An independent
critic inspected all ten captures and accepted dedicated receipt
`b785207c78dc94459c7511376f6c2ccdc795d98bc48251810511657ea37d6d0c`
in `evidence/orchestration-dashboard/t187-final/` and delivery receipt
`cabc50ed1dd54bdcaf94a452f772cf4324909a283495c0629413cb105388c8f5`
in `evidence/orchestration-dashboard/t187-status-final/`. Source and captures
were pushed as `3b7ee93`; three explicit pre-merge checks and all three
applicable pre-push checks passed. Research document checks passed after the
reviewed local citation fix; closure is `aa46d7c`.

The packaged page's 20 findings, 34 done tickets and all 36 repository-root
ticket links were checked. Native publication succeeded at 12:24:56 UTC with
no failure message and the owner-private audience preserved. Production
browser interaction was not checked. Only the fast-mode account fact and the
upstream Kiro shutdown issue remain; supervision stays active for those blockers.

### Effort findings (#171, 2026-11-03)

That publication had 19 findings and 36 scoped tickets: 33 done and three
unfinished. It retains effort defaults because one valid review and ten
unscorable reviews cannot establish an effort-level advantage. The delivery
page has 50 entries and one open account-fact question for the fast-mode trial;
all 49 earlier entries were preserved exactly. Answering does not enable credits.

Both pages passed Chrome checks at 1280×900 and 390×900. An independent critic
inspected all ten current captures and accepted dedicated receipt
`93cd16ce679423df25c1530c37a6af675e1dfa73d0aa0ad2fdc57011e97175fc`
in `evidence/orchestration-dashboard/t171-final/` and delivery receipt
`12b3d87582094cabaf7a1a59ba7c4a7ba2ace487198b00326a78376f38f2650f`
in `evidence/orchestration-dashboard/t171-status-final-valid/`. The checker
reported no errors or warnings after the question's missing ID was corrected;
superseded captures were recycled. Reviewed source and captures were pushed
as `3d14b17`, with three explicit pre-merge checks and all three applicable
pre-push checks passing. Model integration at `1ec7cb8` passed 23 pre-merge
checks with the same two documented baseline exceptions and seven pre-push
checks. Final cleanup metadata is `258b1d8`; ticket closure is `df11d6a`.

All 36 hosted ticket links and the packaged 19-finding/33-done payload were
checked. Native publication succeeded at 12:09:03 UTC with no failure message;
the owner-private audience was preserved. Production browser interaction was
not checked. Fast mode still awaits the account fact, the Kiro shutdown issue
remains upstream-blocked, and ACP research stays last. Supervision remains active.

### Text-task findings (#170, 2026-11-03)

That publication had 18 findings and 36 scoped tickets: 32 done and four
unfinished. It explains why current defaults remain: every profile passed the
rewrite, one passed triage and none passed classification. No profile passed
all three tasks. The delivery page has 49 entries; all 48 earlier entries were
preserved exactly. Writing-trial evidence, costs and review-provenance limits
remain under details and source links.

Both pages passed Chrome checks at 1280×900 and 390×900. An independent critic
inspected all ten current captures and accepted dedicated receipt
`5c8fc37e7c368647f8b3d180c2ccf2eac174abc11eb127ce34ffef6880b76751`
in `evidence/orchestration-dashboard/t170-final/` and delivery receipt
`c4c6f93eddd4f53690c41ccb9499ae891dac7a86a88a2f3d8ea27e137f591298`
in `evidence/orchestration-dashboard/t170-status-final/`. Source and captures
were pushed as `71b06f0`; three explicitly selected pre-merge checks and all
three applicable pre-push checks passed. The model integration at `7ea5758`
passed 22 pre-merge checks with the same two documented baseline exceptions,
and seven pre-push checks. Ticket closure is `d6407c9`.

The packaged page's 18 findings, 32 done tickets and all 36 repository-root
ticket links were checked. Native publication succeeded at 11:45:39 UTC with
no failure message and the owner-private audience preserved. Production browser
interaction was not checked. The reusable Site checkout and trial-private
evidence remain retained through the remaining workstream.

### Model-tier findings (#167–169, 2026-11-03)

That publication had 17 findings and 36 scoped tickets: 31 done and five
unfinished. Implementation, review and research findings retain configured
defaults; none qualifies a cheaper model for adoption. Writing, effort and fast
mode are in progress; the Kiro shutdown issue remains blocked and ACP research
stays last. The ticket snapshot includes all three newly claimed trial tickets.

Both pages passed actual Chrome interaction and overflow checks at 1280×900 and
390×900. The delivery checker reported 48 entries, 198 tickets, no open asks,
and no errors or warnings. All 45 earlier delivery entries were preserved.
The shared plan renderer now visibly explains sideways scrolling; a phone check
moved the diagram 448 pixels without document overflow. An independent critic
inspected all eleven final captures and accepted receipt
`f7eb46d2b020e094ec5efdd1877e404f9346a969a2ded146c2fc69e108687372`
in `evidence/orchestration-dashboard/t167-169-queue-final/` and receipt
`3f2eda3b2fd9b9176f9a36a596ccd497fe8cf1bc776af3da61d3a55401d57a07`
in `evidence/orchestration-dashboard/t167-169-status-queue-final/`.
Source and final queue captures were pushed as `3507ba5`; its scoped pre-merge
checks passed 3/3 and pre-push passed 6/6, with no skips. The earlier model-code
integration used 21 passing checks and two documented unchanged-origin baseline
exceptions; their unknown coverage is retained in the
[verification receipt](evidence/orchestration-gate-baseline-20261103.json).

The Site's ticket links now resolve from the repository root; all 36 targets and
the 17-card/31-done payload were checked in the packaged output. The native
deployment returned `succeeded` at 10:41:45 UTC, preserving the owner-private
audience. Production browser interaction was not checked. The 53,755-byte
publication archive was recycled after success and verified absent. The superseded phone review
captures (1,458,070 bytes) were recycled; reviewed earlier snapshots remain in
Git. Keep the reusable browser, Site checkout and trial-private evidence through
the remaining workstream.

### Complete frozen setup (#200, 2026-11-02)

That publication had 14 findings and 36 scoped tickets: 28 done and eight
remaining. The evaluation now assembles all fifteen seed files without live
tooling or templates. This is setup verification; the ongoing model trials have
not yet produced accepted recommendations at that point.

Both pages passed interaction and overflow checks at laptop and phone widths.
The static delivery check reported 44 entries, 198 tickets and no issues. An
independent critic inspected all ten captures and accepted receipt
`a3154fd4505bbd5b0f3abdabb7f6d5ecff0f43a9ed4ddebe9fd080d93c3f0640`
in `evidence/orchestration-dashboard/t200-final/` and receipt
`2116c39fa241e62da21970024791595d51b5481cf8751797602f9750465c695a`
in `evidence/orchestration-dashboard/t200-status-final/`.
Source/captures were pushed as `3c24f83`; selected repository gates passed.
Sites returned `succeeded` for the current deployment above, with its owner-private
audience preserved. Production browser interaction was not checked.

Keep the frozen 8,779-byte seed manifest and existing dashboard snapshot in Git.
The parent's setup probe fixture (117,299 bytes) and helper (559 bytes) were
recycled after review. The 49,771-byte successful publication archive is
disposable. Reuse the browser/helper/Site checkout through the workstream;
the model workers' private raw runs and sessions remain for independent audit.

### Reproducible evaluations (#174 and #199, 2026-11-02)

That publication had 14 findings and 35 scoped tickets: 27 done and eight
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

## Accepted Kiro limitation and deferred repair (2026-11-03)

At the user's request, #189 is closed with the known native shutdown limitation
and a required [workflow workaround](../../../skills/engineering/orchestrate/references/harness-kiro.md#v3-acp-shutdown-workaround).
This separates task acceptance from teardown, prevents duplicate retries based
only on the known signature, requires bounded owned-process observation, and
preserves session state. Graceful unattended shutdown remains unqualified.
Low-priority #201 is intentionally backlog work until higher-priority work is
finished. Existing evidence and four model-bearing sessions remain parent-owned
and retained for its investigation, not released by #189's closure.

The published dashboard has 21 findings and 37 scoped tickets: 35 done, one
cancelled and one deferred, with no active orchestration dispatch. The default
diagram includes the deferred follow-up. Global status retains all four tabs,
55 entries, 199 tickets across all streams, and no current user ask.

Independent review accepted the exact procedure commit
`4bc0c2224f5def6ef6590b1113ec29034871c5b0` and the current
[dedicated dashboard receipt](evidence/orchestration-dashboard/t189-closure-final2/receipt.json)
and [global dashboard receipt](evidence/orchestration-dashboard/t189-closure-status-final/receipt.json).
All twelve current phone/laptop captures were inspected. The first dedicated
capture set is superseded history after final plan ordering changed; it does not
cover the published source.

Verification classifications: `node scripts/gate.mjs pre-merge` passed the
procedure's selected ticket-graph check (1/1); dashboard-only commits selected
zero pre-merge checks (skip, no applicable checks). `pre-push` passed the
procedure's five selected checks and the dashboard's three selected checks.
`node scripts/orchestration-dashboard.test.mjs` passed interaction checks at
1280 and 390 pixels; global four-tab captures passed without script errors or
horizontal overflow. The global dashboard checker passed with no warnings.
Both current review-receipt checks passed; `tkt sync-plan --check` passed.
`tkt validate --brief` reported pass with 16 pre-existing corpus warnings, so
this is not a warning-free whole-board audit. No new native/model probe ran.
`node scripts/deploy.mjs --no-agy` installed 50 skills; Agy remains excluded.

Sites returned terminal `succeeded` at 2026-11-03T15:33:51Z for historical source
`f981bbf4f3f019dd79a505e9cfea3dca704af233`, deployment
`appgdep_6ae9fed6e79c8191b9e5f8827b71af26`. Owner-only access was confirmed before publication
and preserved. Packaged checks verified all 37 source-ticket links target the
repository root. Native deployment success does not substitute for production
browser or accessibility testing. Current screenshots and receipts are promoted
durable evidence; disposable preparation scripts and the deployment archive are
recycled after publication. Shared browser/Site tooling remains retained for
future dashboard updates. The earlier supervision job was observed absent;
no background monitor is scheduled for the deferred investigation.
