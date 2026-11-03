---
id: "3"
title: "Rename add to sum"
status: open
blocked_by: []
tags: ["stream:fixture"]
---

# Rename add to sum

Touches: `src/a.js`, `test/a.test.js`

Rename the exported `add` in `src/a.js` to `sum` and update its tests.

## Acceptance criteria

- [ ] `src/a.js` exports `sum` and no longer exports `add`.
- [ ] `npm test` passes.
