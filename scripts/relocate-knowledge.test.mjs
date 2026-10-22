#!/usr/bin/env node
// Fixture tests for relocate-knowledge.mjs (proposal 05 R2). Each test builds a throwaway git
// repo under the OS temp dir; nothing touches a real project.
//
// Run: node --test scripts/relocate-knowledge.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { checkLinks, relocate } from "../skills/meta/adopt-project/scripts/relocate-knowledge.mjs";

function fixtureRepo(files) {
  const repo = mkdtempSync(join(tmpdir(), "gm-relocate-"));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), body);
  }
  const g = (...a) => execFileSync("git", ["-C", repo, ...a], { stdio: "pipe" });
  g("init", "-q");
  g("add", "-A");
  g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "fixture");
  return repo;
}
const read = (repo, f) => readFileSync(join(repo, f), "utf8");

const FILES = {
  // depth change: specs/ (depth 2) -> docs/agents/specs/ (depth 3), linking to a sibling moved file
  ".memory/specs/a.md": "See [b](b.md) and [the adr](../adr/0001-x.md) and [readme](../../README.md).\n",
  ".memory/specs/b.md": "# b\n",
  ".memory/adr/0001-x.md": "Context: [spec a](../specs/a.md).\n",
  ".memory/CONTEXT.md": "# Glossary\n",
  // unmoved file linking into the moved tree, plus a repo-rooted mention in prose
  "README.md": "Vocab: [glossary](.memory/CONTEXT.md). Spec lives at `.memory/specs/a.md`.\n",
  "tools/x.py": '"""Spec: .memory/specs/a.md."""\n',
  // recorded evidence: must stay byte-identical
  ".memory/research/run-evidence.json": '{"target": "../.memory/specs/a.md"}\n',
  // a link inside a fenced block and an inline code span: check-links must skip both
  "docs/example.md": "```md\n![x](missing.png)\n```\nInline `[y](missing.md)` too.\n",
};

test("dry-run changes nothing and reports the plan", () => {
  const repo = fixtureRepo(FILES);
  try {
    const r = relocate(repo);
    assert.ok(r.moves.length >= 4);
    assert.ok(r.rewritten.includes("README.md"));
    assert.ok(existsSync(join(repo, ".memory/specs/a.md")));
    assert.equal(read(repo, "README.md"), FILES["README.md"]);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("apply: moves files, re-relativizes links across a depth change and between moved files", () => {
  const repo = fixtureRepo(FILES);
  try {
    relocate(repo, { apply: true });
    assert.ok(!existsSync(join(repo, ".memory/specs")));
    assert.equal(read(repo, "docs/agents/specs/a.md"),
      "See [b](b.md) and [the adr](../../adr/0001-x.md) and [readme](../../../README.md).\n");
    assert.equal(read(repo, "docs/adr/0001-x.md"), "Context: [spec a](../agents/specs/a.md).\n");
    assert.equal(read(repo, "README.md"),
      "Vocab: [glossary](GLOSSARY.md). Spec lives at `docs/agents/specs/a.md`.\n");
    assert.equal(read(repo, "tools/x.py"), '"""Spec: docs/agents/specs/a.md."""\n');
    assert.equal(checkLinks(repo).broken.length, 0);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("apply: recorded evidence is moved but never rewritten", () => {
  const repo = fixtureRepo(FILES);
  try {
    const r = relocate(repo, { apply: true });
    assert.equal(read(repo, "docs/agents/research/run-evidence.json"), FILES[".memory/research/run-evidence.json"]);
    assert.deepEqual(r.skippedEvidence, ["docs/agents/research/run-evidence.json"]);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("unmapped old-root mentions are reported as leftovers, not rewritten", () => {
  const repo = fixtureRepo({ "notes.md": "Put corrections in .memory + AGENTS.md.\n" });
  try {
    const r = relocate(repo, { apply: true });
    assert.equal(r.leftovers.length, 1);
    assert.equal(read(repo, "notes.md"), "Put corrections in .memory + AGENTS.md.\n");
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("refuses to move onto an existing destination", () => {
  const repo = fixtureRepo({ ".memory/CONTEXT.md": "# a\n", "GLOSSARY.md": "# b\n" });
  try {
    assert.throws(() => relocate(repo, { apply: true }), /already exists/);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("check-links skips code fences and inline code, and still FAILS on a real broken link", () => {
  const repo = fixtureRepo({ ...FILES, "bad.md": "[gone](nope.md)\n" });
  try {
    const { broken } = checkLinks(repo);
    assert.deepEqual(broken, ["bad.md:1: nope.md"]);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("--evidence-dir protects non-JSON records by path, and check-links --skip excludes a tree", () => {
  const repo = fixtureRepo({
    ".memory/evidence/run/review.md": "Reviewed [readme](../../../README.md) at `.memory/specs/a.md`.\n",
    ".memory/specs/a.md": "# a\n",
    "README.md": "# r\n",
  });
  try {
    const before = read(repo, ".memory/evidence/run/review.md");
    const r = relocate(repo, { map: [[".memory/evidence/", "docs/agents/evidence/"], [".memory/specs/", "docs/agents/specs/"]],
      evidenceDirs: [".memory/evidence/"], apply: true });
    assert.equal(read(repo, "docs/agents/evidence/run/review.md"), before);
    assert.deepEqual(r.skippedEvidence, ["docs/agents/evidence/run/review.md"]);
    assert.equal(checkLinks(repo).broken.length, 1);
    assert.equal(checkLinks(repo, { skip: ["docs/agents/evidence/"] }).broken.length, 0);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("links inside fenced code and inline code are not rewritten", () => {
  const repo = fixtureRepo({
    ".memory/ref.md": "See [a](specs/a.md).\n```asm\ntbl[idx](x)\n```\nInline `f[i](y)` too.\n",
    ".memory/specs/a.md": "# a\n",
  });
  try {
    relocate(repo, { map: [[".memory/ref.md", "docs/agents/research/ref.md"], [".memory/specs/", "docs/agents/specs/"]], apply: true });
    assert.equal(read(repo, "docs/agents/research/ref.md"),
      "See [a](../specs/a.md).\n```asm\ntbl[idx](x)\n```\nInline `f[i](y)` too.\n");
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("the CLI runs when invoked through a symlinked path", () => {
  const dir = mkdtempSync(join(tmpdir(), "gm-link-"));
  try {
    execFileSync("git", ["-C", dir, "init", "-q"]);
    const real = new URL("../skills/meta/adopt-project/scripts/relocate-knowledge.mjs", import.meta.url).pathname;
    const link = join(dir, "rk.mjs");
    symlinkSync(real, link);
    const out = execFileSync(process.execPath, [link, "check-links", dir], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).toString();
    assert.match(out, /md files/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
