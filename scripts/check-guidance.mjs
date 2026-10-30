#!/usr/bin/env node
// check-guidance.mjs: read-only check of agent guidance for rot. Reads the global instruction
// files install-agents-md.mjs targets, ~/.kiro/steering, and a repo's AGENTS.md, CLAUDE.md and
// .kiro/steering. Nothing is edited.
//
// Usage: node scripts/check-guidance.mjs [--repo <dir>] [--no-global] [--max-bytes N] [--json]
//
// Errors (exit 1): dead-path, dead-command, dead-skill, dead-link (steering symlink to a missing
// file), generator (a file another tool regenerates), budget, duplicate (one line in both a
// global and a repo file). For judgment: contradiction (a known pair in
// global/conflict-pairs.json; `<!-- overrides: <id> -->` on the line above makes it info) and
// re-read (a repo file the guidance names changed after the guidance's last commit).
// Commands resolve against this host's PATH, so a tool installed only on another host reads as
// dead here.

import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { BUDGET_BYTES, GENERATED, KNOWN, findBlock } from "./install-agents-md.mjs";

const PAIRS = join(dirname(fileURLToPath(import.meta.url)), "..", "global", "conflict-pairs.json");
const HOME = homedir();
const CODEX = process.env.CODEX_HOME || join(HOME, ".codex");
const SHELL_FENCE = /^```(bash|sh|shell|zsh|console)\s*$/;
const BUILTINS = new Set("cd export source eval set unset alias echo printf exit return read test true false do done then else fi if for while case esac in pushd popd exec trap wait".split(" "));
const WRAPPERS = new Set(["nohup", "sudo", "env", "time", "exec", "command"]);
const SLASH_BUILTINS = new Set("add-dir agents bug clear compact config context cost doctor exit export fast help hooks ide init login logout loop mcp memory model permissions plugin plugins pr-comments release-notes resume review rewind schedule status statusline terminal-setup vim".split(" "));

function parseArgs(argv) {
  const a = { repo: process.cwd(), global: true, maxBytes: 16384, json: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--repo" && argv[i + 1]) a.repo = resolve(argv[++i]);
    else if (x === "--no-global") a.global = false;
    else if (x === "--max-bytes" && Number(argv[i + 1]) > 0) a.maxBytes = Number(argv[++i]);
    else if (x === "--json") a.json = true;
    else { console.error(`unknown argument: ${x}`); process.exit(2); }
  }
  return a;
}

const entries = (dir) => { try { return readdirSync(dir, { withFileTypes: true }); } catch { return []; } };

// The roots deploy.mjs's HARNESSES read skills from, plus the plugin folders harnesses load.
function installedSkills(repo) {
  const names = new Set();
  const roots = [join(HOME, ".kiro"), CODEX, join(HOME, ".claude"), join(HOME, ".config", "opencode"), join(HOME, ".agents"),
    ...[".agents", ".claude", ".codex", ".opencode", ".kiro"].map((d) => join(repo, d))].map((d) => join(d, "skills"));
  for (const root of roots) for (const e of entries(root)) if (existsSync(join(root, e.name, "SKILL.md"))) names.add(e.name);
  const walk = (dir, depth) => {
    for (const e of entries(dir)) {
      if (e.name === "SKILL.md") names.add(basename(dir));
      else if (e.isDirectory() && depth > 0) walk(join(dir, e.name), depth - 1);
    }
  };
  for (const dir of [join(HOME, ".claude", "plugins"), join(CODEX, "plugins"), join(HOME, ".gemini", "config", "plugins")]) walk(dir, 7);
  return names;
}

function guidanceFiles(a) {
  const files = [], seen = new Set(), dead = [];
  const add = (path, layer) => {
    if (!existsSync(path) || seen.has(realpathSync(path))) return;
    seen.add(realpathSync(path));
    files.push({ path, layer, text: readFileSync(path, "utf8") });
  };
  const steering = (dir, layer) => {
    for (const e of entries(dir)) {
      const path = join(dir, e.name);
      if (e.isSymbolicLink() && !existsSync(path)) dead.push(path);
      else if (e.name.endsWith(".md")) add(path, layer);
    }
  };
  if (a.global) {
    for (const k of KNOWN) add(k.file, "global");
    steering(join(HOME, ".kiro", "steering"), "global");
  }
  for (const name of ["AGENTS.md", "CLAUDE.md"]) add(join(a.repo, name), "repo");
  steering(join(a.repo, ".kiro", "steering"), "repo");
  return { files, dead };
}

const onPath = (word) => {
  const exts = process.platform === "win32" ? ["", ...(process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";")] : [""];
  return (process.env.PATH || "").split(delimiter).some((d) => d && exts.some((x) => existsSync(join(d, word + x))));
};

function recipeExists(repo, tool, name) {
  const read = (...p) => { try { return readFileSync(join(repo, ...p), "utf8"); } catch { return ""; } };
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (tool === "just") return new RegExp(`^@?${esc}(\\s[^:\\n]*)?:`, "m").test(read("justfile") + read("Justfile"));
  const toml = read("mise.toml") + read(".mise.toml");
  return new RegExp(`\\[tasks\\.("?)${esc}\\1\\]|^"?${esc}"?\\s*=`, "m").test(toml) || existsSync(join(repo, "mise-tasks", name)) || existsSync(join(repo, ".mise", "tasks", name));
}

// The first word of a command, or a just/mise recipe call, that resolves nowhere.
function deadCommand(command, repo) {
  const words = command.trim().replace(/^\$\s+/, "").split(/\s+/).filter((w, i, all) => !all.slice(0, i + 1).every((x) => /^\w+=/.test(x) || WRAPPERS.has(x)));
  const [first, second, third] = words;
  if (!first || !/^[a-z][\w.+-]*$/i.test(first) || BUILTINS.has(first)) return null;
  if (repo && first === "just" && second && /^[\w-]+$/.test(second)) return recipeExists(repo, "just", second) ? null : `just ${second}`;
  if (repo && first === "mise" && ["run", "r"].includes(second) && third && /^[\w:.-]+$/.test(third)) return recipeExists(repo, "mise", third) ? null : `mise run ${third}`;
  return onPath(first) || existsSync(join(repo || HOME, first)) ? null : first;
}

const looksPath = (s) => !/[\s<>{}*$|]|\.\.\./.test(s) && !/^[a-z][a-z0-9+.-]*:/i.test(s) &&
  (/^(~\/|\.{1,2}\/)/.test(s) || /^\/[^/]+\/./.test(s) || (/^[\w.@-]+(\/[\w.@-]+)+\/?$/.test(s) && /(\.\w+|\/)$/.test(s)));

function resolvePath(ref, file, repo, layer) {
  const p = ref.replace(/[#?].*$/, "").replace(/:\d+(:\d+)?$/, "");
  if (!p) return { ok: true };
  if (p.startsWith("~/")) return { ok: existsSync(join(HOME, p.slice(2))) };
  if (p.startsWith("/")) return { ok: existsSync(p) };
  if (layer === "global") return { ok: true }; // a global rule's relative path names whatever project is open
  const bases = [dirname(file), dirname(realpathSync(file)), repo];
  const hit = bases.map((b) => resolve(b, p)).find(existsSync);
  return { ok: Boolean(hit), path: hit };
}

const norm = (line) => line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, "").replace(/\s+/g, " ").trim().toLowerCase();

function check(a) {
  const findings = [];
  const add = (tier, rule, file, line, message) => findings.push({ tier, rule, file, line, message });
  const { files, dead } = guidanceFiles(a);
  const skills = installedSkills(a.repo);
  for (const path of dead) add("error", "dead-link", path, 0, "steering symlink points at a missing file");
  const live = new Map(files.map((f) => [f, new Set()]));

  for (const f of files) {
    const lines = f.text.split("\n");
    const repo = f.layer === "repo" ? a.repo : null;
    const head = lines.slice(0, 5).findIndex((l) => GENERATED.test(l) && !/grey-matter/i.test(l));
    if (head >= 0) add("error", "generator", f.path, head + 1, "generated by another tool; edits and appended blocks are overwritten when it regenerates");
    if (Buffer.byteLength(f.text) > a.maxBytes) add("error", "budget", f.path, 0, `${Buffer.byteLength(f.text)} B, over the ${a.maxBytes} B file limit`);
    const block = findBlock(f.text, "global");
    if (block && Buffer.byteLength(block.body) > BUDGET_BYTES) add("error", "budget", f.path, 0, `grey-matter block over ${BUDGET_BYTES} B`);
    let fence = null;
    lines.forEach((line, i) => {
      const n = i + 1;
      if (/^```/.test(line)) { fence = fence === null ? SHELL_FENCE.test(line) : null; return; }
      if (fence === true) {
        if (/^\s*#/.test(line)) return;
        for (const part of line.replace(/\s#.*$/, "").split(/&&|\|\||;|\|/)) {
          const bad = deadCommand(part, repo);
          if (bad) add("error", "dead-command", f.path, n, `\`${bad}\` is not on PATH, a repo script or a recipe`);
        }
        return;
      }
      if (fence === false) return;
      // A list item or table cell, not a hard-wrapped prose line that happens to open with code.
      const lead = /^\s*(?:[-*+]\s+|\d+\.\s+|\|\s*)`([^`]+\s[^`]*)`/.exec(line);
      if (lead && !lead[1].startsWith("/")) {
        const bad = deadCommand(lead[1], repo);
        if (bad) add("error", "dead-command", f.path, n, `\`${bad}\` is not on PATH, a repo script or a recipe`);
      }
      const refs = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter(looksPath)
        .concat([...line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]).filter((t) => !/^[a-z][a-z0-9+.-]*:/i.test(t)));
      for (const ref of refs) {
        const r = resolvePath(ref, f.path, a.repo, f.layer);
        if (!r.ok) add("error", "dead-path", f.path, n, `${ref} does not resolve`);
        else if (r.path) live.get(f).add({ path: r.path, line: n });
      }
      const named = [...line.matchAll(/the `([a-z0-9][a-z0-9:-]*)` skill/gi)].map((m) => m[1])
        .concat([...line.matchAll(/`\/([a-z][a-z0-9-]*(?::[a-z0-9-]+)?)(?:\s[^`]*)?`/g)].map((m) => m[1]).filter((s) => !SLASH_BUILTINS.has(s)));
      for (const s of named) if (!skills.has(s.split(":").pop())) add("error", "dead-skill", f.path, n, `\`${s}\` is not provided by any installed skill root or plugin`);
    });
  }

  const globals = files.filter((f) => f.layer === "global").flatMap((f) => f.text.split("\n").map((text, i) => ({ f, text, n: i + 1 })));
  const repoLines = files.filter((f) => f.layer === "repo").flatMap((f) => f.text.split("\n").map((text, i, all) => ({ f, text, n: i + 1, above: all.slice(0, i).reverse().find((l) => l.trim()) ?? "" })));
  const seen = new Map(globals.filter((g) => norm(g.text).length >= 40).map((g) => [norm(g.text), g]));
  for (const r of repoLines) {
    const g = seen.get(norm(r.text));
    if (g) add("error", "duplicate", r.f.path, r.n, `repeats ${tilde(g.f.path)}:${g.n}, which every session already loads`);
  }

  const { pairs } = JSON.parse(readFileSync(PAIRS, "utf8"));
  for (const p of pairs) {
    const [ra, rb] = [new RegExp(p.a, "i"), new RegExp(p.b, "i")];
    for (const r of repoLines) {
      const g = globals.find((x) => (ra.test(x.text) && rb.test(r.text)) || (rb.test(x.text) && ra.test(r.text)));
      if (!g) continue;
      const where = `${tilde(g.f.path)}:${g.n} (${p.id})`;
      if (r.above.includes(`<!-- overrides: ${p.id} -->`)) add("info", "override", r.f.path, r.n, `marked override of ${where}`);
      else add("judgment", "contradiction", r.f.path, r.n, `may contradict ${where}; mark an intended override with <!-- overrides: ${p.id} -->`);
    }
  }

  const git = (...args) => spawnSync("git", ["-C", a.repo, ...args], { encoding: "utf8" });
  if (git("rev-parse", "--git-dir").status === 0) {
    const lastCommit = (p) => Number(git("log", "-1", "--format=%ct", "--", p).stdout.trim()) || 0;
    for (const [f, refs] of live) {
      const own = lastCommit(f.path);
      if (!own || f.layer !== "repo") continue;
      for (const ref of refs) {
        if (!ref.path.startsWith(a.repo + sep) || lastCommit(ref.path) <= own) continue;
        add("judgment", "re-read", f.path, ref.line, `${relative(a.repo, ref.path)} changed after this file's last commit; re-read the line`);
      }
    }
  }
  return findings;
}

const tilde = (p) => (p.startsWith(HOME + sep) ? `~${p.slice(HOME.length)}` : p);
const TIERS = ["error", "judgment", "info"];

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))) {
  const a = parseArgs(process.argv.slice(2));
  const findings = check(a).map((f) => ({ ...f, file: f.file.startsWith(a.repo + sep) ? relative(a.repo, f.file) : tilde(f.file) }))
    .sort((x, y) => TIERS.indexOf(x.tier) - TIERS.indexOf(y.tier));
  const errors = findings.filter((f) => f.tier === "error").length;
  if (a.json) console.log(JSON.stringify({ findings, pairs: PAIRS }, null, 2));
  else {
    for (const f of findings) console.log(`  ${f.tier.padEnd(9)} ${f.rule.padEnd(14)} ${f.file}${f.line ? `:${f.line}` : ""}  ${f.message}`);
    const count = (t) => findings.filter((f) => f.tier === t).length;
    console.log(`${errors} error(s), ${count("judgment")} for judgment, ${count("info")} info. Contradictions are matched against the known pairs in global/conflict-pairs.json only; judgment findings are for you to decide.`);
  }
  if (errors) process.exitCode = 1;
}
