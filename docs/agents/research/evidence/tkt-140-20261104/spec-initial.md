# Independent Spec review: #140

## Expectations

See `t140-spec-risks.md`, written from the complete ticket before reviewing the
candidate.

## Verdict: BLOCK — ticket link bookkeeping remains open

The exact candidate report at
`D:/.codex/worktrees/tkt-140-continuation/grey-matter/docs/agents/research/tkt-140-staged-mutation-recheck.md`
matches candidate `363005aa69301c55cbed3ba79bf3ac467ecc2370`. Its cited raw
packet is present at `.scratch/t140/reproduction.json`, 35,309 bytes, SHA-256
`27f0e45550f1b81861143b60724819edd60b62ae26d356413558925060b86e2e`.
The installed tkt binary hash and version match the report. All four recorded
fixture mutations exited zero; their commits contain only the ticket path, the
unrelated file remains staged, and recomputing each recorded index SHA from its
base64 index bytes matches. The six final fixture directories still exist.

The same packet shows query JSON returning both tags and a single comma-bearing
validation criterion for the tested one-argument `new` and `edit` cases. It does
not test other repeatable-argument forms, so the report correctly limits the
comma finding. Tkt #235 (done) covers ticket-only mutation commits, deferred
push, and the consumer-hook boundary; #231 (done) covers query tags; #43 (done)
records expected mutation latency. This supports treating the old staged/tag
reports as superseded and the comma claim as unreproduced. It does not establish
a new independent latency measurement.

However, #140's third criterion says the upstream items must be linked **here**.
The main `.tickets/140-tkt-commits-sweep-staged-work.md` still contains no
disposition linking #235, #231 and #43 or the research report. The candidate
report's ticket numbers alone do not update that tracker record. Before closing,
the parent should add a dated tkt note or equivalent durable resolution record
with the links and mark the unreproduced comma claim accordingly. No duplicate
upstream issue should be filed for a behavior that the bounded fixture did not
reproduce.

No candidate-source defect found. This review does not establish push latency,
repeatable `--validation` edge cases, or performance under another consumer's
hooks. No source, tracker or Git state was changed by this reviewer.
