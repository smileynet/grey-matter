#!/usr/bin/env node
// Fail when a tracked text file contains this machine's home directory path (in Windows, forward-
// slash or Git Bash form). The repo is public; a path like C:\Users\<name> leaks the account name,
// and once pushed it stays in history. Write %USERPROFILE%, $HOME or ~ instead.
// Usage: node scripts/check-home-path.mjs [--json]
// Exit codes: 0 = clean, 1 = leak found, 2 = could not list files.
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_BYTES = 4 * 1024 ** 2;

// Generated evidence recorded before this check existed; rewriting it would falsify the record.
export const ALLOWED = new Set([
  "docs/agents/research/evidence/windows-native-validation-20261024.json",
  "docs/agents/research/evidence/windows-native-validation-completion-20261024.json",
]);

export function needles(home) {
  const fwd = home.replace(/\\/g, "/");
  const out = new Set([home, fwd, home.replace(/\\/g, "\\\\")]);
  const drive = fwd.match(/^([A-Za-z]):\/(.*)$/);
  if (drive) out.add(`/${drive[1].toLowerCase()}/${drive[2]}`);
  return [...out].filter((n) => n.length > 3);
}

export function scan(files, readText, home = homedir()) {
  const forms = needles(home).map((n) => n.toLowerCase());
  const leaks = [];
  for (const file of files) {
    if (ALLOWED.has(file)) continue;
    const text = readText(file);
    if (text === null) continue;
    text.split("\n").forEach((line, i) => {
      const low = line.toLowerCase();
      if (forms.some((f) => low.includes(f))) leaks.push({ file, line: i + 1 });
    });
  }
  return leaks;
}

function readText(file) {
  const path = join(ROOT, file);
  try {
    if (statSync(path).size > MAX_BYTES) return null;
    const buf = readFileSync(path);
    return buf.includes(0) ? null : buf.toString("utf8");
  } catch {
    return null; // deleted in the working tree but still tracked
  }
}

export function main(argv = process.argv.slice(2), log = console.log) {
  const r = spawnSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 ** 2 });
  if (r.status !== 0) { log(`error: git ls-files failed: ${r.stderr}`); return 2; }
  const leaks = scan(r.stdout.split("\0").filter(Boolean), readText);
  if (argv.includes("--json")) log(JSON.stringify({ leaks }, null, 2));
  else if (!leaks.length) log("home-path: clean");
  else for (const l of leaks) log(`home-path: ${l.file}:${l.line} contains this machine's home directory; write %USERPROFILE%, $HOME or ~`);
  return leaks.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
