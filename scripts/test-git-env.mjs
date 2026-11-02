import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, dirname, isAbsolute, resolve } from "node:path";

// Test workers and their subprocesses must not load the owner's signing keys, hooks or editor.
process.env.GIT_CONFIG_GLOBAL = fileURLToPath(new URL("./test-git.config", import.meta.url));
process.env.GIT_CONFIG_NOSYSTEM = "1";

// The Git for Windows cmd shim adds a process per call; use the binary from that installation.
if (process.platform === "win32") {
  const result = spawnSync("git", ["--exec-path"], { encoding: "utf8", windowsHide: true });
  const execPath = result.status === 0 ? result.stdout.trim() : "";
  if (isAbsolute(execPath)) {
    const nativeGit = resolve(execPath, "../../bin/git.exe");
    if (existsSync(nativeGit)) process.env.PATH = `${dirname(nativeGit)}${delimiter}${process.env.PATH ?? ""}`;
  }
}
