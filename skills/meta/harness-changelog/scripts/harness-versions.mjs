#!/usr/bin/env node
// Detect harness upgrades against a committed baseline, with no network.
// Usage: node harness-versions.mjs [--manifest FILE] [--only ID,ID] [--update] [--json]
// Exit codes: 0 = nothing moved, 1 = a harness moved (or is new or missing), 2 = input or probe error.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST = resolve(HERE, "../../../../docs/agents/harness-surfaces/versions.json");
const EMPTY_HASH = createHash("sha256").update("").digest("hex").slice(0, 12);
const TIMEOUT_MS = 60_000;

export function expand(path, env = process.env) {
  return path
    .replace(/%([A-Za-z_][A-Za-z0-9_]*)%/g, (m, name) => env[name] ?? m)
    .replace(/^~(?=[\\/]|$)/, env.USERPROFILE ?? env.HOME ?? homedir());
}

// Help text can carry per-user values (Crush prints a named-pipe path with the Windows SID),
// so hashes are taken after replacing them; otherwise every account would see a "change".
export function normalize(text, home = homedir()) {
  let out = text.replace(/\r\n?/g, "\n");
  const homes = new Set([home, home.replace(/\\/g, "/"), home.replace(/\\/g, "\\\\")]);
  for (const h of [...homes].filter(Boolean).sort((a, b) => b.length - a.length)) out = out.split(h).join("~");
  return out.replace(/S-1-5-21(?:-\d+)+/g, "<SID>");
}

export const helpHash = (text, home) => createHash("sha256").update(normalize(text, home)).digest("hex").slice(0, 12);

function runCapture(argv0, args, env) {
  const r = spawnSync(argv0, args, { encoding: "utf8", env, timeout: TIMEOUT_MS, windowsHide: true, maxBuffer: 16 * 1024 ** 2 });
  if (r.error) return { error: r.error.code === "ENOENT" ? "not found" : r.error.message };
  // agy prints help on stderr; keeping both streams in a fixed order keeps the hash stable.
  return { text: `${r.stdout ?? ""}${r.stderr ?? ""}`, status: r.status };
}

function resolveBinary(candidates, env) {
  for (const raw of candidates) {
    const path = expand(raw, env);
    if (/[\\/]/.test(path) ? existsSync(path) : !runCapture(path, ["--version"], env).error) return path;
  }
  return null;
}

const pick = (obj, field) => field.split(".").reduce((o, k) => o?.[k], obj);

// Electron's app.asar: UInt32LE at 4 = header pickle size, at 12 = header JSON length, JSON
// from 16; file data starts at 8 + the pickle size. Reading package.json this way needs no
// extraction, which is how GUI apps with no CLI expose their version.
export function readAsarJson(file, inner = "package.json") {
  const buf = readFileSync(file);
  const headerJson = JSON.parse(buf.subarray(16, 16 + buf.readUInt32LE(12)).toString("utf8"));
  const node = inner.split("/").reduce((n, part) => n?.files?.[part], headerJson);
  if (!node || node.offset === undefined) throw new Error(`${inner} not in ${file}`);
  const start = 8 + buf.readUInt32LE(4) + Number(node.offset);
  return JSON.parse(buf.subarray(start, start + node.size).toString("utf8"));
}

const PS = ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command"];
const psQuote = (s) => `'${s.replace(/'/g, "''")}'`;

// Typed, offline version sources, tried in order; the first that yields a version wins.
// winget is deliberately absent: it reported Kiro Crew 0.9.0 while 0.11.1 was installed.
function readSource(src, env) {
  const file = src.path && expand(src.path, env);
  if (file && !existsSync(file)) return { error: `missing ${file}` };
  switch (src.source) {
    case "json-file": {
      const v = pick(JSON.parse(readFileSync(file, "utf8")), src.field ?? "version");
      return typeof v === "string" ? { version: v } : { error: `no ${src.field} in ${file}` };
    }
    case "asar": {
      const v = pick(readAsarJson(file, src.inner), src.field ?? "version");
      return typeof v === "string" ? { version: v } : { error: `no ${src.field ?? "version"} in ${file}` };
    }
    case "file-version":
      return fromCommand([...PS, `(Get-Item -LiteralPath ${psQuote(file)}).VersionInfo.${src.field ?? "FileVersion"}`], env);
    case "appx":
      return fromCommand([...PS, `(Get-AppxPackage -Name ${psQuote(src.name)}).Version`], env);
    case "plist":
      return fromCommand(["/usr/libexec/PlistBuddy", "-c", `Print :${src.key ?? "CFBundleShortVersionString"}`, file], env);
    case "command":
      return fromCommand(src.argv.map((a) => expand(a, env)), env);
    default:
      return { error: `unknown version source ${src.source}` };
  }
}

function fromCommand([argv0, ...args], env) {
  const r = runCapture(argv0, args, env);
  if (r.error) return { error: r.error };
  if (r.status !== 0) return { error: `exit ${r.status}` };
  const version = firstVersion(r.text);
  return version ? { version } : { error: `no version in ${JSON.stringify(r.text.slice(0, 60))}` };
}

const firstVersion = (text) => text.match(/\d+\.\d+(?:\.\d+)*(?:[-+][\w.]+)?/)?.[0] ?? null;

// Windows version resources pad to four parts (2.28.2.0); drop one trailing .0 so they match
// the version the app reports elsewhere.
export const normalizeVersion = (v) => (/^\d+\.\d+\.\d+\.0$/.test(v) ? v.slice(0, -2) : v);

const appliesHere = (os, platform) => !os || os.includes(platform);

export function probe(entry, { env = process.env, home = homedir(), platform = process.platform } = {}) {
  if (!appliesHere(entry.os, platform)) return { skipped: `not for ${platform}` };
  if (entry.versionSources) {
    const errors = [];
    for (const src of entry.versionSources.filter((s) => appliesHere(s.os, platform))) {
      try {
        const v = readSource(src, env);
        if (v.version) return { version: normalizeVersion(v.version), hashes: {}, source: src.source };
        errors.push(`${src.source}: ${v.error}`);
      } catch (e) {
        errors.push(`${src.source}: ${e.message}`);
      }
    }
    return { missing: errors.join("; ") || `no version source for ${platform}` };
  }
  const bin = resolveBinary(entry.bin, env);
  if (!bin) return { missing: `none of ${entry.bin.join(", ")} found` };
  const prefix = entry.args ?? [];
  const v = runCapture(bin, [...prefix, ...(entry.versionArgs ?? ["--version"])], env);
  if (v.error) return { error: `version: ${v.error}` };
  if (v.status !== 0) return { error: `version: exit ${v.status}: ${JSON.stringify(v.text.slice(0, 80))}` };
  const version = firstVersion(v.text);
  if (!version) return { error: `version: no version in output ${JSON.stringify(v.text.slice(0, 80))}` };
  const hashes = {}, errors = [];
  for (const args of entry.help ?? [["--help"]]) {
    const key = args.join(" ");
    const h = runCapture(bin, [...prefix, ...args], env);
    if (h.error) { errors.push(`${key}: ${h.error}`); continue; }
    const hash = helpHash(h.text, home);
    if (hash === EMPTY_HASH) errors.push(`${key}: printed nothing`);
    else hashes[key] = hash;
  }
  return { version, hashes, ...(errors.length && { error: errors.join("; ") }) };
}

// status: unchanged | moved | new | missing | skipped | error
export function compare(recorded, current) {
  if (current.skipped) return { status: "skipped", detail: current.skipped };
  if (current.missing) return { status: "missing", detail: current.missing };
  if (current.error && !Object.keys(current.hashes ?? {}).length) return { status: "error", detail: current.error };
  if (!recorded) return { status: "new", version: current.version, ...(current.error && { warning: current.error }) };
  const keys = new Set([...Object.keys(recorded.hashes ?? {}), ...Object.keys(current.hashes ?? {})]);
  const changed = [...keys].filter((k) => recorded.hashes?.[k] !== current.hashes?.[k]).sort();
  const versionMoved = recorded.version !== current.version;
  const out = { status: versionMoved || changed.length ? "moved" : "unchanged", from: recorded.version, to: current.version, changedHelp: changed };
  return current.error ? { ...out, warning: current.error } : out;
}

function parseArgs(argv) {
  const opts = { manifest: DEFAULT_MANIFEST, update: false, json: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--update") opts.update = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--manifest" && argv[i + 1]) opts.manifest = resolve(argv[++i]);
    else if (a === "--only" && argv[i + 1]) opts.only = new Set(argv[++i].split(","));
    else throw new Error(`unknown or incomplete option: ${a}`);
  }
  return opts;
}

export function main(argv = process.argv.slice(2), { env = process.env, home = homedir(), platform = process.platform, today = new Date().toISOString().slice(0, 10), log = console.log } = {}) {
  let opts, manifest;
  try {
    opts = parseArgs(argv);
    manifest = JSON.parse(readFileSync(opts.manifest, "utf8"));
    if (!Array.isArray(manifest.harnesses)) throw new Error("manifest has no harnesses array");
  } catch (e) {
    log(`error: ${e.message}`);
    return 2;
  }
  const results = [];
  for (const entry of manifest.harnesses) {
    if (opts.only && !opts.only.has(entry.id)) continue;
    const current = probe(entry, { env, home, platform });
    const result = { id: entry.id, surface: entry.surface, ...compare(entry.recorded, current) };
    results.push(result);
    if (opts.update && ["moved", "new"].includes(result.status)) {
      entry.recorded = { version: current.version, date: today, hashes: current.hashes };
    }
  }
  if (opts.update) writeFileSync(opts.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
  if (opts.json) log(JSON.stringify({ results }, null, 2));
  else for (const r of results) {
    const what = r.status === "moved" ? `${r.from} -> ${r.to}${r.changedHelp.length ? `; help changed: ${r.changedHelp.join(", ")}` : ""}`
      : r.status === "unchanged" ? r.to : r.version ?? r.detail ?? "";
    log(`${r.status.padEnd(9)} ${r.id} (${r.surface}) ${what}${r.warning ? ` [warning: ${r.warning}]` : ""}`);
  }
  if (results.some((r) => r.status === "error")) return 2;
  return results.some((r) => !["unchanged", "skipped"].includes(r.status)) ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
