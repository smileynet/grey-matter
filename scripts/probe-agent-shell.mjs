#!/usr/bin/env node
// probe-agent-shell.mjs: report whether this machine pins Claude Code's Bash tool to a modern bash
// (proposal 11, docs/agents/harnesses.md "Bash tool shell"). Report-only by default; --apply adds
// the env key to the user's settings, preserving every other key.
//
// Usage:
//   node scripts/probe-agent-shell.mjs [--apply] [--settings FILE]
//
// --settings defaults to ~/.claude/settings.json. --brew CMD, --platform NAME and
// --candidates A,B (preferred bash paths) exist for the tests.
// Exit: 0 = ok or not applicable; 1 = a finding (each printed with its fix); 2 = usage error.
//
// Not a check-*.mjs: it inspects the machine, not the repository, so check-repo runs only its
// tests (fake settings files and fake binaries; no real user file is read or written).

import { accessSync, constants, existsSync, readFileSync, writeFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const KEY = "CLAUDE_CODE_SHELL";
// Preferred bash per platform, first existing wins. Never /bin/bash on macOS: it is 3.2.
export const CANDIDATES = {
  darwin: ["/opt/homebrew/bin/bash", "/usr/local/bin/bash"],
  linux: ["/usr/bin/bash", "/bin/bash"],
};

function parseArgs(argv) {
  const a = { apply: false, settings: resolve(homedir(), ".claude", "settings.json"), brew: "brew", platform: process.platform, candidates: null };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--apply") a.apply = true;
    else if (["--settings", "--brew", "--platform", "--candidates"].includes(x) && argv[i + 1]) a[x.slice(2)] = argv[++i];
    else { console.error(`unknown argument: ${x}`); process.exit(2); }
  }
  return a;
}

/** Major version of the bash at `path`, or null if it isn't an executable bash. */
export function bashMajor(path) {
  try { accessSync(path, constants.X_OK); } catch { return null; }
  const r = spawnSync(path, ["--version"], { encoding: "utf8", timeout: 5000 });
  const m = /GNU bash, version (\d+)\./.exec(r.stdout ?? "");
  return m ? Number(m[1]) : null;
}

/** True when Homebrew installed bash only as a dependency (so `brew autoremove` may delete it). */
function brewDependencyOnly(brew) {
  const r = spawnSync(brew, ["info", "--json=v2", "bash"], { encoding: "utf8", timeout: 30000 });
  if (r.status !== 0) return false;
  try { return JSON.parse(r.stdout).formulae?.[0]?.installed?.[0]?.installed_on_request === false; } catch { return false; }
}

export function probe({ settings, brew, platform, candidates }) {
  if (!CANDIDATES[platform]) return { status: "n/a", findings: [], note: `${platform}: Claude Code uses Git Bash/PowerShell here` };
  const recommended = (candidates?.split(",") ?? CANDIDATES[platform]).find((p) => (bashMajor(p) ?? 0) >= 4);
  const fixKey = recommended
    ? `add "env": { "${KEY}": "${recommended}" } to ${settings} (or rerun with --apply), then restart Claude Code`
    : platform === "darwin" ? "brew install bash, then rerun" : "install bash 4 or later, then rerun";
  let cfg = {};
  if (existsSync(settings)) {
    try { cfg = JSON.parse(readFileSync(settings, "utf8")); } catch (e) {
      return { status: "finding", recommended, findings: [`${settings} is not valid JSON (${e.message}); fix it first`] };
    }
  }
  const value = cfg.env?.[KEY];
  const findings = [];
  if (!value) findings.push(`${KEY} is unset, so the Bash tool runs your login shell with its interactive aliases: ${fixKey}`);
  else if (/\/Cellar\//.test(value)) findings.push(`${KEY} is a versioned Cellar path (${value}); brew upgrade deletes it and Claude falls back to your login shell silently: use ${recommended ?? "the brew bin/ symlink"}`);
  else {
    const major = bashMajor(value);
    if (major === null) findings.push(`${KEY}=${value} is not an executable bash; Claude ignores it silently: ${fixKey}`);
    else if (major < 4) findings.push(`${KEY}=${value} is bash ${major} (no declare -A, mapfile, globstar): ${fixKey}`);
  }
  const brewPath = value && !findings.length ? value : recommended;
  if (platform === "darwin" && brewPath && realpathSync(brewPath).includes("/Cellar/bash/") && brewDependencyOnly(brew))
    findings.push("Homebrew installed bash only as a dependency, so brew autoremove can delete it: brew tab --installed-on-request bash");
  return { status: findings.length ? "finding" : "ok", value, recommended, findings, cfg };
}

/** Add the env key, keeping every other key. Returns false when there is nothing safe to write. */
export function apply({ settings }, result) {
  if (!result.recommended || result.cfg === undefined) return false;
  const cfg = { ...result.cfg, env: { ...(result.cfg.env ?? {}), [KEY]: result.recommended } };
  writeFileSync(settings, JSON.stringify(cfg, null, 2) + "\n");
  return true;
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))) {
  const a = parseArgs(process.argv.slice(2));
  let r = probe(a);
  if (r.status === "n/a") { console.log(`  n/a      ${r.note}`); process.exit(0); }
  if (a.apply && r.findings.some((f) => f.startsWith(KEY))) {
    if (apply(a, r)) { console.log(`  applied  ${KEY}=${r.recommended} in ${a.settings} (restart Claude Code)`); r = probe(a); }
  }
  if (r.status === "ok") console.log(`  ok       ${KEY}=${r.value}; verify after a restart: echo "$BASH_VERSION"`);
  for (const f of r.findings) console.log(`  finding  ${f}`);
  process.exit(r.status === "ok" ? 0 : 1);
}
