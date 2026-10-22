#!/usr/bin/env node
// survey-repos.mjs: rank sibling repos by freshness to pick adoption candidates
// (adopt-project portfolio mode). Read-only: runs only git log/status and reads a few files.
//
// Usage: node <skill-dir>/scripts/survey-repos.mjs [<parent-dir>] [--json] [--fresh-days N] [--warm-days N]
//          [--exclude name ...]   (repeatable: tool repos or retired projects that aren't candidates)
//   <parent-dir> defaults to the parent of the current git repo (its siblings).
//
// Per repo: last commit age, commits in the fresh window, dirty tree, incumbent agent layer
// (.memory/, AGENTS.md naming retired crew-research skills, a non-tkt tracker), and whether
// it is already adopted (GLOSSARY.md or docs/adr/ and no .memory/).
// Tiers: adopted | now (fresh + clean) | now-after-wip (fresh + dirty) | warm | dormant | no-layer.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RETIRED_SKILLS = ["read-handoff", "spec-driven-development", "project-cleanup", "study-reference",
  "study-all-references", "guidance-sync", "plan-ticket-sync", "planning-cycles", "recall", "recall-check",
  "research-methodology", "feedback-loop-debugging", "testing-guide", "adr-authoring", "git-protocol"];

const git = (repo, args) => {
  try { return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return ""; }
};
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };

export function surveyRepo(repo, { now = Date.now() / 1000, freshDays = 30, warmDays = 90 } = {}) {
  const last = Number(git(repo, ["log", "-1", "--format=%ct"])) || 0;
  const ageDays = last ? Math.floor((now - last) / 86400) : null;
  const since = Math.floor(now - freshDays * 86400);
  const recentCommits = Number(git(repo, ["rev-list", "--count", `--since=${since}`, "HEAD"])) || 0;
  const dirtyFiles = git(repo, ["status", "--porcelain"]).split("\n").filter(Boolean).length;
  const agents = existsSync(join(repo, "AGENTS.md")) ? readFileSync(join(repo, "AGENTS.md"), "utf8") : "";
  // Skill-style mentions only (`name`, /name, "name skill"), so plain English ("recall") doesn't match.
  const staleRefs = RETIRED_SKILLS.filter((s) =>
    new RegExp(`\`/?${s}\`|(?<![\\w/-])/${s}(?![\\w-])|(?<![\\w-])${s} skill`).test(agents));
  const memory = isDir(join(repo, ".memory"));
  const tracker = isDir(join(repo, ".tickets")) ? "tkt"
    : isDir(join(repo, ".beads")) ? "beads" : existsSync(join(repo, "TODO.md")) ? "TODO.md" : "none";
  const adopted = !memory && (existsSync(join(repo, "GLOSSARY.md")) || isDir(join(repo, "docs", "adr")));
  const hasLayer = memory || staleRefs.length > 0 || agents.length > 0 || tracker !== "none";
  let tier;
  if (adopted && !staleRefs.length) tier = "adopted";
  else if (!hasLayer) tier = "no-layer";
  else if (ageDays !== null && ageDays <= freshDays) tier = dirtyFiles ? "now-after-wip" : "now";
  else if (ageDays !== null && ageDays <= warmDays) tier = "warm";
  else tier = "dormant";
  return { name: basename(repo), path: repo, ageDays, recentCommits, dirtyFiles, memory, tracker, staleRefs, adopted, tier };
}

export function surveyParent(parent, opts = {}) {
  const exclude = new Set(opts.exclude ?? []);
  return readdirSync(parent)
    .filter((d) => !exclude.has(d))
    .map((d) => join(parent, d))
    .filter((p) => isDir(join(p, ".git")))
    .map((p) => surveyRepo(p, opts))
    .sort((a, b) => b.recentCommits - a.recentCommits || (a.ageDays ?? 1e9) - (b.ageDays ?? 1e9));
}

const TIER_ORDER = ["now", "now-after-wip", "warm", "dormant", "no-layer", "adopted"];
const TIER_LABEL = {
  now: "Adopt now (fresh, clean tree)",
  "now-after-wip": "Adopt now, after landing work in progress (fresh, dirty tree)",
  warm: "Warm: adopt on next real work",
  dormant: "Dormant: leave on the .memory/ fallback",
  "no-layer": "No agent layer (install-semantics if ever adopted)",
  adopted: "Already adopted",
};

function main(argv) {
  let parent = null, json = false, freshDays = 30, warmDays = 90;
  const exclude = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") json = true;
    else if (argv[i] === "--fresh-days") freshDays = Number(argv[++i]);
    else if (argv[i] === "--warm-days") warmDays = Number(argv[++i]);
    else if (argv[i] === "--exclude" && argv[i + 1]) exclude.push(argv[++i]);
    else if (!argv[i].startsWith("--")) parent = resolve(argv[i]);
    else { console.error(`unknown argument: ${argv[i]}`); process.exit(2); }
  }
  if (!parent) {
    const top = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
    if (!top) { console.error("not in a git repo; pass the parent dir"); process.exit(2); }
    parent = dirname(top);
  }
  const rows = surveyParent(parent, { freshDays, warmDays, exclude });
  if (json) { console.log(JSON.stringify(rows, null, 2)); return; }
  console.log(`${rows.length} repos under ${parent} (fresh <= ${freshDays}d, warm <= ${warmDays}d)${exclude.length ? `, excluded: ${exclude.join(", ")}` : ""}`);
  for (const t of TIER_ORDER) {
    const group = rows.filter((r) => r.tier === t);
    if (!group.length) continue;
    console.log(`\n## ${TIER_LABEL[t]} (${group.length})`);
    for (const r of group) {
      const bits = [`${r.ageDays ?? "?"}d ago`, `${r.recentCommits} commits/${freshDays}d`];
      if (r.dirtyFiles) bits.push(`${r.dirtyFiles} uncommitted`);
      if (r.memory) bits.push(".memory/");
      if (r.tracker !== "none") bits.push(r.tracker);
      if (r.staleRefs.length) bits.push(`stale refs: ${r.staleRefs.join(",")}`);
      console.log(`- ${r.name}: ${bits.join("; ")}`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main(process.argv.slice(2));
