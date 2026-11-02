#!/usr/bin/env node
// Tests for check-home-path.mjs: each path form of a fake home is caught, the allowlist and
// binary files are skipped, and the repo itself is clean.
//
// Run: node --test scripts/check-home-path.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED, main, needles, scan } from "./check-home-path.mjs";

const HOME = "C:\\Users\\alice";
const files = (map) => [Object.keys(map), (f) => map[f] ?? null];

test("needles cover the Windows, forward-slash, escaped and Git Bash forms", () => {
  assert.deepEqual(needles(HOME).sort(), ["/c/Users/alice", "C:/Users/alice", "C:\\Users\\alice", "C:\\\\Users\\\\alice"].sort());
});

for (const [form, text] of [
  ["Windows", "run C:\\Users\\alice\\.local\\bin\\claude.exe"],
  ["forward slash", "path: C:/Users/alice/AppData/Local/agy"],
  ["JSON-escaped", '{"p": "C:\\\\Users\\\\alice\\\\x"}'],
  ["Git Bash", "ls /c/Users/alice/.kiro"],
  ["different case", "c:\\users\\ALICE\\x"],
]) {
  test(`the ${form} form is a leak`, () => {
    const [list, read] = files({ "docs/a.md": `ok\n${text}\n` });
    assert.deepEqual(scan(list, read, HOME), [{ file: "docs/a.md", line: 2 }]);
  });
}

test("generic forms, other users, allowlisted and unreadable files are not leaks", () => {
  const [list, read] = files({
    "docs/ok.md": "%USERPROFILE%\\.claude and ~/.kiro and $HOME and C:\\Users\\bob",
    [[...ALLOWED][0]]: "C:\\Users\\alice in old evidence",
    "img.png": null,
  });
  assert.deepEqual(scan(list, read, HOME), []);
});

test("this repository has no tracked file with this machine's home path", () => {
  const logs = [];
  assert.equal(main([], (l) => logs.push(l)), 0, logs.join("\n"));
});
