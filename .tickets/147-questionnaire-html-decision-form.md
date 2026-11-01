---
id: "147"
title: "to-questionnaire offers an HTML decision form with recommendations and copy-for-chat"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "HTML form option documented"
  - "Recommended answers pre-selected"
  - "Copy produces chat-ready text"
tags: ["stream:tooling", "type:enhancement"]
---

# to-questionnaire offers an HTML decision form with recommendations and copy-for-chat

## Origin

Field report from philippines-trip, 2026-11-01 (prioritization review, location planning and a Codex worktree takeover). Sam asked for these to be filed.

## What worked

A review page with one fieldset per decision (radio options, the recommendation pre-selected and labelled, a notes box) plus a "Copy answers for chat" button let Sam answer 8 and then 5 decisions in one paste. The copied text marks which answers changed from the recommendation. Answered questions were then removed from the page.

## Acceptance criteria

- [ ] to-questionnaire documents an HTML form output beside the Markdown questionnaire, for a recipient who answers back in chat.
- [ ] The form pre-selects and labels recommendations, keeps answers in browser storage only, and copies a numbered plain-text summary (with a fallback when clipboard access is refused).
- [ ] The skill says to remove answered questions after recording them (#146).
