---
id: "189"
title: "Diagnose: Kiro V3 ACP relay times out after stdin closes"
status: open
blocked_by: ["162"]
validation_criteria:
  - "The EOF teardown failure is reproduced or marked obsolete, separating successful prompt/cancel/load responses from process settlement."
  - "A supported shutdown sequence, fixed version or bounded workaround is verified without discarding sessions or treating a live descendant as settled."
  - "Owned processes, sessions and fixtures have recorded disposition; required checks pass and the driver guidance states the remaining limit."
tags: ["stream:orchestration", "kind:bug"]
---

# Diagnose: Kiro V3 ACP relay times out after stdin closes

## What to build

Diagnose Kiro CLI 2.37.1 V3 ACP teardown after a model-bearing session. In #162,
the native `session/prompt` replies completed, a permission-gated turn returned
`cancelled`, and a new process loaded the same session and recalled the marker.
Both processes nevertheless exited 1 with:

> error: the v3 engine did not exit within 5 seconds after ACP stdin closed

The controller's 60-second timeout did not fire; the captured engine processes
were absent afterward. Treat this as a native teardown infrastructure error,
separate from successful turn/load responses and from model assertion failure.

Intent source: [#162 driver findings](../docs/agents/research/harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02).
Trace the installed relay's supported lifecycle and compare a clean turn,
cancelled permission wait, and explicit advertised shutdown/close methods where
available. Do not assume closing a session merely evicts it: an engine method
may destroy its durable record. Verify own descendant settlement, preserved
session state and exit classification independently. Document a supported
shutdown sequence, fixed upstream version or bounded workaround; do not patch
the installed engine or kill unrelated processes.

#173 may use a live ACP driver without relying on EOF settlement. It must retain
this caveat until the teardown path is qualified; this is not a blanket blocker
on observing a running session.

## Acceptance criteria

- [ ] The EOF teardown failure is reproduced or marked obsolete, separating successful prompt/cancel/load responses from process settlement.
- [ ] A supported shutdown sequence, fixed version or bounded workaround is verified without discarding sessions or treating a live descendant as settled.
- [ ] Owned processes, sessions and fixtures have recorded disposition; required checks pass and the driver guidance states the remaining limit.
