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
