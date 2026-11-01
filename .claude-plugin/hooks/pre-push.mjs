#!/usr/bin/env node
// Claude PreToolUse gate. Usage: node pre-push.mjs < hook-input.json
import { existsSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (input.hook_event_name !== "PreToolUse" || !["Bash", "PowerShell"].includes(input.tool_name)) process.exit(0);
  if (typeof input.tool_input?.command !== "string") throw new Error("missing tool_input.command");
  // Shell aliases and wrappers are handled by the Git pre-push hook, not this matcher.
  if (!/(?:^|[\s;&|()])(?:git|["']git["'])(?:\s+[^\s;&|()]+)*?\s+push(?:\s|$|[;&|()])/.test(input.tool_input.command)) process.exit(0);
  const root = process.env.CLAUDE_PROJECT_DIR;
  if (!root || !isAbsolute(root)) throw new Error("missing absolute CLAUDE_PROJECT_DIR");
  const checker = join(root, "scripts", "check-repo.mjs");
  try {
    if (!statSync(checker).isFile()) throw new Error("project checker is not a regular file");
  } catch (error) {
    if (error.code === "ENOENT") process.exit(0);
    throw error;
  }
  // An installed Git pre-push hook gates this same push; running the checker here too
  // would double the wait.
  const gitHook = spawnSync("git", ["rev-parse", "--git-path", "hooks/pre-push"], { cwd: root, encoding: "utf8" });
  if (gitHook.status === 0 && existsSync(resolve(root, gitHook.stdout.trim()))) process.exit(0);
  const result = spawnSync(process.execPath, [checker], {
    cwd: root, encoding: "utf8", timeout: 900_000, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, CHECK_REPO_MODE: "affected" },
  });
  if (result.status !== 0) {
    throw new Error(`project check failed before git push\n${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`);
  }
} catch (error) {
  console.error(`grey-matter push gate: ${error.message}`);
  process.exit(2);
}
