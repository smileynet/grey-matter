#!/usr/bin/env node
// install-agents-md.mjs: install grey-matter's user-level AGENTS.md (global/AGENTS.md) into
// each harness's global instructions file. Sibling of install-skills.mjs; same safety contract.
//
// Usage:
//   node scripts/install-agents-md.mjs [install] [--dry-run] [--force] [--target <file> ...]
//   node scripts/install-agents-md.mjs list|uninstall [--dry-run] [--target <file> ...]
//
// Targets (default: each one whose harness dir exists on this machine):
//   kiro-cli    ~/.kiro/steering/AGENTS.md   (Kiro loads AGENTS.md there, always-on)
//   codex       ~/.codex/AGENTS.md
//   claude      ~/.claude/CLAUDE.md
//   opencode    ~/.config/opencode/AGENTS.md
// --target replaces the whole set (used by tests; never touches real files then).
//
// Ownership: an installed file starts with OWNER_MARK. A target without the mark is foreign:
// install refuses to overwrite it (unless --force) and uninstall never removes it.
// Size budget: the source must stay <= BUDGET_BYTES, because every harness pays for it on
// every turn. Install refuses to run over budget.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE = join(REPO, "global", "AGENTS.md");
export const BUDGET_BYTES = 3072;
export const OWNER_MARK = "<!-- installed by grey-matter (global/AGENTS.md): edit the source, then reinstall -->";

const H = homedir();
const KNOWN = [
  { harness: "kiro-cli", dir: join(H, ".kiro"), file: join(H, ".kiro", "steering", "AGENTS.md") },
  { harness: "codex", dir: join(H, ".codex"), file: join(H, ".codex", "AGENTS.md") },
  { harness: "claude", dir: join(H, ".claude"), file: join(H, ".claude", "CLAUDE.md") },
  { harness: "opencode", dir: join(H, ".config", "opencode"), file: join(H, ".config", "opencode", "AGENTS.md") },
];

function parseArgs(argv) {
  const a = { cmd: "install", dryRun: false, force: false, targets: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (["install", "list", "uninstall"].includes(x)) a.cmd = x;
    else if (x === "--dry-run") a.dryRun = true;
    else if (x === "--force") a.force = true;
    else if (x === "--target" && argv[i + 1]) a.targets.push(resolve(argv[++i]));
    else { console.error(`unknown argument: ${x}`); process.exit(2); }
  }
  if (!a.targets.length) a.targets = KNOWN.filter((k) => existsSync(k.dir)).map((k) => k.file);
  return a;
}

const owned = (file) => existsSync(file) && readFileSync(file, "utf8").startsWith(OWNER_MARK);

function install({ dryRun, force, targets }) {
  const body = readFileSync(SOURCE, "utf8");
  const size = Buffer.byteLength(body);
  if (size > BUDGET_BYTES) {
    console.error(`global/AGENTS.md is ${size} B, over the ${BUDGET_BYTES} B budget; trim it before installing.`);
    process.exit(1);
  }
  const content = `${OWNER_MARK}\n${body}`;
  let refused = 0;
  for (const file of targets) {
    let action;
    if (!existsSync(file)) action = "create";
    else if (owned(file)) action = readFileSync(file, "utf8") === content ? "current" : "update";
    else if (force) action = "replace";
    else { action = "refused"; refused++; }
    console.log(`  ${action.padEnd(8)} ${file}${action === "refused" ? " (foreign file; --force to overwrite)" : ""}`);
    if (dryRun || action === "refused" || action === "current") continue;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  console.log(`${dryRun ? "(dry-run) " : ""}${size} B source, ${targets.length - refused}/${targets.length} targets ok`);
  if (refused) process.exitCode = 1;
}

function list({ targets }) {
  for (const file of targets) console.log(`  ${owned(file) ? "installed" : existsSync(file) ? "foreign  " : "absent   "} ${file}`);
}

function uninstall({ dryRun, targets }) {
  for (const file of targets) {
    if (!owned(file)) { console.log(`  skip     ${file} (${existsSync(file) ? "foreign" : "absent"})`); continue; }
    console.log(`  remove   ${file}`);
    if (!dryRun) rmSync(file);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const a = parseArgs(process.argv.slice(2));
  ({ install, list, uninstall })[a.cmd](a);
}
