---
id: "39"
title: "sync skill: pull + re-synchronize + redeploy"
status: done
blocked_by: []
tags: ["meta"]
---

# sync skill: pull + re-synchronize + redeploy

## What to build

TBD

## Acceptance criteria

- [x] TBD

## Resolution (2026-10-20)

done: added skills/meta/sync — inbound twin of release. Pulls current (ff-only, hard-stops on divergence), reconciles ticket-ID collisions via tkt rebase, detects tkt drift (hands to verify-tkt-usage), runs check-repo.mjs, redeploys via install-skills.mjs. Report-don't-gate. Wired into meta/README, compass, CHANGELOG. check-repo green at 41 skills. Committed 6ade781, pushed.
