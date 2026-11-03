# Antigravity CLI Ask/Allow overlap diagnosis

**Checked:** 2026-11-02, Windows, installed `agy 1.4.12` (`B4BBCC9F65D355BC84523D4F43E1EAD34992890BAF60C24E4CCBF605E2DA6858`). The session JSON used `toolPermission: request-review`, `agentMode: accept-edits`, `allowNonWorkspaceAccess: false`; each run used `--settings <private JSON>`, `--print`, `--output-format stream-json`, and no skip-permissions or sandbox flag. No shared/global files were changed.

## Finding

The regex Ask/Allow overlap reproduced: `git --version` executed and returned `git version 2.53.0.windows.2` with identical `command(regex:^git --version$)` entries under `allow` and `ask`. The same current-build run with literal Ask `command(git --version)` was denied by the native permission check. A fresh broad Ask `command(*)` control was also denied. Identical regex under `deny` was denied with `Matches user-configured deny rule.` These results support a defect or discrepancy in matching/precedence for the Ask regex case; they do not identify its internal cause.

The native event identifies the attempted tool as `run_command` and the command as `git --version`. The denial text calls its permission subject `unsandboxed "git --version"`; Deny rules written as `command(...)` nevertheless match that subject. This demonstrates a distinction between the tool's displayed permission subject and configured target syntax, but does not establish how the Ask regex is parsed, whether the command is transformed before Ask matching, or which project/shared rules were effective. The recorded #158 receipt says global hashes were unchanged, but explicitly leaves inherited scopes incompletely enumerated.

An Ask rule that causes a headless rejection is not itself proof of matching: unmatched actions also require review and headless mode cannot prompt. Here the literal and broad controls show native rejection; the regex overlap's successful native command is direct evidence of failure to prevent execution. A native init event lists `list_permissions`, but asking the model to invoke it yielded a refusal saying it was unavailable; that is model output, not a native enumeration. No effective-rule listing was obtained.

## Evidence and limitations

Fresh native calls, exact settings, output/error text, CLI identity, and the retained six-history inventory are recorded in [the evidence receipt](evidence/agy-approval-overlap-20261102.json). The prior #158 raw receipt and source guide are cited there as local provenance. The six retained histories remain in the CLI's private store pending independent review; this worker did not inspect, modify, or delete them. The receipt lists their conversation IDs and sizes so the parent can coordinate final disposition after critic clearance.

The observed `unsandboxed` wording does not establish account tier, OS sandbox confinement, or the matching implementation. There was no installed source for the CLI inspected, no effective scope enumeration, and no upstream issue filed. The safe bounded mitigation is to avoid relying on an Ask regex override of an Allow regex: use an explicit matching Deny where blocking is intended, and validate each target with a native result. This is not a general command confinement claim. A sanitized upstream report can be prepared from the receipt; filing it requires separate authorization.
