#!/usr/bin/env node
// Opt-in ownership-guarded installer. Default: pre-commit; select --hook pre-push.
// Usage: node scripts/install-hooks.mjs [install|list|uninstall] [--hook NAME]

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, chmodSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SCRIPTS, "..");
const args = process.argv.slice(2);
let cmd = "install";
let HOOK = "pre-commit";
if (args.length && !args[0].startsWith("--")) cmd = args.shift();
if (args[0] === "--hook" && args.length === 2) HOOK = args.splice(0, 2)[1];
if (args.length || !["pre-commit", "pre-push"].includes(HOOK) || !["install", "list", "uninstall"].includes(cmd)) {
  console.error("Usage: install-hooks.mjs [install|list|uninstall] [--hook pre-commit|pre-push]");
  process.exit(1);
}
const SOURCE = HOOK === "pre-push" ? join(REPO, ".githooks", HOOK) : join(SCRIPTS, "hooks", HOOK);

// A marker line present in our hook source; lets us recognize a hook we own vs a foreign one.
const OWNED_MARKER = `grey-matter ${HOOK} hook`;

function gitHooksDir() {
  // Honor a custom core.hooksPath if one is configured; otherwise default to .git/hooks.
  const r = spawnSync("git", ["rev-parse", "--git-path", "hooks"], { cwd: REPO, encoding: "utf8" });
  if (r.status === 0 && r.stdout.trim()) {
    return resolve(REPO, r.stdout.trim());
  }
  throw new Error(`Cannot resolve Git hooks directory: ${r.stderr || r.error?.message}`);
}

const target = join(gitHooksDir(), HOOK);

function status() {
  if (!existsSync(target)) return "absent";
  const body = readFileSync(target, "utf8");
  return body.includes(OWNED_MARKER) ? "ours" : "foreign";
}

if (cmd === "list") {
  const s = status();
  const msg = {
    absent: `${HOOK} hook: not installed.`,
    ours: `${HOOK} hook: installed (grey-matter) at ${target}`,
    foreign: `${HOOK} hook: a NON-grey-matter hook exists at ${target} (left untouched).`,
  }[s];
  console.log(msg);
  process.exit(0);
}

if (cmd === "uninstall") {
  const s = status();
  if (s === "absent") { console.log(`${HOOK} hook: nothing to uninstall.`); process.exit(0); }
  if (s === "foreign") {
    console.error(`REFUSED: ${target} is not a grey-matter hook; not removing it.`);
    process.exit(1);
  }
  if (target === SOURCE) {
    console.error(`REFUSED: ${target} is the tracked hook source; change core.hooksPath to disable it.`);
    process.exit(1);
  }
  rmSync(target);
  console.log(`Removed grey-matter ${HOOK} hook: ${target}`);
  process.exit(0);
}

if (cmd !== "install") {
  console.error(`Unknown command "${cmd}". Use: install | list | uninstall`);
  process.exit(1);
}

// install
if (!existsSync(SOURCE)) {
  console.error(`Missing hook source: ${SOURCE}`);
  process.exit(1);
}
const s = status();
if (s === "foreign") {
  console.error(
    `REFUSED: a ${HOOK} hook that grey-matter did not write already exists at\n  ${target}\n` +
    `Move it aside (or merge its logic) first; this installer will not clobber a foreign hook.`,
  );
  process.exit(1);
}

const source = readFileSync(SOURCE, "utf8");
if (s === "ours" && readFileSync(target, "utf8") === source) {
  console.log(`${HOOK} hook already installed and current: ${target}`);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, source, { mode: 0o755 });
chmodSync(target, 0o755);
console.log(`Installed grey-matter ${HOOK} hook -> ${target}`);
console.log(`It runs \`node scripts/check-repo.mjs\` before each ${HOOK === "pre-push" ? "push" : "commit"} and blocks on failure.`);
