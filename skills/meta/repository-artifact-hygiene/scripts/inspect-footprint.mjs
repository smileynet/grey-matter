#!/usr/bin/env node
// Inspect the uncommitted footprint of a repository without changing anything.
// Usage: node inspect-footprint.mjs --repo PATH [--path DIR]... [--ticket N] [--quiet 15m] [--agent-state]
//   [--floor 20GiB] [--cap 5GiB] [--dedupe] [--recheck PRIOR.json] [--summary [--top-under 40GiB]]
// Exit codes: 0 = report, 1 = a stated limit exceeded or a keep list changed, 2 = inspection/input error.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, statfsSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const UNITS = { b: 1, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4 };
// Archives and installers stamp files at the epoch or 1980; such times say nothing about recent use.
const EPOCH_FLOOR = Date.UTC(2000, 0, 1);

function bytes(text) {
  const m = /^(\d+(?:\.\d+)?)\s*([KMGT]iB|B)?$/i.exec(text ?? "");
  if (!m) throw new Error(`Expected a size like 500MiB or 20GiB, got: ${text}`);
  return Math.round(Number(m[1]) * UNITS[(m[2] ?? "b").toLowerCase()]);
}

function minutes(text) {
  const m = /^(\d+)(m|h)$/.exec(text ?? "");
  if (!m) throw new Error(`Expected a duration like 15m or 24h, got: ${text}`);
  return Number(m[1]) * (m[2] === "h" ? 60 : 1);
}

export function options(args) {
  const out = { repo: process.cwd(), paths: [], quietMinutes: 15, floor: bytes("20GiB"), topUnder: bytes("40GiB") };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i], value = () => { if (i + 1 === args.length) throw new Error(`Missing value for ${arg}`); return args[++i]; };
    if (arg === "--repo") out.repo = value();
    else if (arg === "--path") out.paths.push(value());
    else if (arg === "--ticket") out.ticket = Number(value());
    else if (arg === "--quiet") out.quietMinutes = minutes(value());
    else if (arg === "--agent-state") out.quietMinutes = 24 * 60;
    else if (arg === "--floor") out.floor = bytes(value());
    else if (arg === "--cap") out.cap = bytes(value());
    else if (arg === "--top-under") out.topUnder = bytes(value());
    else if (arg === "--recheck") out.recheck = value();
    else if (arg === "--dedupe") out.dedupe = true;
    else if (arg === "--summary") out.summary = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return out;
}

function git(repo, args) {
  const run = spawnSync("git", ["-C", repo, ...args], { maxBuffer: 256 * 1024 ** 2, timeout: 60000 });
  if (run.error || run.status !== 0) throw new Error(`git ${args[0]} failed: ${run.error?.message ?? run.stderr.toString().trim()}`);
  return run.stdout.toString();
}

const posix = (p) => p.split(sep).join("/");
const inside = (child, parent) => child === parent || child.startsWith(parent.endsWith(sep) ? parent : parent + sep);

// Allocated bytes (blocks) where the OS reports them; on copy-on-write filesystems this is an upper bound.
function walk(root, seen = new Set()) {
  const out = { bytes: 0, files: 0, newest: 0, epochDated: 0, hardLinked: [], all: [], errors: 0 };
  const stack = [root];
  while (stack.length) {
    const path = stack.pop();
    let st;
    try { st = lstatSync(path, { bigint: false }); } catch { out.errors++; continue; }
    if (st.isDirectory()) {
      try { for (const name of readdirSync(path)) stack.push(join(path, name)); } catch { out.errors++; }
      continue;
    }
    out.files++;
    if (st.mtimeMs < EPOCH_FLOOR) out.epochDated++;
    else out.newest = Math.max(out.newest, st.mtimeMs);
    if (st.isFile()) {
      out.all.push({ path, size: st.size });
      if (st.nlink > 1) out.hardLinked.push(path);
      const key = `${st.dev}:${st.ino}`;
      if (st.nlink > 1 && seen.has(key)) continue;
      seen.add(key);
    }
    out.bytes += st.blocks !== undefined ? st.blocks * 512 : st.size;
  }
  return out;
}

function tickets(repo) {
  const dir = join(repo, ".tickets"), out = new Map();
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const m = /^(\d+)-.*\.md$/.exec(name);
    if (!m) continue;
    const status = /^status:\s*"?([a-z_]+)"?/m.exec(readFileSync(join(dir, name), "utf8"))?.[1] ?? "unknown";
    out.set(Number(m[1]), status);
  }
  return out;
}

function ticketOf(name) {
  const m = /(?:^|[^A-Za-z0-9])t(?:icket)?[-_]?(\d{1,4})(?=$|[^0-9])/i.exec(name) ?? /^(\d{2,4})[-_]/.exec(name);
  return m ? Number(m[1]) : undefined;
}

function trackedText(repo) {
  const out = [];
  for (const rel of git(repo, ["ls-files", "-z"]).split("\0").filter(Boolean)) {
    const path = join(repo, rel);
    let st;
    try { st = lstatSync(path); } catch { continue; }
    if (!st.isFile()) continue;
    const entry = { rel, path, size: st.size };
    if (st.size <= 1024 ** 2) {
      const buf = readFileSync(path);
      if (!buf.subarray(0, 8192).includes(0)) entry.text = buf.toString("utf8");
    }
    out.push(entry);
  }
  return out;
}

// Citations are matched by exact sub-path; the family name alone is only a lead.
function citations(familyRel, familyAbs, tracked, repo) {
  const prefixes = [familyRel, familyAbs].filter(Boolean).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(?<![\\w./~-])(?:${prefixes.join("|")})(?:/[^\\s\`'")\\]>]*|(?![\\w.-]))`, "g");
  const cited = new Map(), leads = new Set();
  for (const file of tracked) {
    if (!file.text || /(^|\/)\.git(ignore|attributes)$/.test(file.rel)) continue;
    for (const m of file.text.matchAll(re)) {
      const path = m[0].replace(/[.,:;]+$/, "").replace(/\/$/, "");
      const abs = isAbsolute(path) ? path : join(repo, path);
      if (abs === familyAbs) { leads.add(file.rel); continue; }
      if (!inside(abs, familyAbs)) continue;
      if (!cited.has(abs)) cited.set(abs, new Set());
      cited.get(abs).add(file.rel);
    }
  }
  const existing = [...cited.keys()].filter((p) => existsSync(p)).sort();
  const keep = existing.filter((p) => !existing.some((q) => q !== p && inside(p, q)));
  return {
    citedBy: [...new Set([...cited.values()].flatMap((s) => [...s]))].sort(),
    keep: keep.map((p) => posix(relative(repo, p))),
    dangling: [...cited.keys()].filter((p) => !existsSync(p)).map((p) => posix(relative(repo, p))),
    leads: [...leads].sort(),
  };
}

function openPaths(coverage) {
  if (process.platform === "linux" && existsSync("/proc")) {
    const out = new Set();
    let denied = 0;
    for (const pid of readdirSync("/proc").filter((n) => /^\d+$/.test(n))) {
      let fds;
      try { fds = readdirSync(`/proc/${pid}/fd`); } catch { denied++; continue; }
      for (const fd of fds) { try { out.add(readlinkSync(`/proc/${pid}/fd/${fd}`)); } catch {} }
    }
    coverage.openFiles = denied ? "proc (processes you can read)" : "proc";
    return out;
  }
  const run = spawnSync("lsof", ["-Fn", "-w"], { maxBuffer: 256 * 1024 ** 2, timeout: 60000 });
  if (run.error) { coverage.openFiles = "unavailable"; coverage.complete = false; return new Set(); }
  coverage.openFiles = "lsof";
  return new Set(run.stdout.toString().split("\n").filter((l) => l.startsWith("n")).map((l) => l.slice(1)));
}

function worktrees(repo) {
  const out = [];
  for (const block of git(repo, ["worktree", "list", "--porcelain"]).trim().split("\n\n").slice(1)) {
    const fields = Object.fromEntries(block.split("\n").map((l) => { const i = l.indexOf(" "); return i < 0 ? [l, true] : [l.slice(0, i), l.slice(i + 1)]; }));
    const path = resolve(fields.worktree);
    let dirty = false;
    if (!fields.prunable && existsSync(path)) dirty = git(path, ["status", "--porcelain"]).trim() !== "";
    const active = !fields.prunable && Boolean(fields.locked || fields.branch || dirty);
    out.push({ path, branch: fields.branch?.replace("refs/heads/", ""), locked: Boolean(fields.locked), prunable: Boolean(fields.prunable), dirty, active });
  }
  return out;
}

function freeSpace(repo, coverage) {
  const fs = statfsSync(repo), entries = [{ path: repo, free: fs.bavail * fs.bsize, total: fs.blocks * fs.bsize }];
  const version = existsSync("/proc/version") ? readFileSync("/proc/version", "utf8") : "";
  if (/microsoft/i.test(version)) {
    // A WSL distro reports its virtual disk's size; the Windows drive holding it is the real limit.
    if (existsSync("/mnt/c")) { const host = statfsSync("/mnt/c"); entries.push({ path: "/mnt/c", free: host.bavail * host.bsize, total: host.blocks * host.bsize }); }
    coverage.hostDrive = "assumed /mnt/c holds the distro's virtual disk";
  }
  return { free: Math.min(...entries.map((e) => e.free)), entries };
}

function dedupe(families, tracked, repo) {
  const bySize = new Map(), hashes = new Map();
  for (const t of tracked) { if (!bySize.has(t.size)) bySize.set(t.size, []); bySize.get(t.size).push(t.path); }
  const lfsDir = join(resolve(repo, git(repo, ["rev-parse", "--git-common-dir"]).trim()), "lfs", "objects");
  const lfs = new Set();
  if (existsSync(lfsDir)) for (const a of readdirSync(lfsDir)) for (const b of readdirSync(join(lfsDir, a))) for (const oid of readdirSync(join(lfsDir, a, b))) lfs.add(oid);
  const sha = (p) => { if (!hashes.has(p)) hashes.set(p, createHash("sha256").update(readFileSync(p)).digest("hex")); return hashes.get(p); };
  for (const f of families) {
    let same = 0;
    for (const file of f.walk.all) {
      const peers = bySize.get(file.size) ?? [];
      if (!peers.length && !lfs.size) continue;
      const h = sha(file.path);
      if (lfs.has(h) || peers.some((p) => p !== file.path && sha(p) === h)) same += file.size;
    }
    f.identicalToTrackedBytes = same;
  }
}

// pytest keeps the last three runs whatever their outcome unless the repo sets a retention policy.
const PYTEST_CONFIGS = [["pytest.ini", /^\[pytest\]/m], ["pyproject.toml", /^\[tool\.pytest\.ini_options\]/m], ["tox.ini", /^\[pytest\]/m], ["setup.cfg", /^\[tool:pytest\]/m]];

export function conformance(tracked) {
  const byRel = new Map(tracked.map((t) => [t.rel, t]));
  const configs = PYTEST_CONFIGS.filter(([rel, re]) => re.test(byRel.get(rel)?.text ?? "")).map(([rel]) => rel);
  const usesPytest = configs.length > 0 || tracked.some((t) => /(^|\/)(conftest\.py|test_[^/]*\.py)$/.test(t.rel));
  const retention = tracked.some((t) => /^\s*tmp_path_retention_policy\s*=/m.test(t.text ?? ""));
  const scratchCitations = tracked
    .filter((t) => /\.(json|md)$/.test(t.rel) && t.text)
    .map((t) => ({ file: t.rel, paths: [...new Set(t.text.match(/\.scratch\/[A-Za-z0-9_][^\s`'")\]]*/g) ?? [])] }))
    .filter((c) => c.paths.length);
  return {
    pytestRetention: usesPytest && !retention
      ? { finding: true, config: configs[0] ?? "pyproject.toml", fix: configs[0] === "pyproject.toml" || !configs.length ? 'tmp_path_retention_policy = "failed"  # under [tool.pytest.ini_options]' : "tmp_path_retention_policy = failed" }
      : { finding: false },
    scratchCitations,
  };
}

function outcome(f) {
  if (f.worktree?.prunable) return "prune";
  if (f.activeReasons.length) return "skip";
  if (f.ticket !== undefined && !["done", "unknown"].includes(f.ticketStatus)) return "keep";
  // A bare mention of the folder is a lead to read, never grounds to delete.
  if (f.leads.length) return "ask";
  if (f.ticketStatus === "done") return !f.keep.length ? "delete" : f.unkeptFiles ? "slim" : "keep";
  return "ask";
}

export function inspect(opts, now = Date.now()) {
  const repo = realpathSync(opts.repo), coverage = { complete: true, sizes: "allocated bytes; upper bound on copy-on-write filesystems" };
  const tracked = trackedText(repo), status = tickets(repo), open = openPaths(coverage), trees = worktrees(repo);
  const roots = [];
  const scratch = join(repo, ".scratch");
  if (existsSync(scratch)) for (const name of readdirSync(scratch)) roots.push({ abs: join(scratch, name), kind: "scratch" });
  for (const rel of git(repo, ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"]).split("\0").filter(Boolean)) {
    const abs = join(repo, rel.replace(/\/$/, ""));
    if (rel.endsWith("/") && !inside(abs, scratch)) roots.push({ abs, kind: "ignored" });
  }
  for (const t of trees) if (!roots.some((r) => inside(t.path, r.abs))) roots.push({ abs: t.path, kind: "worktree" });
  for (const p of opts.paths) roots.push({ abs: resolve(p), kind: "outside" });

  const seen = new Set(), families = [];
  for (const r of roots) {
    const rel = inside(r.abs, repo) ? posix(relative(repo, r.abs)) : undefined;
    const name = basename(r.abs), ticket = ticketOf(name);
    if (opts.ticket !== undefined && ticket !== opts.ticket) continue;
    const w = existsSync(r.abs) ? walk(r.abs, seen) : { bytes: 0, files: 0, newest: 0, epochDated: 0, hardLinked: [], all: [], errors: 0 };
    if (w.errors) coverage.complete = false;
    const cite = citations(rel, r.abs, tracked, repo);
    const worktree = trees.find((t) => t.path === r.abs);
    const activeReasons = [];
    const quietFor = (now - w.newest) / 60000;
    if (w.newest && quietFor < opts.quietMinutes) activeReasons.push(`written ${Math.floor(quietFor)}m ago (quiet floor ${opts.quietMinutes}m)`);
    const openHere = [...open].filter((p) => inside(p, r.abs));
    if (openHere.length) activeReasons.push(`${openHere.length} open file(s)`);
    for (const t of trees) if (t.active && inside(t.path, r.abs)) activeReasons.push(`active worktree ${posix(relative(repo, t.path)) || t.path}${t.branch ? ` on ${t.branch}` : ""}${t.dirty ? " with uncommitted changes" : ""}`);
    const f = {
      path: rel ?? r.abs, kind: r.kind, bytes: w.bytes, files: w.files,
      newestWrite: w.newest ? new Date(w.newest).toISOString() : null, epochDatedFiles: w.epochDated,
      ticket, ticketStatus: ticket === undefined ? undefined : status.get(ticket) ?? "unknown",
      citedBy: cite.citedBy, keep: cite.keep, leads: cite.leads, dangling: cite.dangling,
      keepBytes: cite.keep.reduce((n, k) => n + walk(join(repo, k)).bytes, 0),
      hardLinkedFiles: w.hardLinked.map((p) => posix(relative(repo, p))), openFiles: openHere.map((p) => posix(relative(repo, p))),
      worktree, activeReasons, walk: w,
    };
    f.unkeptFiles = w.all.filter((x) => !cite.keep.some((k) => inside(x.path, join(repo, k)))).length;
    f.outcome = outcome(f);
    families.push(f);
  }
  if (opts.dedupe) dedupe(families, tracked, repo);

  const space = freeSpace(repo, coverage), findings = [];
  if (space.free < opts.floor) findings.push({ kind: "free-space-floor", free: space.free, floor: opts.floor });
  if (opts.cap !== undefined) {
    const perTicket = new Map();
    for (const f of families) if (f.ticket !== undefined) perTicket.set(f.ticket, (perTicket.get(f.ticket) ?? 0) + f.bytes);
    for (const [ticket, total] of perTicket) if (total > opts.cap) findings.push({ kind: "ticket-cap", ticket, bytes: total, cap: opts.cap });
  }
  if (opts.recheck) {
    // A citation added after the list was made must stop the removal, never ride along with it.
    const prior = JSON.parse(readFileSync(opts.recheck, "utf8"));
    for (const before of prior.families ?? []) {
      if (!["delete", "slim"].includes(before.outcome)) continue;
      const now = families.find((f) => f.path === before.path);
      if (now && JSON.stringify(now.keep) !== JSON.stringify(before.keep)) {
        now.outcome = "keep list changed";
        findings.push({ kind: "keep-list-changed", path: before.path, before: before.keep, now: now.keep });
      }
    }
  }
  for (const f of families) delete f.walk;
  families.sort((a, b) => b.bytes - a.bytes);
  const candidates = families.filter((f) => ["delete", "slim", "prune", "ask"].includes(f.outcome)).length;
  return {
    status: findings.length ? "fail" : candidates ? "review" : "pass",
    repo, freeSpace: space, limits: { floor: opts.floor, cap: opts.cap ?? null, quietMinutes: opts.quietMinutes },
    coverage, findings, families, conformance: conformance(tracked),
  };
}

const gib = (n) => n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GiB` : `${(n / 1024 ** 2).toFixed(1)} MiB`;

export function summary(result, topUnder) {
  const line = [`free ${gib(result.freeSpace.free)} (floor ${gib(result.limits.floor)}${result.freeSpace.free < result.limits.floor ? ": under, stop adding data" : ""})`];
  if (result.freeSpace.free < topUnder) line.push(`largest uncommitted: ${result.families.slice(0, 3).map((f) => `${f.path} ${gib(f.bytes)}`).join(", ") || "none"}`);
  return line.join("; ");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const opts = options(process.argv.slice(2)), result = inspect(opts);
    console.log(opts.summary ? summary(result, opts.topUnder) : JSON.stringify(result, null, 2));
    process.exitCode = result.findings.length ? 1 : 0;
  } catch (error) {
    console.log(JSON.stringify({ status: "error", errors: [error.message] }, null, 2));
    process.exitCode = 2;
  }
}
