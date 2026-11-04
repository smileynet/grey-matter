---
id: "239"
title: "Keep compatibility audits distinct from parsing and execution errors"
status: done
blocked_by: []
validation_criteria:
  - "Built-in help and backtick-separated prose do not create false command findings; genuine unsupported commands and flags still fail."
  - "Audit execution errors return structured error output with exit 2 and never cache success."
tags: ["stream:tooling", "kind:bug"]
---
# Keep compatibility audits distinct from parsing and execution errors

## What to build

Intent: the 2026-11-03 sync exposed recovery gaps. Update scripts/verify-tkt-usage.mjs under the approved sync improvement plan. Preserve ownership checks and real failure reporting.

## Acceptance criteria

- [x] Built-in help and backtick-separated prose do not create false command findings; genuine unsupported commands and flags still fail.
- [x] Audit execution errors return structured error output with exit 2 and never cache success.

## Resolution (2026-11-04)

done: corrected built-in help and version-comment parsing; audit infrastructure errors are structured and remain distinct from unsupported commands. Regression fixtures and live pack audits passed. Temporary compatibility reports remain session-owned until final sync verification.

### Verification
1. ✓ Built-in help and backtick-separated prose do not create false command findings; genuine unsupported commands and flags still fail. — "node --test scripts/verify-tkt-usage.test.mjs: 6 passed; official live audits: tkt 83 and grey-matter 21 invocations, no findings."
2. ✓ Audit execution errors return structured error output with exit 2 and never cache success. — "Missing executable and crashed help fixtures return structured status:error, exit 2, and do not cache success. Explicit unsupported command remains exit 1."
