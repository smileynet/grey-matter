#!/usr/bin/env node
// build-agy-plugin.mjs: package grey-matter's skills as a Google Antigravity
// (`agy`) plugin and (optionally) install it globally.
//
// On the probed agy (1.1.14) skill discovery is PLUGIN-driven, not a bare-dir
// scan: `agy` surfaces skills only from plugins registered in
// ~/.gemini/config/plugins/ (each plugin has a top-level plugin.json and a
// skills/ subdir of SKILL.md directories). Copying skill dirs into a scan root
// does nothing on this version. So "deploy globally to agy" == build a plugin
// package and `agy plugin install` it.
//
// This script assembles that package from skills/<bucket>/<name>/, flattening
// buckets (agy discovers skills by the skills/ subdir, keyed on each SKILL.md's
// frontmatter `name`; folder name only needs to match to avoid a cosmetic
// validate warning, and ours already do).
//
// Usage:
//   node scripts/build-agy-plugin.mjs [build]            # build dist/agy-plugin/
//   node scripts/build-agy-plugin.mjs build --validate   # build, then `agy plugin validate`
//   node scripts/build-agy-plugin.mjs install            # build + validate + `agy plugin install`
//   node scripts/build-agy-plugin.mjs --out <dir>        # override output dir
//
// Flags:
//   --validate  run `agy plugin validate <out> --strict --json` after building.
//   --out DIR   output plugin directory (default: dist/agy-plugin).
//
// Requires: node (build), and `agy` on PATH for --validate / install.

import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(REPO, "skills");
const PLUGIN_NAME = "grey-matter";

function parseArgs(argv) {
  const args = { cmd: "build", validate: false, out: join(REPO, "dist", "agy-plugin") };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "build" || a === "install") args.cmd = a;
    else if (a === "--validate") args.validate = true;
    else if (a === "--out") args.out = resolve(rest[++i]);
    else { console.error(`unknown argument: ${a}`); process.exit(2); }
  }
  if (args.cmd === "install") args.validate = true; // always validate before installing
  return args;
}

function safeIsDir(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

// Same discovery contract as install-skills.mjs: every skills/<bucket>/<name>/
// with a SKILL.md.
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

function frontmatterName(skillMdPath) {
  const text = readFileSync(skillMdPath, "utf8");
  const m = text.match(/^---\s*[\r\n]([\s\S]*?)[\r\n]---/);
  if (!m) return null;
  const line = m[1].split(/\r?\n/).find((l) => /^name\s*:/.test(l));
  return line ? line.replace(/^name\s*:\s*/, "").trim().replace(/^["']|["']$/g, "") : null;
}

// Same lint as the installer: global name uniqueness + frontmatter name == dir
// (the latter keeps agy's validate quiet).
function lint(skills) {
  const errors = [];
  const byName = new Map();
  for (const s of skills) {
    const fm = frontmatterName(join(s.src, "SKILL.md"));
    if (fm && fm !== s.name) {
      errors.push(`name mismatch: ${s.bucket}/${s.name}/SKILL.md declares "${fm}" but its folder is "${s.name}"`);
    }
    if (byName.has(s.name)) errors.push(`duplicate skill name "${s.name}" across buckets (flattening discards buckets)`);
    else byName.set(s.name, s);
  }
  return errors;
}

// Version from the latest git tag (vX.Y.Z -> X.Y.Z), else 0.0.0.
function pluginVersion() {
  try {
    const tag = execFileSync("git", ["describe", "--tags", "--abbrev=0"], { cwd: REPO })
      .toString().trim();
    return tag.replace(/^v/, "") || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function manifest(version, count) {
  return {
    name: PLUGIN_NAME,
    displayName: "grey-matter",
    version,
    description:
      "A customized, adapted set of agent skills for game-centric and app development: " +
      "engineering (build), productivity (think/communicate), and meta (tend the set). " +
      `${count} skills; start with the compass router.`,
    author: { name: "grey-matter" },
    keywords: ["skills", "agent-skills", "engineering", "productivity", "meta", "tkt"],
    repository: "https://github.com/smileynet/grey-matter",
    license: "MIT",
  };
}

function build(args) {
  const skills = discoverSkills();
  if (!skills.length) { console.error("no skills found under skills/<bucket>/<name>/"); process.exit(1); }
  const errors = lint(skills);
  if (errors.length) {
    console.error("build aborted, lint failed:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }

  // Fresh output dir.
  rmSync(args.out, { recursive: true, force: true });
  mkdirSync(join(args.out, "skills"), { recursive: true });

  for (const s of skills) {
    cpSync(s.src, join(args.out, "skills", s.name), { recursive: true });
  }

  const version = pluginVersion();
  writeFileSync(
    join(args.out, "plugin.json"),
    JSON.stringify(manifest(version, skills.length), null, 2) + "\n",
  );

  console.log(`built ${PLUGIN_NAME} v${version}: ${skills.length} skills -> ${args.out}`);
  return { skills, version };
}

function agy(subargs) {
  return execFileSync("agy", subargs, { cwd: REPO, stdio: "inherit" });
}

const args = parseArgs(process.argv);
const { skills } = build(args);

if (args.validate) {
  console.log(`\nvalidating: agy plugin validate ${args.out} --strict --json`);
  try { agy(["plugin", "validate", args.out, "--strict", "--json"]); }
  catch { console.error("validate reported issues (see above)."); if (args.cmd === "install") process.exit(1); }
}

if (args.cmd === "install") {
  console.log(`\ninstalling: agy plugin install ${args.out}`);
  agy(["plugin", "install", args.out]);
  console.log(`\ninstalled. Enable if needed: agy plugin enable ${PLUGIN_NAME}`);
  console.log("Verify: agy plugin list --json  (or ask agy to list its skills)");
}
