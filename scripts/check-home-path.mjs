#!/usr/bin/env node
// Check added text in outgoing commits; --all inventories the selected head's whole tree.
// Usage: node scripts/check-home-path.mjs [--base REF] [--head REF] [--all] [--json]
// Exit: 0=clean, 1=introduced leak (or inventory findings), 2=invalid scope/Git error.
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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
    const text = readText(file);
    if (text === null) continue;
    text.split("\n").forEach((line, i) => {
      if (forms.some((f) => line.toLowerCase().includes(f))) leaks.push({ file, line: i + 1 });
    });
  }
  return leaks;
}

export function audit({ repo = ROOT, base, head = "HEAD", all = false, home = homedir(), ranges } = {}) {
  const git = (...args) => {
    const r = spawnSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 ** 2 });
    if (r.error || r.status !== 0) throw new Error(`git ${args[0]} failed: ${r.error?.message ?? r.stderr.trim()}`);
    return r.stdout;
  };
  const commit = (ref) => git("rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`).trim();
  const tip = commit(head);
  if (all) {
    const files = git("ls-tree", "-rz", "--name-only", tip).split("\0").filter(Boolean);
    const leaks = scan(files, (file) => {
      const text = git("show", `${tip}:${file}`);
      return text.includes("\0") ? null : text;
    }, home);
    return { status: leaks.length ? "fail" : "pass", scope: { mode: "inventory", head: tip }, metrics: { files: files.length }, leaks };
  }
  if (ranges === undefined) {
    if (base !== undefined) ranges = [[`${commit(base)}..${tip}`]];
    else {
      const origin = spawnSync("git", ["show-ref", "--verify", "--quiet", "refs/remotes/origin/main"], { cwd: repo });
      if (origin.status === 0) ranges = [[`${git("merge-base", tip, "origin/main").trim()}..${tip}`]];
      else if (origin.status === 1) ranges = [[tip]];
      else throw new Error("cannot determine the origin/main baseline");
    }
  }
  // Range metadata crosses the runner/CLI boundary; unknown scope must never pass.
  const sha = "[0-9a-f]{40,64}";
  if (!Array.isArray(ranges) || !ranges.length || ranges.some((r) => !Array.isArray(r) ||
      !(r.length === 1 && new RegExp(`^${sha}(?:\\.\\.${sha})?$`).test(r[0]) ||
        r.length >= 3 && new RegExp(`^${sha}$`).test(r[0]) && r[1] === "--not" && r.slice(2).every((ref) => new RegExp(`^${sha}$`).test(ref))))) {
    throw new Error("invalid or unknown gate revision scope");
  }
  const commits = [...new Set(ranges.flatMap((r) => git("rev-list", "--reverse", ...r).trim().split("\n").filter(Boolean)))];
  const forms = needles(home).map((n) => n.toLowerCase());
  const leaks = [];
  let files = 0, addedLines = 0;
  for (const revision of commits) {
    // Raw -z names avoid guessing at quoted paths; patch sections use the same file order.
    const data = git("-c", "core.quotePath=false", "show", "--format=", "--raw", "-z", "--patch",
      "--root", "--find-renames", "--diff-merges=combined", "--unified=0", "--no-color", "--no-ext-diff", "--no-textconv", revision);
    if (!data) continue;
    const boundary = data.indexOf("\0\0");
    if (boundary < 0) throw new Error("Git returned a patch without its raw file inventory");
    const raw = data.slice(0, boundary).split("\0"), inventory = [];
    for (let i = 0; i < raw.length;) {
      const header = raw[i++], parents = header.match(/^:+/)?.[0].length;
      if (!parents || i >= raw.length) throw new Error("invalid Git raw file record");
      let file = raw[i++];
      if (parents === 1 && / [RC]\d+$/.test(header)) file = raw[i++];
      if (file === undefined) throw new Error("missing Git rename destination");
      inventory.push({ file, parents });
    }
    files += inventory.length;
    let index = -1, lineNumber = null;
    for (const line of data.slice(boundary + 2).split("\n")) {
      if (/^diff --(?:git|combined|cc) /.test(line)) { index++; lineNumber = null; continue; }
      const hunk = /^@{2,}(?: -\d+(?:,\d+)?)+ \+(\d+)(?:,\d+)? @{2,}/.exec(line);
      if (hunk) { lineNumber = Number(hunk[1]); continue; }
      if (lineNumber === null || !line || line.startsWith("\\")) continue;
      const item = inventory[index];
      if (!item) throw new Error("Git patch and file inventory disagree");
      const prefix = line.slice(0, item.parents);
      if (!/^[ +\-]+$/.test(prefix) || prefix.includes("-")) continue;
      // Combined merge patches flag only text newly added against every parent.
      if (prefix === "+".repeat(item.parents)) {
        addedLines++;
        if (forms.some((f) => line.slice(item.parents).toLowerCase().includes(f))) {
          leaks.push({ commit: revision, file: item.file, line: lineNumber });
        }
      }
      lineNumber++;
    }
    if (index + 1 !== inventory.length) throw new Error("Git patch and file counts disagree");
  }
  return { status: leaks.length ? "fail" : "pass", scope: { mode: "introduced", ranges }, metrics: { commits: commits.length, files, addedLines }, leaks };
}

export function main(argv = process.argv.slice(2), log = console.log) {
  const options = {};
  try {
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === "--all" || arg === "--json") options[arg.slice(2)] = true;
      else if ((arg === "--base" || arg === "--head") && argv[i + 1]) options[arg.slice(2)] = argv[++i];
      else throw new Error(`unknown/incomplete option: ${arg}`);
    }
    if (options.all && options.base !== undefined) throw new Error("--all and --base are mutually exclusive");
    if (!options.all && options.base === undefined && options.head === undefined && process.env.GM_GATE_RANGES !== undefined) {
      options.ranges = JSON.parse(process.env.GM_GATE_RANGES);
    }
    const result = audit(options);
    if (options.json) log(JSON.stringify(result));
    else if (!result.leaks.length) log(`home-path: clean (${result.scope.mode}, ${result.metrics.commits ?? 1} commit(s))`);
    else for (const leak of result.leaks) log(`home-path: ${leak.file}:${leak.line}${leak.commit ? ` at ${leak.commit.slice(0, 12)}` : ""} ${options.all ? "contains" : "introduces"} this machine's home directory; use ~, $HOME or %USERPROFILE%`);
    return result.leaks.length ? 1 : 0;
  } catch (error) {
    log(options.json ? JSON.stringify({ status: "error", errors: [error.message] }) : `home-path: error: ${error.message}`);
    return 2;
  }
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
