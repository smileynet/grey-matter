# #166 Standards review

Publication copy: ephemeral locators are replaced by durable references here; original private reviews are retained. Verdict and limits are unchanged.

## Risks recorded before inspecting the candidate diff

- Use `versions.json` as a version reference but distinguish it from current
  observations; never silently rewrite the baseline when a live version differs.
- Preserve the Agy execution hold and do not make model/API calls. Changed
  examples must be checked only with no-model help output and must not bypass
  current security or approval holds.
- Keep Codex's observed PATH executable distinct from package provenance;
  path/version output alone cannot prove which installation mechanism owns it.
- Preserve Kiro profile approval caveats and limits on grammar-only help probes;
  do not imply a live permission prompt or runtime behavior was tested.
- Keep Crush user-rules path explicitly unverified. Avoid extrapolating install
  paths, discovery, or runtime behavior from current CLI identity alone.
- Limit changes to the overview and ticket-specific research report; changed
  examples should be syntactically supported by observed help output, and prose
  should clearly separate fact, inference and unknown.
- Distinguish documentation check outcomes from pre-push gate status; the
  review must not claim checks it did not run or observe.

## Final review

**Verdict: PASS — no material Standards finding.** Reviewed candidate
`6c2a78396e4df54f87f2e12c0a509dd406261186` against base
`896657e32126f68a3b0abda5bf96b5095c9b9638`, limited to
`docs/agents/harnesses.md` and
`docs/agents/research/t166-harness-overview-refresh.md`.

### Evidence

- The overview calls Codex's path a PATH resolution and explicitly says package
  versus copied provenance is unknown. The worker report distinguishes the live
  version from the manifest's vendored first candidate. It records the live
  version outputs for Codex (`codex-cli 0.166.0`), Claude Code (`2.1.316`),
  Kiro (`2.37.1`) and Crush (`v0.93.1`) and explicitly leaves Agy unprobed.
  Kiro's 2.37.1 versus 2.37.0 manifest/reference gap and the Crush user-rules
  path uncertainty are visible, not silently reconciled.
- `versions.json` remains unchanged. The Agy row identifies 1.4.12 as
  last-recorded and says it was not re-probed because execution is on hold; prior
  Agy behavior is labeled by its probe version. The user-level rules table's
  “installed” label has local path-presence support for both Agy and Crush, while
  the rules path remains unverified.
- Read the bound no-model logs for Codex exec help, Claude help and plugin help,
  Kiro chat help, and Crush run help. Their reported flags/subcommand are
  present; the evidence does not claim these help probes establish runtime
  behavior. No prompt/model or Agy command was run for this review.
- The updated examples remove the Agy permission-bypass command, stop passing
  Kiro's trust-all flag, and use Codex `--sandbox read-only`; the prose makes
  existing Kiro profile approval uncertainty explicit. The Codex containment
  discussion now rejects disabling sandbox/approval as a fallback. Windows
  Claude examples consistently use `claude.exe`, including the local
  plugin-details command.
- The targeted changes are within the two authorized files. The research report
  is a compact, appropriately located agent-facing evidence note and keeps
  grammar-only qualification separate from runtime/discovery claims.

### Verification and limits

The dispatch packet reports documentation consistency and committed-diff checks
as PASS and all five changed help qualifications as exit 0 with no model
execution. Its worker syntax check is an infrastructure error because `yaml`
is absent in that worktree; parent owns the integrated syntax check. The worker
did not run `node scripts/gate.mjs pre-push`; the parent owns that integrated
gate. I did not rerun checks.

This review does not establish Codex installation provenance, Kiro runtime
permissions or updated reference grammar, Crush user-level rules discovery,
current Agy version/behavior, or any model/runtime behavior. No source,
ticket, Git or external state was changed.
