import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const handler = fileURLToPath(new URL("../.claude-plugin/hooks/pre-push.mjs", import.meta.url));
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "claude push's fixture-"));
  const project = join(dir, "project with spaces");
  mkdirSync(join(project, "scripts"), { recursive: true });
  const run = (command, { tool = "Bash", input, root = project } = {}) => spawnSync(process.execPath, [handler], {
    cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: "utf8",
    input: input ?? JSON.stringify({ hook_event_name: "PreToolUse", tool_name: tool, tool_input: { command } }),
  });
  try { fn({ project, run, checker: (body) => writeFileSync(join(project, "scripts/check-repo.mjs"), body) }); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

test("push gate runs the project checker with project cwd for Bash and PowerShell", () => fixture(({ project, checker, run }) => {
  checker("import {writeFileSync} from 'node:fs'; writeFileSync('checked', process.cwd());\n");
  for (const tool of ["Bash", "PowerShell"]) {
    const result = run("git push origin main", { tool });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.equal(readFileSync(join(project, "checked"), "utf8"), realpathSync(project));
  }
}));

test("checker failure is blocking exit 2 with named diagnostics", () => fixture(({ checker, run }) => {
  checker("console.error('FAIL: skill inventory'); process.exit(1);\n");
  const result = run("git -C ../other push");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /skill inventory/);
}));

test("unrelated commands, tools and repositories are no-ops", () => fixture(({ checker, run }) => {
  assert.equal(run("git push").status, 0);
  checker("throw new Error('must not run');\n");
  for (const command of ["git status", "git log", "push origin", "echo shipping"]) assert.equal(run(command).status, 0, command);
  assert.equal(run("git push", { tool: "Read" }).status, 0);
}));

test("checker crash and malformed hook input block without stdout", () => fixture(({ checker, run }) => {
  checker("throw new Error('broken checker');\n");
  for (const result of [run("git push"), run("", { input: "not-json" })]) {
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.ok(result.stderr.trim());
  }
}));
