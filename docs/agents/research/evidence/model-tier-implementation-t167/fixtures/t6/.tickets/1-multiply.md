---
id: "1"
title: "Add multiply to the arithmetic module"
status: open
blocked_by: []
tags: ["stream:fixture"]
---

# Add multiply to the arithmetic module

Touches: `src/a.js`, `test/a.test.js`

Export `multiply(x, y)` from `src/a.js`, next to `add`.

## Acceptance criteria

- [ ] `multiply(3, 4)` returns 12 and `multiply(-2, 5)` returns -10, each covered by a test.
- [ ] `npm test` passes.
