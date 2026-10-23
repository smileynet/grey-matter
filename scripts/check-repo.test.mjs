#!/usr/bin/env node
// check-repo.test.mjs — fixture tests proving each consistency check FAILS on a seeded
// mismatch, and the repaired repo PASSES (ticket 31, AC2 + AC3).
//
// For the three file-based checks (invocation, index, link) we seed a defect in-place,
// run the specific check, assert it exits nonzero, then restore the file — with a guard
// that ALWAYS restores even if an assertion throws. The installer-ownership and
// ticket-validation invariants are proven in their own isolated harnesses
// (deploy.test.mjs; the tkt immutability findings in ticket 29/33), and are
// re-asserted here at the command level.
//
// Nothing here mutates a user skill root or needs harness auth.
//
// Run:  node --test scripts/check-repo.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const REPO = join(SCRIPTS, "..");
const node = process.execPath;

function runCheck(script) {
  const r = spawnSync(node, [join(SCRIPTS, script)], { cwd: REPO, encoding: "utf8" });
  return { status: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

// Seed a defect into `file`, run `fn`, and ALWAYS restore the original bytes.
function withSeededFile(file, mutate, fn) {
  const original = readFileSync(file, "utf8");
  try {
    const seeded = mutate(original);
    assert.notEqual(seeded, original, `fixture did not seed a defect in ${file}`);
    writeFileSync(file, seeded);
    fn();
  } finally {
    writeFileSync(file, original);
  }
}

// --- baseline: the repaired repo passes every check (AC3) ---------------------
test("docs-consistency passes on the repaired repo", () => {
  const r = runCheck("check-docs-consistency.mjs");
  assert.equal(r.status, 0, r.out);
});
test("invocation-policy passes on the repaired repo", () => {
  const r = runCheck("check-invocation-policy.mjs");
  assert.equal(r.status, 0, r.out);
});

// --- AC2: each checked invariant fails when seeded -----------------------------

// (invariant: invocation sidecars / README groups)
test("invocation check FAILS when a README misfiles a skill's invocation tier", () => {
  const readme = join(REPO, "skills", "productivity", "README.md");
  withSeededFile(readme,
    // Move a user-invoked skill link under the Model-invoked heading by duplicating it there.
    (t) => t.replace("## Model-invoked",
      "## Model-invoked\n\n- [handoff](./handoff/SKILL.md): SEEDED misfile under model-invoked."),
    () => {
      const r = runCheck("check-invocation-policy.mjs");
      assert.equal(r.status, 1, "expected nonzero on a misfiled README tier");
      assert.match(r.out, /handoff/, "names the misfiled skill");
    });
});

// (invariant: doc indexes — a skill dropped from its bucket README)
test("index check FAILS when a skill is missing from its bucket README", () => {
  const readme = join(REPO, "skills", "productivity", "README.md");
  withSeededFile(readme,
    (t) => t.replace(/^- \[handoff\]\(\.\/handoff\/SKILL\.md\).*$/m, "- (seeded: handoff removed)"),
    () => {
      const r = runCheck("check-docs-consistency.mjs");
      assert.equal(r.status, 1, "expected nonzero when a skill is missing from its README");
      assert.match(r.out, /missing own skill "handoff"/);
    });
});

// (invariant: durable links — a broken relative link)
test("link check FAILS on a broken relative link", () => {
  const doc = join(REPO, "docs", "agents", "tkt-conventions.md");
  withSeededFile(doc,
    (t) => t + "\n\nSeeded broken link: [x](./does-not-exist-xyz.md)\n",
    () => {
      const r = runCheck("check-docs-consistency.mjs");
      assert.equal(r.status, 1, "expected nonzero on a broken relative link");
      assert.match(r.out, /broken link -> \.\/does-not-exist-xyz\.md/);
    });
});

// (invariant: deployer ownership safety — proven by the dedicated isolated suite)
test("installer ownership regression suite passes (isolated temp roots)", () => {
  const r = spawnSync(node, ["--test", join(SCRIPTS, "deploy.test.mjs")],
    { cwd: REPO, encoding: "utf8" });
  assert.equal(r.status, 0, (r.stdout || "") + (r.stderr || ""));
  // And it is the suite that proves the FAILING seeded case (refused foreign dir): its
  // AC1/AC2 tests assert the pre-fix behavior would lose data; they pass only post-fix.
});

// (invariant: invocation sidecar one-sided mismatch — the exact ticket-27 gap)
test("invocation check FAILS when a user-invoked skill loses its sidecar", () => {
  const sidecar = join(REPO, "skills", "productivity", "handoff", "agents", "openai.yaml");
  assert.ok(existsSync(sidecar), "precondition: handoff sidecar exists");
  const tmp = sidecar + ".seedbak";
  renameSync(sidecar, tmp);
  try {
    const r = runCheck("check-invocation-policy.mjs");
    assert.equal(r.status, 1, "expected nonzero when a user-invoked skill lacks its sidecar");
    assert.match(r.out, /handoff/);
  } finally {
    if (existsSync(tmp)) renameSync(tmp, sidecar);
  }
  assert.ok(existsSync(sidecar), "sidecar restored");
});

// (invariant: an orchestrator must not Skill-call a user-invoked skill — Claude Code refuses it)
test("invocation check FAILS when an orchestrator's Skill-tool target is user-invoked", () => {
  const skill = join(REPO, "skills", "engineering", "retro", "SKILL.md");
  const sidecar = join(REPO, "skills", "engineering", "retro", "agents", "openai.yaml");
  withSeededFile(skill, (s) => s.replace(/^(name: retro\r?\n)/m, "$1disable-model-invocation: true\n"), () => {
    withSeededFile(sidecar, (y) => y.trimEnd() + "\npolicy:\n  allow_implicit_invocation: false\n", () => {
      const r = runCheck("check-invocation-policy.mjs");
      assert.equal(r.status, 1, "expected nonzero when wrap-session's retro is user-invoked");
      assert.match(r.out, /wrap-session: calls the Skill tool with `retro`/);
    });
  });
});

// (invariant: the Claude plugin manifest names every skill bucket and keeps up with tags)
test("plugin-manifest check FAILS when a bucket drops out of plugin.json skills", () => {
  const manifest = join(REPO, ".claude-plugin", "plugin.json");
  withSeededFile(manifest, (s) => {
    const value = JSON.parse(s);
    assert.ok(value.skills.includes("./skills/meta"));
    value.skills = value.skills.filter((path) => path !== "./skills/meta");
    return JSON.stringify(value, null, 2) + "\n";
  }, () => {
    const r = runCheck("check-plugin-manifest.mjs");
    assert.equal(r.status, 1, "expected nonzero when skills/meta is unlisted");
    assert.match(r.out, /missing "\.\/skills\/meta"/);
  });
});

test("plugin-manifest check FAILS when plugin.json version is behind the latest tag", () => {
  const manifest = join(REPO, ".claude-plugin", "plugin.json");
  withSeededFile(manifest, (s) => s.replace(/"version": "[^"]*"/, '"version": "0.0.1"'), () => {
    const r = runCheck("check-plugin-manifest.mjs");
    assert.equal(r.status, 1, "expected nonzero when the version lags the latest v* tag");
    assert.match(r.out, /behind the latest tag/);
  });
});
