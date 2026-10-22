#!/usr/bin/env node
// relocate-knowledge.mjs: move committed knowledge out of a dot-prefixed dir (e.g. `.memory/`)
// into grey-matter paths and rewrite every reference to it. Used by `adopt-project` (Step 3,
// subsume-semantics); see docs/agents/proposals/05-adopt-project-pilot-revisions.md R2.
//
// Usage:
//   node <skill-dir>/scripts/relocate-knowledge.mjs <repo> [--apply] [--map old=new ...] [--evidence-ext .json ...]
//        [--evidence-dir <old-path-prefix> ...]
//   node <skill-dir>/scripts/relocate-knowledge.mjs check-links <repo> [--skip <path-prefix> ...]
//
// Dry-run by default. With no --map, uses the default map for the common incumbent layout
// (DEFAULT_MAP below). --evidence-ext replaces the default list of evidence extensions.
//
// Rules:
//  - Markdown links are rewritten by LOCATION, not by string: each relative target is resolved
//    against the file's old path, mapped, then re-relativized from the file's new path. This
//    survives depth changes and links between two moved files.
//  - Repo-rooted mentions (`.memory/specs/x.md` in prose or code) are prefix-mapped.
//  - Recorded evidence (JSON, logs, transcripts) is never rewritten: it records what was observed.
//    Evidence is matched by extension, or by --evidence-dir (an old-path prefix, e.g.
//    .memory/evidence/) for evidence trees holding .md/.txt/.py records whose digests are pinned.
//  - Leftover mentions of an old root are reported for a human, never rewritten blindly.
//  - check-links: relative markdown links in tracked .md files that don't resolve, skipping
//    fenced code and inline code spans. Run it before and after to prove nothing broke.
//
// Exit: 0 ok; 1 check-links found broken links; 2 usage or git error.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, realpathSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_MAP = [
  [".memory/CONTEXT.md", "GLOSSARY.md"],
  [".memory/adr/", "docs/adr/"],
  [".memory/specs/", "docs/agents/specs/"],
  [".memory/research/", "docs/agents/research/"],
  [".memory/grill/", "docs/agents/grill/"],
  [".memory/spikes/", "docs/agents/spikes/"],
];
export const DEFAULT_EVIDENCE_EXT = [".json", ".jsonl", ".log", ".ndjson"];

const p = posix;
const norm = (s) => p.normalize(s.replaceAll("\\", "/"));

export function mapPath(path, map) {
  const n = norm(path);
  for (const [oldP, newP] of [...map].sort((a, b) => b[0].length - a[0].length)) {
    const o = oldP.replace(/\/$/, "");
    if (n === o) return newP.replace(/\/$/, "");
    if (oldP.endsWith("/") && n.startsWith(o + "/")) return newP.replace(/\/$/, "") + n.slice(o.length);
  }
  return null;
}

const LINK = /(\]\()([^)\s]+)(\))/g;
const SKIP_TARGET = /^([a-z][a-z0-9+.-]*:|#|\/|<|\{)/i;

// Link rewriting skips fenced code blocks and inline code spans: link-shaped text there is an
// example (e.g. asm `tbl[idx](x)`), not a link. Repo-rooted path mentions are still rewritten
// everywhere by rewriteRooted, since commands in fences cite real paths.
export function rewriteLinks(text, oldFile, newFile, map) {
  let fence = false;
  return text.split("\n").map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return line; }
    if (fence) return line;
    return line.split(/(`[^`]*`)/).map((part, i) => (i % 2 ? part : rewriteLinkPart(part, oldFile, newFile, map))).join("");
  }).join("\n");
}

function rewriteLinkPart(text, oldFile, newFile, map) {
  return text.replace(LINK, (whole, open, target, close) => {
    if (SKIP_TARGET.test(target)) return whole;
    const [path, ...frag] = target.split("#");
    if (!path) return whole;
    const resolved = norm(p.join(p.dirname(oldFile), path));
    const mapped = mapPath(resolved, map) ?? resolved;
    if (mapped === resolved && oldFile === newFile) return whole;
    let rel = p.relative(p.dirname(newFile), mapped) || ".";
    if (path.endsWith("/") && !rel.endsWith("/")) rel += "/";
    return open + rel + (frag.length ? "#" + frag.join("#") : "") + close;
  });
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function rewriteRooted(text, map) {
  const roots = [...new Set(map.map(([o]) => o.split("/")[0]))];
  const re = new RegExp(`(?<![\\w./-])(?:${roots.map(escapeRe).join("|")})/[\\w./-]*`, "g");
  return text.replace(re, (m) => {
    let s = m, tail = "";
    while (s && ".,".includes(s.at(-1))) { tail = s.at(-1) + tail; s = s.slice(0, -1); }
    let mapped = mapPath(s, map);
    if (mapped === null) return m;
    if (s.endsWith("/") && !mapped.endsWith("/")) mapped += "/";
    return mapped + tail;
  });
}

const git = (repo, args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" });
const tracked = (repo, pattern) =>
  git(repo, ["ls-files", "-z", ...(pattern ? [pattern] : [])]).split("\0").filter(Boolean);

export function relocate(repo, { map = DEFAULT_MAP, evidenceExt = DEFAULT_EVIDENCE_EXT, evidenceDirs = [], apply = false } = {}) {
  const roots = [...new Set(map.map(([o]) => o.split("/")[0]))];
  const rootRe = new RegExp(`(?<![\\w-])(?:${roots.map(escapeRe).join("|")})(?![\\w-])`);
  const rewritten = [], leftovers = [], skippedEvidence = [];
  for (const oldF of tracked(repo)) {
    const newF = mapPath(oldF, map) ?? oldF;
    const abs = join(repo, oldF);
    if (evidenceExt.some((e) => oldF.endsWith(e)) || evidenceDirs.some((d) => oldF.startsWith(d))) {
      if (roots.some((r) => existsSync(abs) && readFileSync(abs, "utf8").includes(r + "/"))) skippedEvidence.push(newF);
      continue;
    }
    let text;
    try { text = readFileSync(abs, "utf8"); } catch { continue; }
    if (text.includes("\0")) continue; // binary
    const out = rewriteRooted(rewriteLinks(text, oldF, newF, map), map);
    out.split("\n").forEach((line, i) => {
      if (rootRe.test(line)) {
        leftovers.push(`${newF}:${i + 1}: ${line.trim().slice(0, 140)}`);
      }
    });
    if (out !== text) {
      rewritten.push(oldF);
      if (apply) writeFileSync(abs, out);
    }
  }
  const moves = [];
  for (const [oldP, newP] of map) {
    const o = oldP.replace(/\/$/, ""), n = newP.replace(/\/$/, "");
    if (!existsSync(join(repo, o))) continue;
    if (existsSync(join(repo, n))) throw new Error(`refusing to move ${o}: ${n} already exists (merge by hand)`);
    moves.push([o, n]);
    if (apply) {
      mkdirSync(dirname(join(repo, n)), { recursive: true });
      git(repo, ["mv", o, n]);
    }
  }
  return { rewritten, moves, leftovers, skippedEvidence };
}

export function checkLinks(repo, { skip = [] } = {}) {
  const broken = [];
  const files = tracked(repo, "*.md").filter((f) => !skip.some((s) => f.startsWith(s)));
  for (const f of files) {
    let fence = false;
    readFileSync(join(repo, f), "utf8").split("\n").forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
      if (fence) return;
      for (const [, , target] of line.replace(/`[^`]*`/g, "").matchAll(LINK)) {
        if (SKIP_TARGET.test(target)) continue;
        const path = target.split("#")[0];
        if (path && !existsSync(join(repo, dirname(f), path))) broken.push(`${f}:${i + 1}: ${target}`);
      }
    });
  }
  return { files: files.length, broken };
}

function main(argv) {
  const usage = () => { console.error("usage: relocate-knowledge.mjs <repo> [--apply] [--map old=new ...] [--evidence-ext .ext ...] [--evidence-dir <prefix> ...]\n       relocate-knowledge.mjs check-links <repo> [--skip <prefix> ...]"); process.exit(2); };
  if (argv[0] === "check-links") {
    if (!argv[1]) usage();
    const skip = [];
    for (let i = 2; i < argv.length; i++) {
      if (argv[i] === "--skip" && argv[i + 1]) skip.push(argv[++i]);
      else usage();
    }
    const { files, broken } = checkLinks(argv[1], { skip });
    console.log(`${files} md files, ${broken.length} broken relative links`);
    broken.forEach((b) => console.log("  " + b));
    process.exit(broken.length ? 1 : 0);
  }
  const repo = argv[0];
  if (!repo || repo.startsWith("--")) usage();
  const map = [], evidenceExt = [], evidenceDirs = [];
  let apply = false;
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === "--apply") apply = true;
    else if (argv[i] === "--map" && argv[i + 1]?.includes("=")) map.push(argv[++i].split("="));
    else if (argv[i] === "--evidence-ext" && argv[i + 1]) evidenceExt.push(argv[++i]);
    else if (argv[i] === "--evidence-dir" && argv[i + 1]) evidenceDirs.push(argv[++i]);
    else usage();
  }
  try {
    const r = relocate(repo, { map: map.length ? map : DEFAULT_MAP, evidenceExt: evidenceExt.length ? evidenceExt : DEFAULT_EVIDENCE_EXT, evidenceDirs, apply });
    console.log(`${apply ? "applied" : "dry-run"}: ${r.moves.length} moves, ${r.rewritten.length} files rewritten`);
    r.moves.forEach(([o, n]) => console.log(`  move ${o} -> ${n}`));
    console.log(`evidence files left untouched that mention an old root: ${r.skippedEvidence.length}`);
    console.log(`leftover old-root mentions (review by hand): ${r.leftovers.length}`);
    r.leftovers.forEach((l) => console.log("  " + l));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))) {
  main(process.argv.slice(2));
}
