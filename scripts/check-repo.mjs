#!/usr/bin/env node
// check-repo.mjs — the one repository-consistency command (ticket 31).
//
// Runs every mechanical invariant the skill-distribution contract depends on, in one
// place, and exits nonzero if any fails. Intended for a maintainer before a release or
// distribution change, and callable from CI.
//
// Invariants checked:
//   1. installer ownership safety  -> scripts/install-skills.test.mjs  (node:test)
//   2. invocation sidecars/README  -> scripts/check-invocation-policy.mjs
//   3. doc indexes + links         -> scripts/check-docs-consistency.mjs
//   4. ticket health               -> tkt validate   (skipped w/ warning if tkt absent)
//
// Design (AC-driven):
//  - READ-ONLY on user state. The installer test uses throwaway temp roots (mkdtemp),
//    never a real harness skill root; the other checks only read files + the filesystem.
//  - NO harness authentication required (AC4): everything runs offline against the repo;
//    the only external tool is `tkt`, which is local and degrades to a warning if missing.
//    Nothing here logs into Claude/Codex/Kiro or hits a network.
//  - Each sub-check is independently runnable; this is the aggregator.
//
// Run:  node scripts/check-repo.mjs
// Exit: 0 = all pass; 1 = at least one invariant failed.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const results = [];

function run(label, cmd, args, { optional = false } = {}) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: join(SCRIPTS, "..") });
  if (r.error) {
    if (r.error.code === "ENOENT") {
      if (optional) {
        console.log(`(skipped: ${cmd} not found — ${label} not checked)`);
        results.push({ label, status: "skip" });
        return;
      }
      console.error(`FAILED: ${cmd} not found`);
      results.push({ label, status: "fail" });
      return;
    }
    console.error(`FAILED: ${r.error.message}`);
    results.push({ label, status: "fail" });
    return;
  }
  results.push({ label, status: r.status === 0 ? "pass" : "fail" });
}

const node = process.execPath;

run("1. installer ownership safety", node, ["--test", join(SCRIPTS, "install-skills.test.mjs")]);
run("2. invocation sidecars + README groups", node, [join(SCRIPTS, "check-invocation-policy.mjs")]);
run("3. doc indexes + relative links", node, [join(SCRIPTS, "check-docs-consistency.mjs")]);
// tkt validate: normal severity (a warning like unchecked-acs-on-done does not fail the
// build; only structural errors — cycles, dangling deps — exit nonzero).
run("4. ticket health (tkt validate)", "tkt", ["validate"], { optional: true });

// --- Summary ------------------------------------------------------------------
console.log("\n==================== repo-check summary ====================");
let failed = 0;
for (const r of results) {
  const mark = r.status === "pass" ? "ok  " : r.status === "skip" ? "skip" : "FAIL";
  console.log(`  [${mark}] ${r.label}`);
  if (r.status === "fail") failed++;
}
console.log("============================================================");

if (failed) {
  console.error(`\n${failed} invariant(s) FAILED.`);
  process.exit(1);
}
console.log("\nAll repository-consistency invariants pass.");
