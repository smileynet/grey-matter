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

function readVersionFile({ path, field }, env) {
  const file = expand(path, env);
  if (!existsSync(file)) return { error: `missing ${file}` };
  const value = field.split(".").reduce((o, k) => o?.[k], JSON.parse(readFileSync(file, "utf8")));
  return typeof value === "string" ? { version: value } : { error: `no ${field} in ${file}` };
}

const firstVersion = (text) => text.match(/\d+\.\d+(?:\.\d+)*(?:[-+][\w.]+)?/)?.[0] ?? null;

export function probe(entry, { env = process.env, home = homedir() } = {}) {
  if (entry.versionFile) {
    const v = readVersionFile(entry.versionFile, env);
    return v.error ? { missing: v.error } : { version: v.version, hashes: {} };
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

// status: unchanged | moved | new | missing | error
export function compare(recorded, current) {
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

export function main(argv = process.argv.slice(2), { env = process.env, home = homedir(), today = new Date().toISOString().slice(0, 10), log = console.log } = {}) {
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
    const current = probe(entry, { env, home });
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
  return results.some((r) => r.status !== "unchanged") ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
