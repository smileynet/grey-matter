# Session messaging implementation continuation

The user resumed #179 on 2026-11-03. Existing #208 and #210 remain bounded evidence,
not completion of the cross-harness parent. Capability qualification (#231), spool
recovery (#232), native outcome/dead-letter semantics (#233) and work-context binding
(#234, after #232) have separate source ownership and independent reviews. The
parent retains native canaries, integration and final acceptance mapping.

## Exact retirement and spool recovery (#232)

Accepted worker source: `74347e3b99facf67756f62c18a2b568f6546d859`. Exact retirement
preserves historical records and other registered sessions while refusing retired
routes, wrong hosts and wrong generations. Strict input boundaries prevent a send
from bypassing dedicated reply/completion routing or persisting an unreadable record.

An independent critic first blocked malformed `send.replyTo`, which could poison
later spool reads. The corrected implementation rejects such metadata before
persistence. Parent and critic each observed **23/23 focused tests passing**
(15 spool, eight notification), with no skips or failures. Real child-process exits
before/after atomic rename demonstrate bounded code-path behavior and explicit
ambiguous-lock refusal. They do not establish power-loss safety or native delivery.

The real dispatch preflight passed for the assigned clean worktree, independently
supplied base, exact final candidate and retained independent output. [Raw evidence](evidence/session-messaging-232-20261103.json)
is parent-owned and kept through the #179 final qualification audit or explicit
disposition. Existing historical evidence and unrelated files remain protected.

During the parallel research task, a relative patch path placed two new research
files in the other worker's checkout. The mismatch was detected before acceptance;
the author moved only its own files to its assigned worktree and both locations
were reverified. Worker guidance now requires absolute edit paths as well as an
explicit shell working directory.

## Interface qualification (#231)

The [current cited interface survey](session-messaging-interfaces-20261103.md) and
its evidence index were independently accepted at exact worker candidate
`abaeaf2581c9265664799422d7c123fd6692d600`. Parent dispatch preflight passed and
all fourteen retained version/help/schema captures matched their byte counts and
SHA-256 hashes. Installed Crew source fingerprints were independently checked.
No server launch, message, model call or configuration write is claimed by this
research. Initial review corrected help-output wording and permission scope.

Codex CLI advertises an existing-thread queue, while a successful exit can still
accompany a failed resume. Claude's persistent input and Kiro's ACP are owned-client
interfaces requiring separate native receipt qualification. Crew's installed
0.11.1 messaging tool requires a trusted user-profile grant and Gateway-issued
caller identity; a project profile cannot grant it. The active conductor lacks
that send grant. The existing Antigravity security-hook hold remains. These are
distinct capability/permission states, not a broad claim of product unavailability.

Native qualification is queued in #235 (Codex), #236 (owned Claude stream) and
#237 (owned Kiro ACP), after the shared lifecycle/context work. The native
`session-messaging-supervision` monitor is confirmed ACTIVE for the resumed scope;
it keeps healthy progress quiet and does not stop at a child/batch boundary.

## Bound work context (#234)

Accepted worker candidate `24721eb7148145d950ccdd695c9858fee5053d44` adds optional,
strictly parsed ticket/candidate/handoff context to the immutable message identity.
Candidate state is either not-produced or a full 40/64-character Git object ID;
the parser does not verify that object or referenced file exists. Reply/completion
context inherits when omitted, rejects explicit null or a different ticket, and
can carry a new candidate or handoff for the same work.

Parent and independent critic each observed **29/29 focused tests passing**
(21 spool, eight notification). The pre-change golden v1 hash remains exact,
including byte-preserving replay through a new CLI process. Review caught an
initial 40-through-64 length range; the replacement checks every length 39–65,
admitting only 40 and 64. The real dispatch preflight passed. [Retained context evidence](evidence/session-messaging-234-20261103.json)
has parent ownership through the #179 audit. These fields are caller assertions,
not proof of authorship, authorization, file contents, commit existence or native
delivery.

## Notification lifecycle (#233)

Accepted worker candidate `d7fcaf54dae35ea6945d0a3e49097c67246fbdc4` adds explicit
deadlines, durable attempt-start and outcome attestations, explicit expiry and
correlated spool receipts. Outcome acceptance does not establish delivery. Expiry
records an already available validated receipt before considering a dead letter;
later receipts preserve earlier dead-letter history. Historical v1 intents remain
unknown rather than acquiring a guessed attempt history. No scheduler or automatic
retry is introduced.

Independent review reproduced and blocked false expiry when the spool already
contained a receipt. The corrected candidate passed 17/17 focused tests and the
independent real-clock counterexample. Timing assertions now use a controlled
clock. [Retained lifecycle evidence](evidence/session-messaging-233-20261103.json)
includes the earlier failures as well as final results.

The parent integrates #233 and #234 together before deployment because canonical
core validation must recognize context-bearing messages. The combined suite passes
39/39 tests, including a new preparation-through-receipt cross-module regression.
These are local protocol checks, not native delivery qualification.
