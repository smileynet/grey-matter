#!/usr/bin/env node
// Inspect the uncommitted footprint of a repository without changing anything.
// Usage: node inspect-footprint.mjs --repo PATH [--path DIR]... [--agent-state-root DIR]... [--runner-temp-root DIR]...
//   [--ticket N] [--quiet 15m] [--agent-state] [--floor 20GiB] [--cap 5GiB] [--dedupe] [--preservation FILE]
//   [--recheck PRIOR.json] [--regrowth PRIOR.json [--cleanup-record FILE]] [--free-space-history FILE]
//   [--summary [--top-under 40GiB]]
// Exit codes: 0 = report, 1 = a stated limit exceeded or preservation changed, 2 = inspection/input error.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, opendirSync, readdirSync, readFileSync, readlinkSync, realpathSync, statfsSync, statSync } from "node:fs";
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
  const out = { repo: process.cwd(), paths: [], agentStateRoots: [], runnerTempRoots: [], quietMinutes: 15, floor: bytes("20GiB"), topUnder: bytes("40GiB") };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i], value = () => { if (i + 1 === args.length) throw new Error(`Missing value for ${arg}`); return args[++i]; };
    if (arg === "--repo") out.repo = value();
    else if (arg === "--path") out.paths.push(value());
    else if (arg === "--agent-state-root") out.agentStateRoots.push(value());
    else if (arg === "--runner-temp-root") out.runnerTempRoots.push(value());
    else if (arg === "--ticket") out.ticket = Number(value());
    else if (arg === "--quiet") out.quietMinutes = minutes(value());
    else if (arg === "--agent-state") out.quietMinutes = 24 * 60;
    else if (arg === "--floor") out.floor = bytes(value());
    else if (arg === "--cap") out.cap = bytes(value());
    else if (arg === "--top-under") out.topUnder = bytes(value());
    else if (arg === "--recheck") out.recheck = value();
    else if (arg === "--preservation") out.preservation = value();
    else if (arg === "--dedupe") out.dedupe = true;
    else if (arg === "--summary") out.summary = true;
    else if (arg === "--regrowth") out.regrowth = value();
    else if (arg === "--cleanup-record") out.cleanupRecord = value();
    else if (arg === "--free-space-history") out.freeSpaceHistory = value();
    else throw new Error(`Unknown option: ${arg}`);
  }
  if ([...out.agentStateRoots, ...out.runnerTempRoots].some((path) => !path.trim())) throw new Error("Configured roots must be nonempty paths");
  if (out.cleanupRecord && !out.regrowth) throw new Error("--cleanup-record requires --regrowth");
  return out;
}

function git(repo, args) {
  const run = spawnSync("git", ["-C", repo, ...args], { maxBuffer: 256 * 1024 ** 2, timeout: 60000 });
  if (run.error || run.status !== 0) throw new Error(`git ${args[0]} failed: ${run.error?.message ?? run.stderr.toString().trim()}`);
  return run.stdout.toString();
}

const posix = (p) => p.split(sep).join("/");
const inside = (child, parent) => {
  if (process.platform === "win32") { child = child.toLowerCase(); parent = parent.toLowerCase(); }
  return child === parent || child.startsWith(parent.endsWith(sep) ? parent : parent + sep);
};

// `bytes` remains a legacy estimate; allocationKnown says whether blocks were available for every entry.
function walk(root, seen = new Set(), stat = lstatSync, maxEntries = Infinity) {
  const out = { bytes: 0, logicalBytes: 0, knownAllocatedBytes: 0, knownAllocatedEntries: 0,
    allocationKnown: true, files: 0, newest: 0, epochDated: 0, hardLinked: [], all: [], errors: 0, truncated: false };
  const stack = [root]; let visited = 0;
  while (stack.length) {
    if (visited >= maxEntries) { out.truncated = true; break; }
    const path = stack.pop();
    visited++;
    let st;
    try { st = stat(path, { bigint: false }); } catch { out.errors++; continue; }
    if (st.isDirectory()) {
      try {
        if (maxEntries === Infinity) for (const name of readdirSync(path)) stack.push(join(path, name));
        else {
          const directory = opendirSync(path);
          try {
            while (true) {
              const entry = directory.readSync();
              if (!entry) break;
              if (visited + stack.length >= maxEntries) { out.truncated = true; break; }
              stack.push(join(path, entry.name));
            }
          } finally { directory.closeSync(); }
        }
      } catch { out.errors++; }
      continue;
    }
    out.files++;
    if (st.mtimeMs < EPOCH_FLOOR) out.epochDated++;
    else out.newest = Math.max(out.newest, st.mtimeMs);
    if (st.isFile()) {
      out.all.push({ path, size: st.size, type: "file", modified: st.mtimeMs, changed: st.ctimeMs });
      out.logicalBytes += st.size;
      if (st.blocks === undefined) out.allocationKnown = false;
      if (st.nlink > 1) out.hardLinked.push(path);
      const key = `${st.dev}:${st.ino}`;
      if (st.nlink > 1 && seen.has(key)) continue;
      seen.add(key);
    } else if (st.isSymbolicLink()) {
      out.all.push({ path, size: st.size, type: "symlink", target: readlinkSync(path), modified: st.mtimeMs, changed: st.ctimeMs });
      out.logicalBytes += st.size;
    }
    if (st.blocks === undefined) {
      out.allocationKnown = false;
      out.bytes += st.size;
    } else {
      const allocated = st.blocks * 512;
      out.knownAllocatedBytes += allocated;
      out.knownAllocatedEntries++;
      out.bytes += allocated;
    }
  }
  return out;
}

const CONFIGURED_ROOT_LIMIT = 256;
const CONFIGURED_FAMILY_ENTRY_LIMIT = 10000;

function configuredRoots(entries, coverage) {
  const containers = [], families = [];
  for (const { paths, kind } of entries) {
    if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string" || !path.trim())) {
      throw new Error(`Configured ${kind} roots must be nonempty paths`);
    }
    for (const configured of paths) {
      const abs = resolve(configured);
      let canonical;
      try { canonical = canonicalPath(abs); } catch (error) {
        coverage.complete = false;
        coverage.inventoryComplete = false;
        coverage.scopeIssues.push({ kind: "unreadable-root", path: abs, reason: error.message });
        containers.push({ abs, canonical: abs, kind: `${kind}-container`, container: true });
        continue;
      }
      const container = { abs, canonical, kind: `${kind}-container`, container: true };
      containers.push(container);
      let directory;
      try {
        if (!statSync(abs).isDirectory()) throw new Error("configured root is not a directory");
        directory = opendirSync(abs);
      } catch (error) {
        coverage.complete = false;
        coverage.inventoryComplete = false;
        coverage.scopeIssues.push({ kind: existsSync(abs) ? "unreadable-root" : "missing-root", path: abs, reason: error.message });
        continue;
      }

      const names = [];
      try {
        for (let i = 0; i <= CONFIGURED_ROOT_LIMIT; i++) {
          const entry = directory.readSync();
          if (!entry) break;
          names.push(entry.name);
        }
      } catch (error) {
        coverage.complete = false;
        coverage.inventoryComplete = false;
        coverage.scopeIssues.push({ kind: "unreadable-root", path: abs, reason: error.message });
      } finally { directory.closeSync(); }
      const overflow = names.length > CONFIGURED_ROOT_LIMIT;
      if (overflow) {
        names.length = CONFIGURED_ROOT_LIMIT;
        coverage.complete = false;
        coverage.inventoryComplete = false;
        coverage.scopeIssues.push({ kind: "configured-family-limit", path: abs, limit: CONFIGURED_ROOT_LIMIT });
      }
      for (const name of names.sort()) {
        const child = join(abs, name);
        let st;
        try { st = lstatSync(child); } catch (error) {
          coverage.complete = false;
          coverage.inventoryComplete = false;
          coverage.scopeIssues.push({ kind: "unreadable-child", path: child, reason: error.message });
          continue;
        }
        if (!st.isDirectory() && !st.isFile() && !st.isSymbolicLink()) {
          coverage.complete = false;
          coverage.inventoryComplete = false;
          coverage.scopeIssues.push({ kind: "unsupported-child", path: child });
          continue;
        }
        const family = { abs: child, kind, containerAbs: abs };
        families.push(family);
        if (st.isSymbolicLink()) {
          let target;
          try { target = realpathSync(child); } catch (error) {
            coverage.complete = false;
            coverage.inventoryComplete = false;
            coverage.scopeIssues.push({ kind: "unreadable-child", path: child, reason: error.message });
            continue;
          }
          if (!inside(target, canonical)) {
            coverage.complete = false;
            coverage.inventoryComplete = false;
            coverage.scopeIssues.push({ kind: "symlink-escape", path: child, target });
          }
        }
      }
    }
  }
  return { containers, families };
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

function freeSpace(repo, coverage, volumeIdentity) {
  const fs = statfsSync(repo), entries = [{ path: repo, free: fs.bavail * fs.bsize, total: fs.blocks * fs.bsize, volumeId: volumeIdentity(repo) ?? null }];
  const version = existsSync("/proc/version") ? readFileSync("/proc/version", "utf8") : "";
  const isWsl = /microsoft/i.test(version);
  let hostUnverified = false;
  if (isWsl) {
    const host = wslHostVolume(coverage);
    if (host) entries.push(host);
    else hostUnverified = true;
  }
  const free = Math.min(...entries.map((e) => e.free));
  const limiting = entries.filter((entry) => entry.free === free);
  return { free, volumeId: !hostUnverified && limiting.length === 1 ? limiting[0].volumeId : null, entries };
}

function filesystemDevice(path) {
  try {
    const device = statSync(path).dev;
    return Number.isSafeInteger(device) && device >= 0 ? `dev:${device}` : null;
  } catch { return null; }
}

function wslHostVolume(coverage) {
  const distro = process.env.WSL_DISTRO_NAME;
  if (typeof distro !== "string" || !distro.trim()) {
    coverage.complete = false;
    coverage.hostDrive = "unavailable";
    coverage.hostDriveReason = "WSL_DISTRO_NAME is missing";
    return undefined;
  }

  const name = Buffer.from(distro, "utf8").toString("base64");
  const script = `$ErrorActionPreference='Stop'; $name=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${name}')); $items=@(Get-ChildItem -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss' | ForEach-Object { $entry=Get-ItemProperty -LiteralPath $_.PSPath; if($entry.DistributionName -ceq $name){ $basePath=[string]$entry.BasePath; $vhd=Join-Path -Path $basePath -ChildPath 'ext4.vhdx'; $exists=Test-Path -LiteralPath $vhd -PathType Leaf; $volume=$null; if($exists){ $volumes=@(Get-Volume -FilePath $vhd -ErrorAction Stop); if($volumes.Count -ne 1){throw 'WSL VHD did not resolve to one Windows volume'}; $volume=$volumes[0] }; [PSCustomObject]@{Name=$entry.DistributionName;BasePath=$basePath;VhdExists=$exists;Drive=[string]$volume.DriveLetter;VolumeId=[string]$volume.UniqueId;Free=[string]$volume.SizeRemaining;Total=[string]$volume.Size} } }); $json=ConvertTo-Json -Compress -InputObject $items; [Console]::WriteLine([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json)))`;
  const run = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], {
    encoding: "utf8", timeout: 10000, maxBuffer: 64 * 1024, windowsHide: true,
  });
  if (run.error || run.status !== 0) {
    coverage.complete = false;
    coverage.hostDrive = "unavailable";
    coverage.hostDriveReason = run.error?.message ?? "Windows volume lookup failed";
    return undefined;
  }

  let volumes;
  try {
    const encoded = run.stdout.trim();
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error("invalid PowerShell response");
    const data = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    volumes = Array.isArray(data) ? data : data === null ? [] : [data];
  } catch (error) {
    coverage.complete = false;
    coverage.hostDrive = "unavailable";
    coverage.hostDriveReason = error.message;
    return undefined;
  }

  const [volume] = volumes;
  const integer = (value) => typeof value === "string" && /^(0|[1-9]\d*)$/.test(value) ? Number(value) : NaN;
  const free = integer(volume?.Free), total = integer(volume?.Total);
  const drive = typeof volume?.Drive === "string" && /^[A-Za-z]$/.test(volume.Drive) ? `${volume.Drive.toUpperCase()}:` : undefined;
  const stableId = typeof volume?.VolumeId === "string" && /^\\\\\?\\Volume\{[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}\}\\$/.test(volume.VolumeId)
    ? volume.VolumeId.toUpperCase() : undefined;
  const displayIdentity = drive ?? stableId;
  if (volumes.length !== 1 || volume?.Name !== distro || typeof volume.BasePath !== "string" || !volume.BasePath.trim()
    || volume.VhdExists !== true || !displayIdentity || !Number.isSafeInteger(free) || free < 0
    || !Number.isSafeInteger(total) || total <= 0 || total < free) {
    coverage.complete = false;
    coverage.hostDrive = "unavailable";
    coverage.hostDriveReason = "WSL VHD registration or volume data is missing or ambiguous";
    return undefined;
  }

  coverage.hostDrive = `registered ${displayIdentity} volume for this WSL distro`;
  return { path: `Windows ${displayIdentity}`, free, total, volumeId: stableId ?? null };
}

function freeSpaceTrend(path, freeSpace, now) {
  const unavailable = (reason) => ({ status: "unavailable", reason });
  if (!path) return unavailable("history not supplied");
  let input;
  try { input = JSON.parse(readFileSync(path, "utf8")); } catch (error) { return unavailable(`history could not be read: ${error.message}`); }
  const keys = (value, allowed) => value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).every((key) => allowed.includes(key));
  if (!keys(input, ["version", "freshForMinutes", "samples"]) || input.version !== 1
    || !Number.isInteger(input.freshForMinutes) || input.freshForMinutes < 1 || input.freshForMinutes > 1440
    || !Array.isArray(input.samples) || input.samples.length < 2) return unavailable("history schema is invalid or has fewer than two samples");
  if (typeof freeSpace.volumeId !== "string" || !freeSpace.volumeId) return unavailable("current free-space volume identity is unavailable or ambiguous");
  let previous = -Infinity;
  for (const sample of input.samples) {
    if (!keys(sample, ["volumeId", "observedAt", "freeBytes"]) || typeof sample.volumeId !== "string" || !sample.volumeId.trim()
      || sample.volumeId !== freeSpace.volumeId || !validUtc(sample.observedAt)
      || !Number.isSafeInteger(sample.freeBytes) || sample.freeBytes < 0) {
      return unavailable("history contains an invalid sample or a volume that does not match the current free-space volume");
    }
    const observedAt = Date.parse(sample.observedAt);
    if (observedAt <= previous) return unavailable("history timestamps are not strictly increasing");
    previous = observedAt;
  }
  const first = input.samples[0], last = input.samples.at(-1), age = now - Date.parse(last.observedAt);
  if (age < 0 || age > input.freshForMinutes * 60000) return unavailable("latest free-space history sample is stale or from the future");
  const elapsedMs = Date.parse(last.observedAt) - Date.parse(first.observedAt);
  const changeBytes = last.freeBytes - first.freeBytes;
  return { status: "available", volumeId: freeSpace.volumeId, changeBytes, elapsedMs, bytesPerHour: changeBytes / (elapsedMs / 3600000) };
}

function canonicalJson(value) {
  return Array.isArray(value) ? `[${value.map(canonicalJson).join(",")}]`
    : value && typeof value === "object" ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`
      : JSON.stringify(value);
}

function inventoryFingerprint(snapshot, family) {
  return createHash("sha256").update(canonicalJson({ snapshot, path: family.path, inventory: family.inventory })).digest("hex");
}

function validUtc(value) {
  const match = typeof value === "string" && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/.exec(value);
  if (!match) return false;
  const date = new Date(value), parts = match.slice(1, 7).map(Number);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() === parts[0] && date.getUTCMonth() + 1 === parts[1]
    && date.getUTCDate() === parts[2] && date.getUTCHours() === parts[3] && date.getUTCMinutes() === parts[4]
    && date.getUTCSeconds() === parts[5];
}

function applyGrowth(families, opts, snapshot, observedAt, coverage) {
  if (!opts.regrowth) return;
  let prior;
  try { prior = JSON.parse(readFileSync(opts.regrowth, "utf8")); } catch (error) { throw new Error(`Regrowth prior could not be read: ${error.message}`); }
  const sameWorkspace = (a, b) => a && b && a.root === b.root && a.gitCommon === b.gitCommon && a.project === b.project;
  if (!prior || prior.reportVersion !== 1 || !validUtc(prior.observedAt) || !Array.isArray(prior.families)
    || !prior.snapshot || !prior.snapshot.workspace || !Array.isArray(prior.snapshot.scope) || prior.coverage?.inventoryComplete !== true
    || Date.parse(prior.observedAt) >= Date.parse(observedAt) || !sameWorkspace(prior.snapshot.workspace, snapshot.workspace)
    || JSON.stringify(prior.snapshot.scope) !== JSON.stringify(snapshot.scope)) {
    throw new Error("Regrowth prior must be a complete version 1 report from this workspace and configured scope, observed before this report");
  }
  const previous = new Map();
  for (const family of prior.families) {
    if (!family || typeof family.path !== "string" || !Array.isArray(family.inventory) || !Number.isSafeInteger(family.logicalBytes) || family.logicalBytes < 0
      || previous.has(family.path)) throw new Error("Regrowth prior contains an invalid family snapshot");
    previous.set(family.path, family);
  }

  const cleaned = new Map();
  if (opts.cleanupRecord) {
    let record;
    try { record = JSON.parse(readFileSync(opts.cleanupRecord, "utf8")); } catch (error) { throw new Error(`Cleanup record could not be read: ${error.message}`); }
    const keys = (value, allowed) => value && typeof value === "object" && !Array.isArray(value)
      && Object.keys(value).every((key) => allowed.includes(key));
    if (!keys(record, ["version", "status", "scope", "cleanedAt", "snapshot", "families"]) || record.version !== 1
      || record.status !== "completed" || record.scope !== "whole-family"
      || !validUtc(record.cleanedAt) || !(Date.parse(prior.observedAt) < Date.parse(record.cleanedAt) && Date.parse(record.cleanedAt) < Date.parse(observedAt))
      || canonicalJson(record.snapshot) !== canonicalJson(prior.snapshot)
      || !Array.isArray(record.families) || !record.families.length) {
      throw new Error("Cleanup record must be a completed whole-family cleanup after its prior report and before this report, bound to that exact snapshot");
    }
    for (const entry of record.families) {
      if (!keys(entry, ["path", "inventoryFingerprint"]) || typeof entry.path !== "string" || cleaned.has(entry.path)) {
        throw new Error("Cleanup record contains an invalid family entry");
      }
      const family = previous.get(entry.path);
      if (!family || entry.inventoryFingerprint !== inventoryFingerprint(prior.snapshot, family)) {
        throw new Error(`Cleanup record does not match prior family inventory: ${entry.path}`);
      }
      cleaned.set(entry.path, record.cleanedAt);
    }
  }

  for (const current of families) {
    if (!coverage.inventoryComplete || !current.inventoryComplete) {
      current.growth = { classification: "unavailable", reason: "family inventory coverage is incomplete" };
      continue;
    }
    const before = previous.get(current.path);
    if (!before) {
      current.growth = { classification: "new", currentBytes: current.logicalBytes };
      continue;
    }
    const cleanedAt = cleaned.get(current.path);
    if (cleanedAt && current.inventory.length) {
      current.growth = { classification: "regrowth", priorBytes: before.logicalBytes, currentBytes: current.logicalBytes,
        changeBytes: current.logicalBytes - before.logicalBytes, cleanedAt };
    } else if (current.logicalBytes > before.logicalBytes) {
      current.growth = { classification: "ordinary growth", priorBytes: before.logicalBytes, currentBytes: current.logicalBytes,
        changeBytes: current.logicalBytes - before.logicalBytes };
    } else if (current.logicalBytes < before.logicalBytes) {
      current.growth = { classification: "shrinkage", priorBytes: before.logicalBytes, currentBytes: current.logicalBytes,
        changeBytes: current.logicalBytes - before.logicalBytes };
    } else current.growth = { classification: "unchanged", priorBytes: before.logicalBytes, currentBytes: current.logicalBytes, changeBytes: 0 };
  }
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

function preservationInput(path) {
  if (!path) return { workspace: null, families: {}, supplied: false };
  const input = JSON.parse(readFileSync(path, "utf8"));
  if (!input || Object.keys(input).some((key) => !["version", "workspace", "families"].includes(key))
    || input.version !== 1 || typeof input.workspace !== "string" || !input.workspace.trim()
    || !input.families || typeof input.families !== "object" || Array.isArray(input.families)) {
    throw new Error("Preservation input must have version 1, a workspace name, and a families object");
  }
  const families = Object.create(null);
  for (const [name, value] of Object.entries(input.families)) {
    const normalized = posix(name);
    const absolute = isAbsolute(name) || /^[A-Za-z]:\//.test(normalized);
    if (!name || normalized.includes("\\") || normalized.split("/").includes("..") || (!absolute && normalized.startsWith("/"))
      || !value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).some((key) => !["owner", "retention", "dependencies"].includes(key))) {
      throw new Error(`Invalid preservation family: ${name}`);
    }
    if (Object.hasOwn(families, normalized)) throw new Error(`Duplicate preservation family: ${name}`);
    if (value.owner !== undefined && (typeof value.owner !== "string" || !value.owner.trim())) throw new Error(`Invalid owner for ${name}`);
    if (value.retention !== undefined && (!value.retention || typeof value.retention !== "object" || Array.isArray(value.retention)
      || Object.keys(value.retention).some((key) => !["disposition", "note"].includes(key))
      || !["retained", "released", "unknown"].includes(value.retention.disposition)
      || (value.retention.note !== undefined && (typeof value.retention.note !== "string" || !value.retention.note.trim())))) {
      throw new Error(`Invalid retention disposition for ${name}`);
    }
    if (value.dependencies !== undefined && (!value.dependencies || typeof value.dependencies !== "object" || Array.isArray(value.dependencies)
      || Object.keys(value.dependencies).some((key) => !["complete", "active", "provenance", "observedAt", "freshForMinutes"].includes(key))
      || typeof value.dependencies.complete !== "boolean"
      || !Array.isArray(value.dependencies.active) || value.dependencies.active.some((item) => typeof item !== "string"))) {
      throw new Error(`Invalid dependency observation for ${name}`);
    }
    if (value.dependencies !== undefined && (typeof value.dependencies.provenance !== "string" || !value.dependencies.provenance.trim()
      || typeof value.dependencies.observedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value.dependencies.observedAt)
      || !Number.isFinite(Date.parse(value.dependencies.observedAt))
      || !Number.isInteger(value.dependencies.freshForMinutes) || value.dependencies.freshForMinutes < 1 || value.dependencies.freshForMinutes > 1440)) {
      throw new Error(`Dependency observation needs provenance, UTC observedAt, and freshForMinutes from 1 to 1440 for ${name}`);
    }
    families[normalized] = value;
  }
  return { workspace: input.workspace, families, supplied: true };
}

function workspaceIdentity(repo) {
  const common = git(repo, ["rev-parse", "--git-common-dir"]).trim();
  return {
    root: repo,
    gitCommon: realpathSync(isAbsolute(common) ? common : resolve(repo, common)),
    head: git(repo, ["rev-parse", "HEAD"]).trim(),
  };
}

const canonicalPath = (path) => existsSync(path) ? realpathSync(path) : resolve(path);

export function inspect(opts, now = Date.now(), stat = lstatSync, volumeIdentity = filesystemDevice) {
  const repo = realpathSync(opts.repo), coverage = { complete: true, inventoryComplete: true,
    sizes: "filesystem block allocation; legacy bytes falls back to logical length when unavailable", allocation: "complete" };
  // opts.open supplies the open-file set; the fixture tests pass one so each call skips a machine-wide lsof.
  if (opts.open) coverage.openFiles = "supplied";
  const tracked = trackedText(repo), status = tickets(repo), open = opts.open ?? openPaths(coverage), trees = worktrees(repo);
  const preservation = preservationInput(opts.preservation);
  coverage.preservation = preservation.supplied ? "supplied" : "not supplied";
  if (!preservation.supplied) coverage.complete = false;
  const roots = [];
  coverage.scopeIssues = [];
  const scratch = join(repo, ".scratch");
  if (existsSync(scratch)) for (const name of readdirSync(scratch)) roots.push({ abs: join(scratch, name), kind: "scratch" });
  for (const rel of git(repo, ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"]).split("\0").filter(Boolean)) {
    const abs = join(repo, rel.replace(/\/$/, ""));
    if (rel.endsWith("/") && !inside(abs, scratch)) roots.push({ abs, kind: "ignored" });
  }
  for (const p of opts.paths) roots.push({ abs: resolve(p), kind: "outside" });
  const configured = configuredRoots([
    { paths: opts.agentStateRoots ?? [], kind: "agent-state" },
    { paths: opts.runnerTempRoots ?? [], kind: "runner-temp" },
  ], coverage);
  for (const t of trees) if (!roots.some((r) => inside(t.path, r.abs))
    && !configured.containers.some((container) => inside(t.path, container.canonical))) roots.push({ abs: t.path, kind: "worktree" });

  const scope = [
    ...roots.map((root) => ({ ...root, canonical: canonicalPath(root.abs) })),
    ...configured.families.map((root) => ({ ...root, canonical: canonicalPath(root.abs) })),
    ...configured.containers.map((root) => ({ ...root, stableContainer: true })),
  ];
  const collisions = new Set();
  for (let i = 0; i < scope.length; i++) {
    const root = scope[i];
    if (!root.stableContainer && inside(root.abs, repo) && !inside(root.canonical, repo)) {
      coverage.scopeIssues.push({ kind: "symlink-escape", path: root.abs, target: root.canonical });
      coverage.inventoryComplete = false;
      collisions.add(i);
    }
    for (let j = i + 1; j < scope.length; j++) {
      const other = scope[j];
      if ((root.stableContainer && other.containerAbs === root.abs) || (other.stableContainer && root.containerAbs === other.abs)) continue;
      if (inside(root.canonical, other.canonical) || inside(other.canonical, root.canonical)) {
        coverage.scopeIssues.push({ kind: "overlapping-roots", paths: [root.abs, other.abs] });
        coverage.inventoryComplete = false;
        collisions.add(i);
        collisions.add(j);
        for (let k = 0; k < scope.length; k++) {
          if (scope[k].containerAbs === root.abs || scope[k].containerAbs === other.abs) collisions.add(k);
        }
      }
    }
  }
  if (coverage.scopeIssues.length) coverage.complete = false;
  const scopedRoots = scope.filter((_, index) => !collisions.has(index));
  const scopeIdentity = scopedRoots.filter((root) => root.stableContainer || !root.containerAbs)
    .map(({ abs, canonical, kind }) => ({ path: abs, canonical, kind })).sort((a, b) => a.path.localeCompare(b.path));
  const workspace = { ...workspaceIdentity(repo), project: preservation.workspace };
  const snapshot = { workspace, scope: scopeIdentity };

  const seen = new Set(), families = [];
  for (const r of scopedRoots.filter((root) => !root.stableContainer)) {
    const rel = inside(r.abs, repo) ? posix(relative(repo, r.abs)) : undefined;
    const name = basename(r.abs), ticket = ticketOf(name);
    if (opts.ticket !== undefined && ticket !== opts.ticket) continue;
    const worktree = trees.find((t) => t.path === r.abs);
    if (!existsSync(r.abs) && !worktree?.prunable) {
      coverage.complete = false;
      coverage.inventoryComplete = false;
      coverage.scopeIssues.push({ kind: "missing-root", path: r.abs });
    }
    const w = existsSync(r.abs) ? walk(r.abs, seen, stat, r.containerAbs ? CONFIGURED_FAMILY_ENTRY_LIMIT : Infinity)
      : { bytes: 0, logicalBytes: 0, knownAllocatedBytes: 0, knownAllocatedEntries: 0, allocationKnown: true,
        files: 0, newest: 0, epochDated: 0, hardLinked: [], all: [], errors: 0, truncated: false };
    if (w.truncated) {
      coverage.complete = false;
      coverage.inventoryComplete = false;
      coverage.scopeIssues.push({ kind: "family-entry-limit", path: r.abs, limit: CONFIGURED_FAMILY_ENTRY_LIMIT });
    }
    if (w.errors) {
      coverage.complete = false;
      coverage.inventoryComplete = false;
      coverage.scopeIssues.push({ kind: "incomplete-root", path: r.abs, errors: w.errors });
    }
    if (!w.allocationKnown) {
      coverage.allocation = "partial";
      coverage.complete = false;
      coverage.scopeIssues.push({ kind: "allocation-unavailable", path: r.abs });
    }
    const cite = citations(rel, r.abs, tracked, repo);
    const activeReasons = [];
    const quietFor = (now - w.newest) / 60000;
    if (w.newest && quietFor < opts.quietMinutes) activeReasons.push(`written ${Math.floor(quietFor)}m ago (quiet floor ${opts.quietMinutes}m)`);
    const openHere = [...open].filter((p) => inside(p, r.abs));
    if (openHere.length) activeReasons.push(`${openHere.length} open file(s)`);
    for (const t of trees) if (t.active && (inside(t.path, r.abs)
      || (r.containerAbs && (t.path === r.containerAbs || inside(r.containerAbs, t.path))))) {
      activeReasons.push(`active worktree ${posix(relative(repo, t.path)) || t.path}${t.branch ? ` on ${t.branch}` : ""}${t.dirty ? " with uncommitted changes" : ""}`);
    }
    const identity = preservation.families[rel ?? posix(r.abs)];
    const ownership = identity?.owner ? "known" : "unknown";
    const retentionStatus = identity?.retention?.disposition ?? "unknown";
    const observationAge = identity?.dependencies ? now - Date.parse(identity.dependencies.observedAt) : Infinity;
    const observationFresh = identity?.dependencies && observationAge >= -5 * 60000
      && observationAge <= identity.dependencies.freshForMinutes * 60000;
    const dependencyStatus = !identity?.dependencies ? "unavailable"
      : !observationFresh ? "stale"
        : identity.dependencies.complete ? "complete" : "partial";
    const externalActive = identity?.dependencies?.active ?? [];
    if (observationFresh) activeReasons.push(...externalActive.map((dependency) => `active dependency ${dependency}`));
    const keepSeen = new Set();
    const keepWalks = cite.keep.map((k) => walk(join(repo, k), keepSeen, stat));
    const keepLogicalBytes = keepWalks.reduce((n, item) => n + item.logicalBytes, 0);
    const keepBytes = keepWalks.every((item) => item.allocationKnown && !item.errors && !item.truncated)
      ? keepWalks.reduce((n, item) => n + item.bytes, 0) : null;
    const inventoryComplete = !w.errors && !w.truncated && !coverage.scopeIssues.some((issue) => issue.kind !== "allocation-unavailable"
      && (issue.path === r.abs || issue.paths?.includes(r.abs)));
    const familyAllocationKnown = inventoryComplete && w.allocationKnown;
    const allocationStatus = !inventoryComplete
      ? w.allocationKnown ? "inventory-incomplete" : w.knownAllocatedEntries ? "inventory-and-allocation-incomplete" : "inventory-incomplete"
      : w.allocationKnown ? "known" : w.knownAllocatedEntries ? "partial" : "unavailable";
    const f = {
      path: rel ?? r.abs, kind: r.kind, bytes: w.bytes,
      allocatedBytes: familyAllocationKnown ? w.knownAllocatedBytes : null,
      ...(!familyAllocationKnown && w.knownAllocatedEntries ? { allocatedBytesAtLeast: w.knownAllocatedBytes } : {}),
      allocationStatus,
      logicalBytes: w.logicalBytes, ...(inventoryComplete ? {} : { logicalBytesAtLeast: w.logicalBytes }),
      reclaimableBytes: null, files: w.files,
      newestWrite: w.newest ? new Date(w.newest).toISOString() : null, epochDatedFiles: w.epochDated,
      ticket, ticketStatus: ticket === undefined ? undefined : status.get(ticket) ?? "unknown",
      citedBy: cite.citedBy, keep: cite.keep, leads: cite.leads, dangling: cite.dangling,
      keepBytes, keepLogicalBytes,
      hardLinkedFiles: w.hardLinked.map((p) => posix(relative(rel ? repo : r.abs, p))),
      openFiles: openHere.map((p) => posix(relative(rel ? repo : r.abs, p))),
      inventoryComplete, configuredRoot: r.containerAbs ?? null,
      worktree, activeReasons, ownership, retentionStatus, dependencyStatus,
      inventory: w.all.map((entry) => ({ path: posix(relative(r.abs, entry.path)), size: entry.size, type: entry.type, modified: entry.modified, changed: entry.changed, ...(entry.target === undefined ? {} : { target: entry.target }) })).sort((a, b) => a.path.localeCompare(b.path)),
      walk: w,
    };
    f.inventoryFingerprint = inventoryFingerprint(snapshot, f);
    f.unkeptFiles = w.all.filter((x) => !cite.keep.some((k) => inside(x.path, join(repo, k)))).length;
    f.outcome = outcome(f);
    if (["delete", "slim", "prune"].includes(f.outcome)) {
      if (retentionStatus === "retained") f.outcome = "keep";
      else if (ownership !== "known" || retentionStatus !== "released" || dependencyStatus !== "complete" || !coverage.complete) f.outcome = "ask";
    }
    f.preservationState = {
      workspace,
      scope: scopeIdentity,
      inventory: f.inventory,
      ticket: { id: ticket ?? null, status: f.ticketStatus ?? null },
      ownership: identity ? { owner: identity.owner ?? null, retention: identity.retention ?? null } : null,
      dependencies: { status: dependencyStatus, supplied: identity?.dependencies ?? null, activeReasons: [...activeReasons].sort(), openFiles: f.openFiles, openFileProbe: coverage.openFiles ?? "unavailable", worktree },
    };
    families.push(f);
  }
  if (opts.dedupe) dedupe(families, tracked, repo);
  const space = freeSpace(repo, coverage, volumeIdentity);
  const trend = freeSpaceTrend(opts.freeSpaceHistory, space, now);
  const observedCoverage = {
    complete: coverage.complete,
    allocation: coverage.allocation,
    openFiles: coverage.openFiles ?? "unavailable",
    hostDrive: coverage.hostDrive ?? "not-applicable",
    scopeIssues: [...coverage.scopeIssues].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  };
  for (const f of families) f.preservationState.observedCoverage = observedCoverage;
  if (!coverage.complete) for (const f of families) if (["delete", "slim", "prune"].includes(f.outcome)) {
    f.outcome = f.retentionStatus === "retained" ? "keep" : "ask";
  }

  const findings = [];
  if (space.free < opts.floor) findings.push({ kind: "free-space-floor", free: space.free, floor: opts.floor });
  if (opts.cap !== undefined) {
    const perTicket = new Map();
    const partialContainers = new Set(configured.containers.filter((container) => coverage.scopeIssues.some((issue) =>
      ["configured-family-limit", "unreadable-root", "unreadable-child", "unsupported-child", "symlink-escape"].includes(issue.kind)
      && issue.path && (issue.path === container.abs || inside(issue.path, container.abs))
      || issue.kind === "overlapping-roots" && issue.paths?.some((path) => path === container.abs || inside(path, container.abs) || inside(container.abs, path))))
      .map((container) => container.abs));
    for (const f of families) if (f.ticket !== undefined) {
      const record = perTicket.get(f.ticket) ?? { bytes: 0, unknown: new Set() };
      if (f.allocatedBytes === null) {
        if (f.allocatedBytesAtLeast !== undefined) record.bytes += f.allocatedBytesAtLeast;
        record.unknown.add(f.path);
      }
      else record.bytes += f.allocatedBytes;
      if (f.configuredRoot && partialContainers.has(f.configuredRoot)) record.unknown.add(`${f.configuredRoot} (family inventory incomplete)`);
      perTicket.set(f.ticket, record);
    }
    for (const [ticket, record] of perTicket) {
      const unknownFamilies = [...record.unknown];
      if (record.bytes > opts.cap) {
        findings.push(unknownFamilies.length
          ? { kind: "ticket-cap", ticket, allocatedBytesAtLeast: record.bytes, unknownFamilies, cap: opts.cap }
          : { kind: "ticket-cap", ticket, bytes: record.bytes, cap: opts.cap });
      } else if (unknownFamilies.length) findings.push({ kind: "ticket-cap-unverified", ticket, families: unknownFamilies, cap: opts.cap });
    }
  }
  const observedAt = new Date(now).toISOString();
  applyGrowth(families, opts, snapshot, observedAt, coverage);
  if (opts.recheck) {
    const prior = JSON.parse(readFileSync(opts.recheck, "utf8"));
    const validWorkspace = (value) => value && typeof value.root === "string" && typeof value.gitCommon === "string"
      && typeof value.head === "string" && (value.project === null || typeof value.project === "string");
    const validScope = (value) => Array.isArray(value) && value.every((root) => root && typeof root.path === "string"
      && typeof root.canonical === "string" && typeof root.kind === "string");
    if (!prior || prior.reportVersion !== 1 || !Array.isArray(prior.families) || !prior.families.length
      || !prior.snapshot || !validWorkspace(prior.snapshot.workspace) || !validScope(prior.snapshot.scope)) {
      throw new Error("Recheck input must be a nonempty version 1 inspector report with a workspace and scope snapshot");
    }
    const actionable = new Set(["delete", "slim", "prune"]);
    const paths = new Set();
    for (const before of prior.families) {
      if (!before || typeof before.path !== "string" || typeof before.outcome !== "string" || paths.has(before.path)
        || (actionable.has(before.outcome) && (!before.preservationState || !Array.isArray(before.keep)))) {
        throw new Error("Recheck report contains an invalid family snapshot");
      }
      paths.add(before.path);
    }
    const previousActionable = new Set(prior.families.filter((f) => actionable.has(f.outcome)).map((f) => f.path));
    const currentSnapshot = snapshot;
    const snapshotChanged = JSON.stringify(prior.snapshot) !== JSON.stringify(currentSnapshot);
    for (const before of prior.families) {
      if (!actionable.has(before.outcome)) continue;
      const now = families.find((f) => f.path === before.path);
      if (!now || snapshotChanged || JSON.stringify(now.preservationState) !== JSON.stringify(before.preservationState)) {
        if (now && !["skip", "keep"].includes(now.outcome)) now.outcome = "ask";
        findings.push({ kind: "preservation-changed", path: before.path, before: before.preservationState ?? null, now: now?.preservationState ?? null });
      }
      if (now && JSON.stringify(now.keep) !== JSON.stringify(before.keep)) {
        now.outcome = "keep list changed";
        findings.push({ kind: "keep-list-changed", path: before.path, before: before.keep, now: now.keep });
      }
    }
    for (const now of families) if (actionable.has(now.outcome) && !previousActionable.has(now.path)) {
      const previous = prior.families.find((f) => f.path === now.path);
      now.outcome = "ask";
      findings.push({ kind: "preservation-changed", path: now.path, before: previous?.preservationState ?? null, now: now.preservationState });
    }
  }
  for (const f of families) delete f.walk;
  families.sort((a, b) => b.bytes - a.bytes);
  const candidates = families.filter((f) => ["delete", "slim", "prune", "ask"].includes(f.outcome)).length;
  return {
    reportVersion: 1,
    snapshot,
    status: findings.length ? "fail" : candidates || !coverage.complete ? "review" : "pass",
    repo, observedAt: new Date(now).toISOString(), freeSpace: space, freeSpaceTrend: trend,
    limits: { floor: opts.floor, cap: opts.cap ?? null, quietMinutes: opts.quietMinutes },
    coverage, findings, families, conformance: conformance(tracked),
  };
}

const gib = (n) => n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GiB` : `${(n / 1024 ** 2).toFixed(1)} MiB`;

export function summary(result, topUnder) {
  const line = [`free ${gib(result.freeSpace.free)} (floor ${gib(result.limits.floor)}${result.freeSpace.free < result.limits.floor ? ": under, stop adding data" : ""})`];
  if (result.freeSpaceTrend?.status === "available") {
    const trend = result.freeSpaceTrend, hours = trend.elapsedMs / 3600000;
    line.push(`free-space trend changed ${trend.changeBytes} bytes over ${hours}h (${trend.bytesPerHour} bytes/hour) on ${trend.volumeId}`);
  } else if (result.freeSpaceTrend) line.push(`free-space trend unavailable (${result.freeSpaceTrend.reason})`);
  if (result.coverage?.hostDrive === "unavailable") {
    line.push(`Windows backing volume unavailable (${result.coverage.hostDriveReason}); free-space floor unverified`);
  }
  if (result.freeSpace.free < topUnder) line.push(`largest uncommitted: ${result.families.slice(0, 3).map((f) => {
    const note = f.inventoryComplete === false ? " observed partial"
      : f.allocatedBytes === null ? " logical (allocation unavailable)" : "";
    const amount = f.allocatedBytes ?? f.allocatedBytesAtLeast ?? f.logicalBytesAtLeast ?? f.logicalBytes;
    const label = f.allocatedBytesAtLeast !== undefined ? "allocated at least " : f.logicalBytesAtLeast !== undefined ? "logical at least " : "";
    return `${f.path} ${label}${gib(amount)}${note}`;
  }).join(", ") || "none"}`);
  for (const finding of result.findings) {
    if (finding.kind === "ticket-cap" && finding.allocatedBytesAtLeast !== undefined) line.push(`ticket ${finding.ticket} allocated at least ${gib(finding.allocatedBytesAtLeast)} exceeds cap ${gib(finding.cap)}; allocation unavailable for ${finding.unknownFamilies.join(", ")}`);
    else if (finding.kind === "ticket-cap") line.push(`ticket ${finding.ticket} allocated ${gib(finding.bytes)} exceeds cap ${gib(finding.cap)}`);
    if (finding.kind === "ticket-cap-unverified") line.push(`ticket ${finding.ticket} cap ${gib(finding.cap)} unverified for ${finding.families.join(", ")}`);
  }
  for (const family of result.families) {
    if (family.growth?.classification === "regrowth") line.push(`regrowth: ${family.path} reappeared with ${family.growth.currentBytes} logical bytes`);
    else if (family.growth?.classification === "ordinary growth") line.push(`ordinary growth: ${family.path} changed ${family.growth.changeBytes} logical bytes`);
  }
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
