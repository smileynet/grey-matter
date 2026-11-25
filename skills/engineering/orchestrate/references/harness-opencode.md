# OpenCode (V2)

Source: [OpenCode V2 breaking changes](../../../../docs/agents/research/opencode-v2-breaking-changes-20261125.md)
and [harness & model optimization](../../../../docs/agents/research/harness-model-optimization-20261125.md),
observed 2026-11-25 on `opencode` `v2.4.1` (V2). Inspect live agent/subagent schemas
before dispatching workers.

- **Subagent dispatch & permissions:** In V2, the subagent tool is `subagent`
  (renamed from V1's `task`). Define read-only reviewers with explicit V2
  `permissions` arrays denying `edit`, `shell`, and `external_directory` (V2 allows
  `external_directory` by default; V1 used `permission.edit: deny`).
- **Headless runs & model/effort pinning:** Pass `--standalone` in headless scripts
  (`opencode run --standalone ...`) so caller environment variables reach the server
  instead of an existing background daemon. Pin model and effort via
  `-m provider/model#low|high|max` (V2 `#variant` suffix replaces V1 `--variant`).
  Read the model of record from `opencode session export <sessionID>`
  (`messages[].{type: "assistant", model: {providerID, id, variant}}`).
- **Z.ai / GLM-5.4 marathon-thinking guard:** On `zai-coding-plan/glm-5.4` (and
  `glm-5.3`), thinking is mandatory and defaults to `max`. Always bound headless
  calls with an outer `timeout`, pin routine/read-only workers to `#low` (or
  `glm-5.3-flash`), and state explicit stop-reading bounds in worker briefs so the
  model moves promptly from inspection to edits/verification. `glm-5.4` supports
  native multimodal input (`opencode run -f`) for visual verification.
- **Skills, instructions & config:** V2 honors `disable-model-invocation: true`
  (and `metadata.opencode/autoinvoke: false`) and loads user-triggered skills via
  `@skill-id`. `AGENTS.md` vs `CLAUDE.md` is evaluated per directory (`OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1` skips `CLAUDE.md`). Config and skills load at
  session start (no hot-reload).
- **Notifications:** OpenCode has no qualified grey-matter native notification
  adapter. Keep dispatch and recovery records in the main checkout's `.scratch/`
  directory and report through the current conversation.
