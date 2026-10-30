---
id: "110"
title: "Keep agent footprint bounded while work runs, not only at ticket close"
status: backlog
blocked_by: []
priority: medium
validation_criteria:
  - "global/AGENTS.md carries the three footprint lines and stays under the 3,072 B budget; node scripts/check-guidance.mjs and node scripts/install-agents-md.mjs (dry run) show only that change."
  - "repository-artifact-hygiene has a While you work section and a description trigger for tasks that create over about 500 MiB; no second skill states the rule."
  - "scripts/inspect-footprint.mjs reports size, owning ticket status, exact-path citations with a keep list, hard links and open files; its fixture test goes red on each seeded problem and green once clean."
  - "A citation that appears after the list was made turns a removal into a 'keep list changed' result."
  - "conformance-audit flags a pytest project with no tmp_path_retention_policy and tracked manifests that cite .scratch paths."
  - "orient prints free space and, under 40 GiB, the three largest uncommitted footprints."
  - "node scripts/check-repo.mjs passes."
tags: ["type:feature", "stream:tooling"]
---

# Keep agent footprint bounded while work runs, not only at ticket close

## What to build

Implement [proposal 16](../docs/agents/proposals/16-agent-footprint-guardrails.md) after its
decisions are made. Ticket 97's close rule stays the owner of the retention policy; this adds the
rule at the time of creation, the read-only inspector, the always-on lines, and the checks for
adopted repos.

## Context

During 2026-10-23 to 2026-10-30 one Mac received 166 GiB of new files, 69 GiB of them in code
folders, and free space fell to 0.18 GiB while tickets were still open. The close rule alone cannot
help while a ticket is open. See the proposal's evidence section.
