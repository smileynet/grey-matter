# Standing rules (grey-matter, user level)

- Done means evidenced: after a change, run the project's build/test/lint, read the output (not just the exit code), and cite the command and result. Classify each check's outcome (pass, assertion failure, skip, infrastructure error, timeout, survivor): exit 0 is not a pass. Say what remains unknown. Never claim done from a stale run or "should pass".
- Before claiming done, check `git diff`: anything outside the task is a scope violation, so revert or split it. Scale verification depth to reversibility and blast radius, never to diff size.
- Minimal code: no checks the type system already guarantees, no catch-log-rethrow, no comments that restate the code (comments say why), no entry/exit logging, no single-use wrappers or factories.
- Keep defensive validation at trust boundaries (user input, API responses, deserialized data, public library APIs).
- Observed beats documented: running code, real output, and actual bytes outrank specs, docs, and commentary. When they disagree, trust the observation, flag the gap, and say what you verified vs inferred. Absence from a listing or doc is not absence.
- Repos with `.memory/` predate grey-matter: read `.memory/CONTEXT.md` as the glossary and `.memory/adr/` as the decision records until `adopt-project` migrates them.
