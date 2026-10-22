#!/usr/bin/env node
// uninstall-crew-research.mjs: remove a crew-research global deployment, and only that.
// One-shot migration tool for the crew-research -> grey-matter cutover (proposal 04,
// ticket 49). crew-research ships no uninstall, and its own tier-based prune once deleted
// 13 unrelated skills, so this removes ONLY what crew-research's manifests name.
//
// Usage: node scripts/uninstall-crew-research.mjs [--apply] [--home <dir>] [--backup <file>]
//   Dry-run by default. --apply snapshots first (tar.gz), then removes.
//   --home points every path at a different home dir (tests use a throwaway one).
//
// What it removes:
//   - skill dirs listed in  ~/.kiro/.crew-skills              (from ~/.kiro/skills)
//                           ~/.agents/skills/.crew-skills-codex|-crush (from ~/.agents/skills)
//   - the manifests themselves and ~/.kiro/.crew-tier
//   - top-level REGULAR files in ~/.kiro/steering whose name is in CREW_STEERING
//     (symlinks, subdirs such as amazon-builder/ and references/, and any other file are kept)
//   - ~/.codex/AGENTS.md, only if its header says crew-research generated it
// It never removes a name that a grey-matter manifest owns, and never follows a symlink.
//
// Restore: tar -xzf <backup> -C <home>   (the snapshot stores home-relative paths)

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const CREW_STEERING = [
  "ai-generation-hygiene", "context-budget-awareness", "image-handling", "project-conventions",
  "recall-check", "recall-session-start", "research-dispatch-mandate", "source-authority",
  "subagent-reliability", "verification-protocol",
].map((n) => `${n}.md`);
const GM_MANIFEST = ".installed-by-grey-matter.json";

const lines = (f) => (existsSync(f) ? readFileSync(f, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : []);
const isLink = (p) => { try { return lstatSync(p).isSymbolicLink(); } catch { return false; } };
const exists = (p) => { try { lstatSync(p); return true; } catch { return false; } };

export function plan(home) {
  const kiroSkills = join(home, ".kiro", "skills");
  const agentsSkills = join(home, ".agents", "skills");
  const manifests = [
    { file: join(home, ".kiro", ".crew-skills"), root: kiroSkills },
    { file: join(agentsSkills, ".crew-skills-codex"), root: agentsSkills },
    { file: join(agentsSkills, ".crew-skills-crush"), root: agentsSkills },
  ];
  const gmOwned = (root) => {
    try { return new Set(JSON.parse(readFileSync(join(root, GM_MANIFEST), "utf8")).installed || []); }
    catch { return new Set(); }
  };
  const remove = [], keep = [];
  const seen = new Set();
  for (const { file, root } of manifests) {
    const owned = gmOwned(root);
    for (const name of lines(file)) {
      const p = join(root, name);
      if (seen.has(p) || !exists(p)) continue;
      seen.add(p);
      if (name.includes("/") || name.startsWith(".")) keep.push([p, "unsafe manifest entry"]);
      else if (owned.has(name)) keep.push([p, "owned by grey-matter"]);
      else if (isLink(p)) keep.push([p, "symlink"]);
      else remove.push(p);
    }
    if (exists(file)) remove.push(file);
  }
  const tier = join(home, ".kiro", ".crew-tier");
  if (exists(tier)) remove.push(tier);
  const steering = join(home, ".kiro", "steering");
  for (const f of CREW_STEERING) {
    const p = join(steering, f);
    if (!exists(p)) continue;
    if (isLink(p) || !lstatSync(p).isFile()) keep.push([p, "not a regular file"]);
    else remove.push(p);
  }
  const codex = join(home, ".codex", "AGENTS.md");
  if (exists(codex)) {
    if (!isLink(codex) && /crew-research/.test(readFileSync(codex, "utf8").split("\n").slice(0, 3).join("\n"))) remove.push(codex);
    else keep.push([codex, "not crew-generated"]);
  }
  return { remove, keep };
}

function main(argv) {
  let apply = false, home = homedir(), backup = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--apply") apply = true;
    else if (argv[i] === "--home" && argv[i + 1]) home = resolve(argv[++i]);
    else if (argv[i] === "--backup" && argv[i + 1]) backup = resolve(argv[++i]);
    else { console.error(`unknown argument: ${argv[i]}`); process.exit(2); }
  }
  const { remove, keep } = plan(home);
  // Report POSIX-style paths so the `remove <path>` / `keep <path>` lines are stable
  // across OSes (on Windows join() yields backslashes, which broke consumers and tests).
  const rel = (p) => p.slice(home.length + 1).split(sep).join("/");
  console.log(`${apply ? "apply" : "dry-run"}: ${remove.length} to remove, ${keep.length} kept on purpose`);
  remove.forEach((p) => console.log(`  remove ${rel(p)}`));
  keep.forEach(([p, why]) => console.log(`  keep   ${rel(p)} (${why})`));
  if (!apply || !remove.length) return;
  backup ??= join(home, ".local", "share", "grey-matter", `crew-research-snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}.tar.gz`);
  mkdirSync(dirname(backup), { recursive: true });
  const snap = [".kiro/skills", ".kiro/steering", ".kiro/.crew-skills", ".kiro/.crew-tier", ".agents/skills", ".codex/AGENTS.md"].filter((p) => exists(join(home, p)));
  execFileSync("tar", ["-czf", backup, "-C", home, ...snap]);
  console.log(`snapshot: ${backup}  (restore: tar -xzf ${backup} -C ${home})`);
  for (const p of remove) rmSync(p, { recursive: true, force: true });
  console.log(`removed ${remove.length}.`);
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))) main(process.argv.slice(2));
