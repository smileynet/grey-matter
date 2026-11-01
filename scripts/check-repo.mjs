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
//   6. agent guidance              -> scripts/install-agents-md.test.mjs (budget + managed blocks) and
//                                     check-guidance.test.mjs (fixtures; check-guidance.mjs itself
//                                     reads this host's files, so `sync` runs it, not this check)
//   7. crew-research uninstall     -> scripts/uninstall-crew-research.test.mjs (fake home only)
//   8. repo survey (portfolio)     -> scripts/survey-repos.test.mjs (temp git repos)
//   9. Claude plugin manifest      -> scripts/check-plugin-manifest.mjs (buckets, version, marketplace)
//  10. YAML syntax and core types  -> scripts/check-skill-syntax.mjs (npm ci once for maintainers)
//  11. release draft/artifact/publisher safety -> release*.test.mjs (isolated repos and fake services)
//  13. repository artifact inspection -> repository-artifact-hygiene.test.mjs, inspect-footprint.test.mjs (read-only fixtures)
//  14. agent shell probe          -> probe-agent-shell.test.mjs (fake settings and binaries)
//  15. delivery-dashboard contract -> delivery-dashboard.test.mjs (template, example and checker)
//  16. critic model probe         -> probe-critic-model.test.mjs (fake harness binaries)
//  17. orchestrate spike fixture  -> spike-orchestrate-fixture.test.mjs (temp sandboxes; skips without tkt)
//  18. harness version detector   -> harness-versions.test.mjs (fake harness binaries)
//  19. provider fallback validator -> check-provider-fallback.test.mjs (fixture sections + this AGENTS.md)
//
// Design (AC-driven):
//  - READ-ONLY on user state. The installer test uses throwaway temp roots (mkdtemp),
//    never a real harness skill root; the other checks only read files + the filesystem.
//  - NO harness authentication required (AC4): everything runs offline against the repo;
//    the only external tool is `tkt`, which is local and degrades to a warning if missing.
//    Nothing here logs into Claude/Codex/Kiro or hits a network.
//  - Each sub-check is independently runnable; this is the aggregator.
//
// Modes (docs/agents/local-gates.md):
// On demand only: no hook runs it (proposal 18 rebuilds the gates).
//   --static    the static checks (2, 3, 4, 9, 10): read files only, seconds.
//   --full      every group (the default); release-product.mjs runs it.
//
// Run:  node scripts/check-repo.mjs [--static | --full] [--require-tools]
// Exit: 0 = all pass; 1 = at least one invariant failed.

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPTS, "..");
const SELF = "check-repo.mjs";
const results = [];
const args = process.argv.slice(2);
const MODES = ["--static", "--full"];
if (args.some((arg) => arg !== "--require-tools" && !MODES.includes(arg)) || args.filter((arg) => MODES.includes(arg)).length > 1) {
  console.error("usage: node scripts/check-repo.mjs [--static | --full] [--require-tools]");
  process.exit(2);
}
const requireTools = args.includes("--require-tools");
const mode = args.find((arg) => MODES.includes(arg))?.slice(2) ?? "full";

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
  const started = Date.now();
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT });
  const seconds = (Date.now() - started) / 1000;
  if (r.error) {
    if (r.error.code === "ENOENT") {
      if (optional && !requireTools) {
        console.log(`(skipped: ${cmd} not found — ${label} not checked)`);
        results.push({ label, status: "skip", seconds });
        return;
      }
      console.error(`FAILED: ${cmd} not found`);
      results.push({ label, status: "fail", seconds });
      return;
    }
    console.error(`FAILED: ${r.error.message}`);
    results.push({ label, status: "fail", seconds });
    return;
  }
  results.push({ label, status: r.status === 0 ? "pass" : "fail", seconds });
}

const node = process.execPath;

const test = (...files) => ["--test", ...files.map((f) => join(SCRIPTS, f))];

// Static checks only read files and run in every mode. Test
// groups run only in --full, before a release: a slow or flaky fixture must not block
// publishing tickets or docs.
const STATIC = [
  ["2. invocation sidecars + README groups", node, [join(SCRIPTS, "check-invocation-policy.mjs")]],
  ["3. doc indexes + relative links", node, [join(SCRIPTS, "check-docs-consistency.mjs")]],
  // tkt validate: normal severity (a warning like unchecked-acs-on-done does not fail the
  // build; only structural errors — cycles, dangling deps — exit nonzero).
  ["4. ticket health (tkt validate)", "tkt", ["validate"], { optional: true }],
  ["9. Claude plugin manifest", node, [join(SCRIPTS, "check-plugin-manifest.mjs")]],
  ["10. YAML syntax and core types", node, [join(SCRIPTS, "check-skill-syntax.mjs")]],
  ["10b. provider fallback section", node, [join(SCRIPTS, "check-provider-fallback.mjs"), join(ROOT, "AGENTS.md")]],
];
const TESTS = [
  ["1. deployer: ownership, plugin guards, root selection", test("deploy.test.mjs")],
  ["5. knowledge relocation (adopt-project)", test("relocate-knowledge.test.mjs")],
  ["6. agent guidance (managed blocks + guidance check)", test("install-agents-md.test.mjs", "check-guidance.test.mjs")],
  ["7. crew-research uninstall scope", test("uninstall-crew-research.test.mjs")],
  ["8. repo survey tiers (adopt-project portfolio)", test("survey-repos.test.mjs")],
  ["11. release draft, artifact and publisher safety", test("release-artifacts.test.mjs", "release-version.test.mjs", "release.test.mjs", "release-product.test.mjs", "release-native.test.mjs", "release-entrypoints.test.mjs", "release-verify.test.mjs", "release-publish.test.mjs", "release-registry.test.mjs", "release-tkt-publication.test.mjs", "release-cargo-credentials.test.mjs", "release-cargo-upload.test.mjs", "release-git.test.mjs", "release-development.test.mjs", "release-github.test.mjs", "release-ci-artifacts.test.mjs", "skill-syntax.test.mjs")],
  ["13. repository artifact hygiene", test("repository-artifact-hygiene.test.mjs", "inspect-footprint.test.mjs")],
  ["14. agent shell probe", test("probe-agent-shell.test.mjs")],
  ["15. delivery-dashboard contract", test("delivery-dashboard.test.mjs")],
  ["15b. final-source review receipt", test("review-receipt.test.mjs")],
  ["16. critic model probe", test("probe-critic-model.test.mjs")],
  ["17. orchestrate spike fixture", test("spike-orchestrate-fixture.test.mjs")],
  ["18. harness version detector", test("harness-versions.test.mjs")],
  ["19. provider fallback validator", test("check-provider-fallback.test.mjs")],
];
const selected = mode === "full" ? TESTS : [];
console.log(`check-repo mode: ${mode}; ${selected.length} of ${TESTS.length} test groups selected`);

for (const [label, cmd, cmdArgs, opts] of STATIC) run(label, cmd, cmdArgs, opts);
for (const [label, cmdArgs] of selected) run(label, node, cmdArgs);
if (mode === "full" && process.env.DASHBOARD_BROWSER_TESTS === "1") run("15c. delivery-dashboard browser behavior", node, test("delivery-dashboard-browser.test.mjs"));

// --- Summary ------------------------------------------------------------------
console.log("\n==================== repo-check summary ====================");
let failed = 0;
for (const r of results) {
  const mark = r.status === "pass" ? "ok  " : r.status === "skip" ? "skip" : "FAIL";
  console.log(`  [${mark}] ${r.seconds.toFixed(1).padStart(6)}s  ${r.label}`);
  if (r.status === "fail") failed++;
}
console.log(`  total ${results.reduce((sum, r) => sum + r.seconds, 0).toFixed(1)}s (${mode})`);
console.log("============================================================");

if (failed) {
  console.error(`\n${failed} invariant(s) FAILED.`);
  process.exit(1);
}
console.log("\nAll repository-consistency invariants pass.");
