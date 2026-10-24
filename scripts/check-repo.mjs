#!/usr/bin/env node
// check-repo.mjs — the one repository-consistency command (ticket 31).
//
// Runs every mechanical invariant the skill-distribution contract depends on, in one
// place, and exits nonzero if any fails. Intended for a maintainer before a release or
// distribution change, and callable from CI.
//
// Invariants checked:
//   1. deployer (ownership, plugin guards, root selection) -> scripts/deploy.test.mjs (node:test)
//   2. invocation sidecars/README  -> scripts/check-invocation-policy.mjs
//   3. doc indexes + links         -> scripts/check-docs-consistency.mjs
//   4. ticket health               -> tkt validate   (skipped w/ warning if tkt absent)
//   5. knowledge relocation        -> scripts/relocate-knowledge.test.mjs (node:test, temp git repos)
//   6. global AGENTS.md            -> scripts/install-agents-md.test.mjs (size budget + ownership)
//   7. crew-research uninstall     -> scripts/uninstall-crew-research.test.mjs (fake home only)
//   8. repo survey (portfolio)     -> scripts/survey-repos.test.mjs (temp git repos)
//   9. Claude plugin manifest      -> scripts/check-plugin-manifest.mjs (buckets, version, marketplace)
//  10. YAML syntax and core types  -> scripts/check-skill-syntax.mjs (npm ci once for maintainers)
//  11. release draft/artifact/publisher safety -> release*.test.mjs (isolated repos and fake services)
//  12. opt-in Git hooks            -> install-hooks.test.mjs (disposable repositories)
//
// Design (AC-driven):
//  - READ-ONLY on user state. The installer test uses throwaway temp roots (mkdtemp),
//    never a real harness skill root; the other checks only read files + the filesystem.
//  - NO harness authentication required (AC4): everything runs offline against the repo;
//    the only external tool is `tkt`, which is local and degrades to a warning if missing.
//    Nothing here logs into Claude/Codex/Kiro or hits a network.
//  - Each sub-check is independently runnable; this is the aggregator.
//
// Run:  node scripts/check-repo.mjs [--require-tools]
// Exit: 0 = all pass; 1 = at least one invariant failed.

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const SELF = "check-repo.mjs";
const results = [];
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--require-tools")) {
  console.error("usage: node scripts/check-repo.mjs [--require-tools]");
  process.exit(2);
}
const requireTools = args.includes("--require-tools");

// Orphan guard (ticket 34 nice-to-have): every sibling `check-*.mjs` sub-check (excluding
// this aggregator and any `*.test.mjs`) must be named in this file's run list, so a future
// check script can't be silently dropped from the aggregated run. This reads the source of
// THIS file and asserts each check script name appears in it; it does not run them here.
{
  const selfSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const checkScripts = readdirSync(SCRIPTS).filter(
    (f) => f.startsWith("check-") && f.endsWith(".mjs") && !f.endsWith(".test.mjs") && f !== SELF,
  );
  const orphans = checkScripts.filter((f) => !selfSrc.includes(f));
  if (orphans.length) {
    console.error(
      `check-repo.mjs is missing ${orphans.length} sub-check(s) from its run list: ` +
      orphans.join(", ") + "\n(add a run(...) call for each, or rename it so it is not a check-*.mjs).",
    );
    process.exit(1);
  }
}

function run(label, cmd, args, { optional = false } = {}) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: join(SCRIPTS, "..") });
  if (r.error) {
    if (r.error.code === "ENOENT") {
      if (optional && !requireTools) {
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

run("1. deployer: ownership, plugin guards, root selection", node, ["--test", join(SCRIPTS, "deploy.test.mjs")]);
run("2. invocation sidecars + README groups", node, [join(SCRIPTS, "check-invocation-policy.mjs")]);
run("3. doc indexes + relative links", node, [join(SCRIPTS, "check-docs-consistency.mjs")]);
// tkt validate: normal severity (a warning like unchecked-acs-on-done does not fail the
// build; only structural errors — cycles, dangling deps — exit nonzero).
run("4. ticket health (tkt validate)", "tkt", ["validate"], { optional: true });
run("5. knowledge relocation (adopt-project)", node, ["--test", join(SCRIPTS, "relocate-knowledge.test.mjs")]);
run("6. global AGENTS.md (budget + ownership)", node, ["--test", join(SCRIPTS, "install-agents-md.test.mjs")]);
run("7. crew-research uninstall scope", node, ["--test", join(SCRIPTS, "uninstall-crew-research.test.mjs")]);
run("8. repo survey tiers (adopt-project portfolio)", node, ["--test", join(SCRIPTS, "survey-repos.test.mjs")]);
run("9. Claude plugin manifest", node, [join(SCRIPTS, "check-plugin-manifest.mjs")]);
run("10. YAML syntax and core types", node, [join(SCRIPTS, "check-skill-syntax.mjs")]);
run("11. release draft, artifact and publisher safety", node, ["--test", join(SCRIPTS, "release-artifacts.test.mjs"), join(SCRIPTS, "release-version.test.mjs"), join(SCRIPTS, "release.test.mjs"), join(SCRIPTS, "release-product.test.mjs"), join(SCRIPTS, "release-native.test.mjs"), join(SCRIPTS, "release-entrypoints.test.mjs"), join(SCRIPTS, "release-verify.test.mjs"), join(SCRIPTS, "release-publish.test.mjs"), join(SCRIPTS, "release-registry.test.mjs"), join(SCRIPTS, "release-git.test.mjs"), join(SCRIPTS, "release-github.test.mjs"), join(SCRIPTS, "skill-syntax.test.mjs")]);
run("12. opt-in Git hooks", node, ["--test", join(SCRIPTS, "install-hooks.test.mjs")]);

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
