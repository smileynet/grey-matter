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

## Owned process foundation (#238)

Accepted worker candidate `a575e340846c9232c9e86ed61ac1b0f5bdcfbc7a` supplies an
internal process module for the separate native adapters. It verifies a canonical
executable hash, snapshots validated inputs before asynchronous checks, and owns
one exact child handle and generation. Required finite bounds cover input, output,
framing, lifetime and stop; task results remain separate from process exit/close.
No process adoption, descendant kill, provider call or automatic restart is added.

Independent review reproduced a caller-mutation bypass during asynchronous startup.
The corrected snapshot implementation passes that same counterexample. Worker and
critic each observed 12 focused tests passing, zero failures and one explicit
Windows skip for SIGTERM-ignore escalation. The skipped POSIX behavior remains
unverified here. These real local Node child tests do not qualify a native provider.
[Retained evidence](evidence/session-messaging-238-20261103.json) includes the initial
failure, corrected results and exact dispatch binding through the #179 audit.

## Fingerprinted fixed CLI plan (#235 source)

Accepted worker candidate `fe1c7777149fbcb936301b738c7f916aa20291d3` adds canonical
version-3 actions and action fingerprints to preparation and attempt-start, while
preserving version-2 desktop bindings. The CLI plan selects only an exact existing
thread UUID, independently configured executable and literal parent-owned loopback
endpoint. It derives fixed shell-free queue arguments, with no implicit daemon,
resume or automatic retry. Supplied owner PID/generation remain assertions; the
executor must verify the same opaque handle, actual OS listener and executable.

Independent review reproduced a changing-read object that could alter argv after
fingerprint validation. Snapshot-based validation/hash/argument derivation fixes
that exact counterexample. Final worker and critic suites pass 19 intent and ten
queue tests; parent integrated checks are separate. The worker's YAML-fixture
dependency error is infrastructure failure, not a passing check.
[Source evidence](evidence/session-messaging-235-20261103.json) retains both results.
The [earlier desktop native case](session-messaging-desktop-20261103.md) does not
qualify this extension or actual CLI delivery. Native qualification remains open.

## Owned provider protocol modules (#236/#237 source)

Independent critics accepted Claude candidate
`c3a2ff6f0fed1b54f37f6ae995dd393bead5b21d` and Kiro candidate
`582f3c43aa939032ca39b225632da8a4d532ad74`. Both reuse the verified owned-process
foundation and keep native model/session observations separate from process exit.
They provide owned sequential input, not foreign live-chat attachment or busy steering.

Claude's fixed ephemeral invocation disables built-in tools/MCP and requests replay
acknowledgments; exact session and protocol UUID correlate replay, assistant and
terminal records. Review caught the missing replay flag before acceptance; the
corrected six-case synthetic fixture covers that distinction. Kiro negotiates ACP
protocol 1 and an actual owned session, denies client file/terminal/permission
requests, and rejects busy or mismatched input. Review reproduced changing prompt
text and an undefined malformed update; the corrected 12-case suite rejects both.

[Claude source evidence](evidence/session-messaging-236-20261103.json) and
[Kiro source evidence](evidence/session-messaging-237-20261103.json) retain initial
findings, corrected checks and exact dispatch bindings. These are source/protocol
results only. Shared owned-intent binding, real profile/model/receipt qualification
and independent teardown observations still belong to the parent. No provider
process or model was launched by either worker or critic. The accepted #189 shutdown
limitation remains unchanged.

Before deployment, an additional independent startup review blocked both wrappers:
unread stderr stalled a real local child at 64 KiB, below its configured ceiling,
before stdout readiness. Corrective candidate
`5b1f4902e49ab60ea0a593b803d4e346800c6dac` eagerly drains bounded stderr, exposes
private diagnostics without automatic logging and propagates collection failures
through completion. Kiro also exposes actual live owned-process identity and no
longer sends the nonstandard ACP `initialized` notification.

Parent and independent checks use the installed Windows C# compiler to build tiny
fake peers. Claude's eight and Kiro's fourteen cases pass without skips, including
2 MiB of stderr before readiness and typed overflow/cleanup behavior. No provider
executable or model is involved. [Startup evidence](evidence/session-messaging-owned-startup-20261103.json)
preserves the initial deadlock and corrected results. This corrects the held source
integration before publication; it does not add native qualification.
