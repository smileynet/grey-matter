---
id: "261"
title: "verify-tkt-usage attributes subcommand flags after a global flag to the global scope"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "A fixture with 'tkt --dry-run init --write-nudge both' passes against a tkt that supports init --write-nudge"
  - "A fixture with a genuinely unsupported global flag still fails"
  - "node scripts/verify-tkt-usage.mjs --pack ../tkt reports pass against tkt 0.4.0 (9a10d3a) or names only real gaps"
tags: ["kind:bug", "stream:tooling"]
---
Found in the 2026-11-06 sync. Against tkt 0.4.0 (9a10d3a), `node scripts/verify-tkt-usage.mjs --pack ../tkt` reports `global --write-nudge is not supported` for ../tkt/skills/tkt-core/references/native-hooks.md:6, which reads `tkt --dry-run init --write-nudge both`. `init --write-nudge` is supported (src/commands/init.rs, capabilities.rs). The extractor appears to treat every flag after a leading global flag as global instead of resuming subcommand parsing once it sees the subcommand. False positive, so the tkt pack's audit fails without a real gap. Fix the extractor with fixtures (sync forbids patched temporary checkers as evidence).