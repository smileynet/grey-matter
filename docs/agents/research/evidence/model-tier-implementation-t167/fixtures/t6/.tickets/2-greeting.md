---
id: "2"
title: "Add the returning-user greeting"
status: open
blocked_by: []
tags: ["stream:fixture"]
---

# Add the returning-user greeting

Touches: `src/b.js`, `test/b.test.js`

Create `src/b.js` exporting one function that returns `"Welcome back, <name>!"` for a name.
Name the function with the project glossary's term for a returning user.

## Acceptance criteria

- [ ] The function is named with the glossary term and returns the greeting, covered by a test.
- [ ] `npm test` passes.
