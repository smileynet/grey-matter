#!/usr/bin/env node
// install-hooks.mjs — opt-in installer for the grey-matter pre-commit consistency hook
// (ticket 35).
//
// Copies scripts/hooks/pre-commit into .git/hooks/pre-commit so that
// `node scripts/check-repo.mjs` runs locally before every commit and blocks on a nonzero
// exit. This project uses local hooks only (no CI), so the hook is the automated gate.
//
// Deliberately OPT-IN: nothing installs this automatically on clone. A maintainer who
// wants the local gate runs this once.
//
// Safe by design:
//  - Refuses to overwrite a pre-existing pre-commit hook it did not write (a foreign
//    hook), the same ownership caution as the skills installer. Use `uninstall` or move it
//    aside first.
//  - Idempotent: re-running `install` when our hook is already in place is a no-op.
//  - Read-only on everything except .git/hooks/pre-commit.
//
// Usage:
//   node scripts/install-hooks.mjs            # install (default)
//   node scripts/install-hooks.mjs list       # show current pre-commit hook status
//   node scripts/install-hooks.mjs uninstall  # remove our hook (only if we own it)

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, chmodSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HOOK = "pre-commit";
const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SCRIPTS, "..");
const SOURCE = join(SCRIPTS, "hooks", HOOK);

// A marker line present in our hook source; lets us recognize a hook we own vs a foreign one.
const OWNED_MARKER = "grey-matter pre-commit hook";

function gitHooksDir() {
  // Honor a custom core.hooksPath if one is configured; otherwise default to .git/hooks.
  const r = spawnSync("git", ["rev-parse", "--git-path", "hooks"], { cwd: REPO, encoding: "utf8" });
  if (r.status === 0 && r.stdout.trim()) {
    return resolve(REPO, r.stdout.trim());
  }
  return join(REPO, ".git", "hooks");
}

const cmd = process.argv[2] || "install";
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
try { chmodSync(target, 0o755); } catch { /* chmod is a no-op / may throw on some FS; mode above covers it */ }
console.log(`Installed grey-matter ${HOOK} hook -> ${target}`);
console.log("It runs `node scripts/check-repo.mjs` before each commit and blocks on failure.");
console.log("Bypass a single commit with: git commit --no-verify");
