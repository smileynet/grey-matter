# Ticket 170 preparation audit

**Scope:** preparation commit `2e607a7e1767d55791cccce9046dfacc4655bc8b`.

**Verdict: revise before any native call.** The three tasks and answer key are
synthetic, the six Google/Agy cells are blocked, the provider limits are stated,
and the retained offline run reports 5 tests passed, 3 syntax checks passed,
and a plan-only dry run passed. I verified the frozen protocol, controller,
fixtures, key, test, and envelope hashes against the preparation evidence. No
provider executable was invoked for this audit.

## Required revision: authorize the executed working directory and arguments

The parent authorization binds the complete plan hash at
[`spike-model-task-tier-t170.mjs`](../../../scripts/spike-model-task-tier-t170.mjs),
where `buildCellPlan` chooses a predictable cell-specific path and builds
`plan.argv` with it. During execution, `runCell` instead creates a different
random `mkdtemp` directory and builds a new argv array containing that new path.
The authorization check compares its hash to the original plan; it does not
compare the actual `cwd` and argv with the authorized plan. The bytes sent to a
provider therefore are not the exact plan the parent authorized.

Keep the empty temporary directory and make it unique. Bind the directory and
the exact argv that will be executed into the parent-approved plan, then execute
those same values. At runtime, fail closed if the directory is occupied, is not
an empty ordinary directory, or otherwise differs from the authorized path.
Add an offline regression that drives the execution boundary with a harmless
fake executable and proves the observed process cwd and argv match the
authorization; it must make no provider call. The current 5 tests exercise
plan generation, parsing, and envelope validation, but do not call `runCell` or
prove that authorization covers the actual spawn.

## Review observations

The three frozen fixtures cover the stated text tasks, with four objective
dimensions each. The private key gives concrete expected behavior and
unsupported claims. The protocol correctly limits the result to one run per
cell, reports requested and served identity separately, keeps cost unknown when
native output omits it, and distinguishes task quality from tool-policy and
process failures. The launch plans use explicit argv arrays, hash-pinned
executables, closed stdin, fresh temporary directories, bounded time, and
provider-specific restrictions. The key and raw study evidence remain private.

The binder copies semantic review fields unchanged and verifies their schema,
candidate hashes, dispatch/completion identity equality, and response hash.
Those checks establish consistency of the supplied trace; the retained trace
must still be checked against the actual collaboration dispatch and completion
records during scoring. Its synthetic unit-test trace does not establish that
external provenance on its own.

Before a later native release, the parent should recheck the exact executable
and sibling-host hashes and model availability against the retained current
catalog. The source note explicitly treats the earlier observations as
historical evidence, and no new model or provider call is needed for that
preflight.

## Revisions and acceptance

No native measurement lease is released by this review. After the controller,
test, and protocol are corrected, bind the new exact hashes and route the
changed preparation to a fresh independent critic before any provider call.
