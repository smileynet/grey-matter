#!/usr/bin/env node
// check-docs-consistency.mjs — two read-only documentation invariants (ticket 31):
//
//   1. INDEX set-equality: every skill folder on disk is listed in its bucket README
//      (under an invocation-tier section) exactly once and is mentioned by name in
//      compass; every skill a bucket README links resolves to a real folder.
//      (The maintenance-skills "set-equality lint".)
//   2. LINKS: every real relative markdown link in the committed docs/skills tree
//      resolves to a file that exists (catches the ../GLOSSARY.md-class bug, ticket 30).
//
// Read-only: it opens files and checks the filesystem; it mutates nothing.
// Exit 0 = consistent, 1 = at least one problem (details on stderr).
// Run:  node scripts/check-docs-consistency.mjs
//
// Notes on deliberate design:
//  - compass is a PROSE map: it mentions skills by bold name, not as SKILL.md links,
//    so the compass check is "is each skill's name present", not "is it linked".
//  - cheat-sheet is generated live from disk each run, so it cannot drift and is not
//    a static index to check here.
//  - A bucket README's intro sentence may mention compass/curate-docs navigationally;
//    the set-equality check only counts links under the "## ...invoked" tier sections.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(REPO, "skills");
const COMPASS = join(SKILLS_DIR, "meta", "compass", "SKILL.md");

const problems = [];
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

// --- Enumerate skills on disk --------------------------------------------------
const skills = []; // { name, bucket }
for (const bucket of readdirSync(SKILLS_DIR)) {
  const bp = join(SKILLS_DIR, bucket);
  if (!isDir(bp)) continue;
  for (const name of readdirSync(bp)) {
    if (isDir(join(bp, name)) && isFile(join(bp, name, "SKILL.md"))) {
      skills.push({ name, bucket });
    }
  }
}
const onDisk = new Set(skills.map((s) => s.name));

// =============================================================================
// Check 1 — index set-equality
// =============================================================================

// 1a. compass must MENTION every skill by name (it's a prose map, not a link index).
if (!existsSync(COMPASS)) {
  problems.push("compass SKILL.md missing");
} else {
  const compassText = readFileSync(COMPASS, "utf8");
  for (const s of skills) {
    // Whole-word match on the skill name (hyphens are literal).
    const re = new RegExp(`\\b${s.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`);
    if (!re.test(compassText)) {
      problems.push(`compass: does not mention skill "${s.name}" (${s.bucket}/${s.name} on disk)`);
    }
  }
}

// Collect the `.../name/SKILL.md` links that appear under the invocation-tier
// sections ("## User-invoked", "## Model-invoked", "## Agent-only") of a README.
function tierSkillLinks(readmeText) {
  const names = [];
  let inTier = false;
  for (const line of readmeText.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { inTier = /invoked|agent[- ]only/i.test(h[1]); continue; }
    if (!inTier) continue;
    for (const m of line.matchAll(/\]\(([^)]*?\/)?([a-z0-9-]+)\/SKILL\.md\)/g)) names.push(m[2]);
  }
  return names;
}

// 1b. each bucket README lists its own skills exactly once (within tier sections),
// links no ghost, and may cross-list a skill from another bucket (e.g. grilling).
for (const bucket of new Set(skills.map((s) => s.bucket))) {
  const readme = join(SKILLS_DIR, bucket, "README.md");
  if (!existsSync(readme)) { problems.push(`${bucket}: README.md missing`); continue; }
  const listed = tierSkillLinks(readFileSync(readme, "utf8"));
  const listedSet = new Set(listed);

  for (const s of skills.filter((x) => x.bucket === bucket)) {
    if (!listedSet.has(s.name)) problems.push(`${bucket}/README.md: missing own skill "${s.name}"`);
  }
  const seen = new Set();
  for (const n of listed) {
    if (seen.has(n)) problems.push(`${bucket}/README.md: "${n}" listed more than once`);
    seen.add(n);
  }
  for (const n of listedSet) {
    if (!onDisk.has(n)) problems.push(`${bucket}/README.md: lists "${n}" which is not a skill folder on disk`);
  }
}

// =============================================================================
// Check 2 — relative links resolve
// =============================================================================
function walkMd(dir, acc) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git") continue;
    const p = join(dir, entry);
    if (isDir(p)) walkMd(p, acc);
    else if (entry.endsWith(".md")) acc.push(p);
  }
  return acc;
}

const mdFiles = [];
for (const root of ["docs", "skills"]) {
  const rp = join(REPO, root);
  if (isDir(rp)) walkMd(rp, mdFiles);
}
for (const top of ["README.md", "AGENTS.md", "GLOSSARY.md", "CHANGELOG.md", "CLAUDE.md"]) {
  const p = join(REPO, top);
  if (isFile(p)) mdFiles.push(p);
}

const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;
// A link target is a "real path" worth checking only if it looks like one: it has a
// path separator or a file extension. This skips template placeholders like
// `[<title>](link)` and bare-word examples that are documentation, not navigation.
const looksLikePath = (t) => t.includes("/") || /\.[a-z0-9]+$/i.test(t);
for (const file of mdFiles) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(LINK_RE)) {
    let target = m[1].trim().split(/\s+/)[0]; // drop any "title"
    if (!target) continue;
    if (/^(https?:|mailto:|#)/i.test(target)) continue;
    if (/^[a-z]+:\/\//i.test(target)) continue;
    if (target.includes("<") || target.includes(">")) continue; // placeholder
    const pathPart = target.split("#")[0];
    if (!pathPart || !looksLikePath(pathPart)) continue;
    if (!existsSync(resolve(dirname(file), pathPart))) {
      problems.push(`${relative(REPO, file)}: broken link -> ${target}`);
    }
  }
}

// =============================================================================
if (problems.length) {
  console.error(`docs-consistency check FAILED (${problems.length} problem(s)):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(
  `docs-consistency check OK: ${skills.length} skills — each listed once in its bucket ` +
  `README and mentioned in compass; all real relative links in docs/ and skills/ resolve.`,
);
