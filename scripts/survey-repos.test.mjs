#!/usr/bin/env node
// Tests for adopt-project's survey-repos.mjs (portfolio mode): tiering by freshness, dirty tree,
// incumbent layer, and adopted state. Throwaway git repos under the OS temp dir only.
// Run: node --test scripts/survey-repos.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { surveyParent } from "../skills/meta/adopt-project/scripts/survey-repos.mjs";

function repo(parent, name, files, { daysAgo = 0, dirty = false } = {}) {
  const r = join(parent, name);
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(join(r, p)), { recursive: true });
    writeFileSync(join(r, p), body);
  }
  const date = new Date(Date.now() - daysAgo * 86400e3).toISOString();
  const env = { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
  const g = (...a) => execFileSync("git", ["-C", r, ...a], { stdio: "pipe", env });
  g("init", "-q"); g("add", "-A");
  g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "x");
  if (dirty) writeFileSync(join(r, "wip.txt"), "wip\n");
}

test("tiers repos by freshness, tree state, and agent layer", () => {
  const parent = mkdtempSync(join(tmpdir(), "gm-survey-"));
  try {
    repo(parent, "fresh-clean", { ".memory/CONTEXT.md": "#\n", "AGENTS.md": "use `read-handoff`\n" });
    repo(parent, "fresh-dirty", { ".memory/CONTEXT.md": "#\n" }, { dirty: true });
    repo(parent, "warm", { ".memory/CONTEXT.md": "#\n" }, { daysAgo: 60 });
    repo(parent, "dormant", { ".memory/CONTEXT.md": "#\n" }, { daysAgo: 200 });
    repo(parent, "bare", { "main.py": "print(1)\n" });
    repo(parent, "done", { "GLOSSARY.md": "#\n", "AGENTS.md": "we recall things\n" });
    repo(parent, "skipme", { ".memory/CONTEXT.md": "#\n" });
    mkdirSync(join(parent, "not-a-repo"));
    const rows = Object.fromEntries(surveyParent(parent, { exclude: ["skipme"] }).map((r) => [r.name, r]));
    assert.deepEqual(Object.keys(rows).sort(), ["bare", "done", "dormant", "fresh-clean", "fresh-dirty", "warm"]);
    assert.equal(rows["fresh-clean"].tier, "now");
    assert.deepEqual(rows["fresh-clean"].staleRefs, ["read-handoff"]);
    assert.equal(rows["fresh-dirty"].tier, "now-after-wip");
    assert.equal(rows.warm.tier, "warm");
    assert.equal(rows.dormant.tier, "dormant");
    assert.equal(rows.bare.tier, "no-layer");
    assert.equal(rows.done.tier, "adopted"); // plain-English "recall" is not a stale skill ref
  } finally { rmSync(parent, { recursive: true, force: true }); }
});
