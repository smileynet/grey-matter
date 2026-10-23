#!/usr/bin/env node
// check-plugin-manifest.mjs — the Claude Code plugin manifests stay true to disk (ticket 22).
//
//   1. COVERAGE: .claude-plugin/plugin.json's `skills` names exactly the bucket dirs that
//      hold skills (skills/<bucket>/<name>/SKILL.md). A new bucket left out of the manifest
//      would ship as silently missing skills; a listed dir that's gone fails to load.
//   2. VERSION: plugin.json's `version` is not behind the latest vX.Y.Z tag. Claude Code
//      caches a plugin by version, so a stale one means installed users never update.
//      (The release skill's release.sh bumps it; this catches a hand-cut tag.)
//   3. MARKETPLACE: .claude-plugin/marketplace.json lists this plugin with source "./" and
//      no entry `version` (plugin.json's would win anyway, and validate warns).
//   4. VALIDATE: `claude plugin validate` passes, when `claude` is on PATH (skipped with a
//      note otherwise). Not --strict: the repo-root CLAUDE.md warning is expected.
//
// Read-only. Exit 0 = consistent, 1 = at least one problem (details on stderr).
// Run:  node scripts/check-plugin-manifest.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = join(REPO, ".claude-plugin", "plugin.json");
const MARKETPLACE = join(REPO, ".claude-plugin", "marketplace.json");

const problems = [];
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (e) { problems.push(`${path.slice(REPO.length + 1)}: ${e.message}`); return null; }
}

const plugin = readJson(PLUGIN);
const marketplace = readJson(MARKETPLACE);

// --- 1. coverage ----------------------------------------------------------------
if (plugin) {
  const norm = (p) => p.replace(/^\.\//, "").replace(/\/$/, "");
  const listed = new Set([].concat(plugin.skills ?? []).map(norm));
  const buckets = new Set();
  for (const bucket of readdirSync(join(REPO, "skills"))) {
    const bp = join(REPO, "skills", bucket);
    if (!isDir(bp)) continue;
    if (readdirSync(bp).some((n) => isFile(join(bp, n, "SKILL.md")))) buckets.add(`skills/${bucket}`);
  }
  for (const b of buckets) {
    if (!listed.has(b)) problems.push(`plugin.json skills is missing "./${b}" (its skills would not load)`);
  }
  for (const l of listed) {
    if (!buckets.has(l)) problems.push(`plugin.json skills lists "./${l}", which holds no skills`);
  }
}

// --- 2. version -----------------------------------------------------------------
const semver = (v) => (/^v?(\d+)\.(\d+)\.(\d+)$/.exec(v) || []).slice(1).map(Number);
const behind = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i]; return false; };
if (plugin) {
  const v = semver(plugin.version ?? "");
  if (v.length !== 3) {
    problems.push(`plugin.json version "${plugin.version}" is not X.Y.Z`);
  } else {
    const tags = spawnSync("git", ["tag", "--list", "v*"], { cwd: REPO, encoding: "utf8" }).stdout || "";
    const latest = tags.split(/\r?\n/).map((t) => ({ t, v: semver(t) })).filter((x) => x.v.length === 3)
      .sort((a, b) => (behind(a.v, b.v) ? -1 : behind(b.v, a.v) ? 1 : 0)).pop();
    if (latest && behind(v, latest.v)) {
      problems.push(`plugin.json version ${plugin.version} is behind the latest tag ${latest.t} (installed users would not update)`);
    }
  }
}

// --- 3. marketplace -------------------------------------------------------------
if (plugin && marketplace) {
  const entry = (marketplace.plugins ?? []).find((p) => p.name === plugin.name);
  if (!entry) problems.push(`marketplace.json has no entry for plugin "${plugin.name}"`);
  else {
    if (entry.source !== "./") problems.push(`marketplace.json entry "${plugin.name}" source is ${JSON.stringify(entry.source)}, expected "./"`);
    if ("version" in entry) problems.push(`marketplace.json entry "${plugin.name}" sets version; keep it only in plugin.json`);
  }
}

// Codex discovers skills recursively from the common root.
const codex = readJson(join(REPO, ".codex-plugin", "plugin.json"));
const codexMarket = readJson(join(REPO, ".agents", "plugins", "marketplace.json"));
if (codex && plugin) {
  if (codex.name !== plugin.name || codex.version !== plugin.version) problems.push("Codex and Claude plugin identities/versions differ");
  if (codex.skills !== "./skills/") problems.push("Codex skills must point at ./skills/");
}
if (codexMarket && codex) {
  const entry = codexMarket.plugins?.find((p) => p.name === codex.name);
  if (entry?.source?.path !== "./" || entry?.source?.source !== "local") problems.push("Codex marketplace must point at the repository root");
  if (entry?.policy?.installation !== "AVAILABLE" || entry?.policy?.authentication !== "ON_INSTALL") problems.push("Codex marketplace installation/authentication policy missing");
}

// --- 4. claude plugin validate (optional) ---------------------------------------
for (const target of [PLUGIN, MARKETPLACE]) {
  const r = spawnSync("claude", ["plugin", "validate", target], { cwd: REPO, encoding: "utf8" });
  if (r.error?.code === "ENOENT") { console.log("(claude not on PATH: skipped `claude plugin validate`)"); break; }
  if (r.status !== 0) problems.push(`claude plugin validate ${target.slice(REPO.length + 1)} failed:\n${r.stdout}${r.stderr}`);
}

if (problems.length) {
  console.error(`plugin-manifest check FAILED (${problems.length}):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`plugin-manifest check OK: ${plugin.name} v${plugin.version}, skills from ${[].concat(plugin.skills).length} bucket dirs, marketplace entry present.`);
