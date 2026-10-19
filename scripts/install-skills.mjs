#!/usr/bin/env node
// install-skills.mjs: cross-client installer for grey-matter skills.
//
// Copies (or links) each skill directory in skills/<bucket>/<name>/ into a scan
// root the agent harnesses read (default ~/.agents/skills/), flattening the
// bucket structure so each skill is a direct child: <root>/<name>/SKILL.md.
//
// Safety: it tracks what it installs in a manifest and only ever removes or
// overwrites skills it installed. A directory in the scan root it did not
// install is never touched.
//
// Usage:
//   node scripts/install-skills.mjs [install] [--link] [--dry-run] [--force] [--root <dir>]
//   node scripts/install-skills.mjs list
//   node scripts/install-skills.mjs uninstall [--dry-run] [--root <dir>]
//
// Flags:
//   --link      symlink (junction on Windows) instead of copy; degrades to copy
//               if a link can't be made without elevated privilege.
//   --dry-run   print the plan, change nothing.
//   --force     overwrite a same-name directory in the scan root that this
//               installer did not install (default: refuse).
//   --project   also install into <cwd>/.agents/skills (the shared project-level root
//               read by agy, Crush, OpenCode, and Claude Code).
//   --root DIR  install into DIR instead of the default scan root(s). Repeatable.

import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync,
  statSync, symlinkSync, writeFileSync, lstatSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(REPO, "skills");
const MANIFEST_NAME = ".installed-by-grey-matter.json";
// Default scan root(s). Harnesses scan their own user-level root, NOT a single
// shared one (verified: kiro-cli scans ~/.kiro/skills, codex scans ~/.codex/skills,
// Claude Code ~/.claude/skills; the ~/.agents/skills convention is not universally
// honored). Default to every known harness root that exists on this machine, plus the
// cross-client ~/.agents/skills. Override the whole set with one or more --root flags.
const KNOWN_ROOTS = [
  join(homedir(), ".kiro", "skills"),    // kiro-cli
  join(homedir(), ".codex", "skills"),   // codex
  join(homedir(), ".claude", "skills"),  // Claude Code
  join(homedir(), ".agents", "skills"),  // cross-client convention
];
function defaultRoots() {
  const existing = KNOWN_ROOTS.filter((r) => existsSync(dirname(r))); // harness dir present
  return existing.length ? existing : [join(homedir(), ".agents", "skills")];
}

function parseArgs(argv) {
  const args = { cmd: "install", link: false, dryRun: false, force: false, project: false, roots: [] };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "list" || a === "uninstall" || a === "install") args.cmd = a;
    else if (a === "--link") args.link = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--force") args.force = true;
    else if (a === "--project") args.project = true;
    else if (a === "--root") args.roots.push(resolve(rest[++i]));
    else { console.error(`unknown argument: ${a}`); process.exit(2); }
  }
  // --project installs into <cwd>/.agents/skills, the shared project-level root read by
  // agy, Crush, OpenCode, and Claude Code. Combinable with explicit --root flags.
  if (args.project) args.roots.push(resolve(join(process.cwd(), ".agents", "skills")));
  if (args.roots.length === 0) args.roots = defaultRoots();
  return args;
}

// Discover skills: every skills/<bucket>/<name>/ that contains a SKILL.md.
function discoverSkills() {
  const found = [];
  if (!existsSync(SKILLS_DIR)) return found;
  for (const bucket of readdirSync(SKILLS_DIR)) {
    const bucketPath = join(SKILLS_DIR, bucket);
    if (!safeIsDir(bucketPath)) continue;
    for (const name of readdirSync(bucketPath)) {
      const skillPath = join(bucketPath, name);
      if (!safeIsDir(skillPath)) continue;
      if (!existsSync(join(skillPath, "SKILL.md"))) continue;
      found.push({ name, bucket, src: skillPath });
    }
  }
  return found;
}

function safeIsDir(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

// Read the frontmatter `name:` from a SKILL.md (for the name==dir lint).
function frontmatterName(skillMdPath) {
  const text = readFileSync(skillMdPath, "utf8");
  const m = text.match(/^---\s*[\r\n]([\s\S]*?)[\r\n]---/);
  if (!m) return null;
  const nameLine = m[1].split(/\r?\n/).find((l) => /^name\s*:/.test(l));
  if (!nameLine) return null;
  return nameLine.replace(/^name\s*:\s*/, "").trim().replace(/^["']|["']$/g, "");
}

// Hard pre-install lint: global name uniqueness + frontmatter name == leaf dir.
function lint(skills) {
  const errors = [];
  const byName = new Map();
  for (const s of skills) {
    const fmName = frontmatterName(join(s.src, "SKILL.md"));
    if (fmName && fmName !== s.name) {
      errors.push(`name mismatch: ${s.bucket}/${s.name}/SKILL.md declares name "${fmName}" but its folder is "${s.name}"`);
    }
    if (byName.has(s.name)) {
      const other = byName.get(s.name);
      errors.push(`duplicate skill name "${s.name}": ${other.bucket}/${s.name} and ${s.bucket}/${s.name} (names must be globally unique across buckets, flattening discards buckets)`);
    } else {
      byName.set(s.name, s);
    }
  }
  return errors;
}

function readManifest(root) {
  const p = join(root, MANIFEST_NAME);
  if (!existsSync(p)) return { installed: [] };
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return { installed: [] }; }
}

function writeManifest(root, names, mode, dryRun) {
  const p = join(root, MANIFEST_NAME);
  const manifest = {
    installer: "grey-matter/scripts/install-skills.mjs",
    repo: REPO,
    mode,
    installedAt: new Date().toISOString(),
    installed: names.slice().sort(),
  };
  if (dryRun) return;
  writeFileSync(p, JSON.stringify(manifest, null, 2) + "\n");
}

// Install one skill dir into the root (flattened). Returns the action taken.
function installOne(skill, root, { link, force, dryRun }, owned) {
  const dest = join(root, skill.name);
  const isOurs = owned.has(skill.name);
  if (existsSync(dest) && !isOurs) {
    if (!force) {
      return { action: "refused", reason: "destination exists and was not installed by us (use --force to override)" };
    }
  }
  if (dryRun) return { action: existsSync(dest) ? "replace" : "create" };

  // Clear an existing dest we own (or are forcing) so copy/link is clean.
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });

  if (link) {
    const type = platform() === "win32" ? "junction" : "dir";
    try {
      symlinkSync(skill.src, dest, type);
      return { action: "linked" };
    } catch {
      cpSync(skill.src, dest, { recursive: true });
      return { action: "copied", note: "link failed (privilege?), fell back to copy" };
    }
  }
  cpSync(skill.src, dest, { recursive: true });
  return { action: "copied" };
}

function doInstall(args) {
  const skills = discoverSkills();
  if (skills.length === 0) { console.error("no skills found under skills/<bucket>/<name>/"); process.exit(1); }

  const errors = lint(skills);
  if (errors.length) {
    console.error("install aborted, lint failed:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }

  const desired = new Set(skills.map((s) => s.name));
  for (const root of args.roots) {
    if (!args.dryRun) mkdirSync(root, { recursive: true });
    const manifest = readManifest(root);
    const owned = new Set(manifest.installed || []);

    console.log(`\nroot: ${root}  (${args.dryRun ? "dry-run" : args.link ? "link" : "copy"})`);

    // Prune orphans: skills we installed before but are no longer in source.
    for (const name of manifest.installed || []) {
      if (!desired.has(name)) {
        const dest = join(root, name);
        console.log(`  prune ${name}${args.dryRun ? "" : rmIfExists(dest)}`);
      }
    }

    let refused = 0;
    for (const skill of skills) {
      const r = installOne(skill, root, args, owned);
      const extra = r.reason ? ` (${r.reason})` : r.note ? ` (${r.note})` : "";
      console.log(`  ${r.action.padEnd(7)} ${skill.name}${extra}`);
      if (r.action === "refused") refused++;
    }

    writeManifest(root, skills.map((s) => s.name), args.link ? "link" : "copy", args.dryRun);
    if (refused) console.log(`  ${refused} refused (foreign dirs); re-run with --force to overwrite.`);
  }
  console.log(`\n${args.dryRun ? "(dry-run) would install" : "installed"} ${skills.length} skills.`);
}

function rmIfExists(dest) {
  if (existsSync(dest)) { rmSync(dest, { recursive: true, force: true }); return ""; }
  return " (already gone)";
}

function doList(args) {
  for (const root of args.roots) {
    const manifest = readManifest(root);
    console.log(`\nroot: ${root}`);
    if (!manifest.installed || manifest.installed.length === 0) { console.log("  (nothing installed by grey-matter)"); continue; }
    console.log(`  installed ${manifest.installed.length} (mode: ${manifest.mode}, at ${manifest.installedAt}):`);
    for (const n of manifest.installed) console.log(`    ${n}`);
  }
}

function doUninstall(args) {
  for (const root of args.roots) {
    const manifest = readManifest(root);
    const names = manifest.installed || [];
    console.log(`\nroot: ${root}  (${args.dryRun ? "dry-run" : "uninstall"})`);
    if (names.length === 0) { console.log("  (nothing to uninstall)"); continue; }
    for (const name of names) {
      const dest = join(root, name);
      console.log(`  remove ${name}${args.dryRun ? "" : rmIfExists(dest)}`);
    }
    if (!args.dryRun) { const mp = join(root, MANIFEST_NAME); if (existsSync(mp)) rmSync(mp, { force: true }); }
  }
}

const args = parseArgs(process.argv);
if (args.cmd === "list") doList(args);
else if (args.cmd === "uninstall") doUninstall(args);
else doInstall(args);
