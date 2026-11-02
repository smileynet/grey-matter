#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, extname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
function parseArgs(args) {
  const options = { tkt: "tkt", prefix: [] };
  while (args.length) {
    const key = args.shift();
    if (["--pack", "--tkt", "--cache"].includes(key) && args.length) options[key.slice(2)] = args.shift();
    else if (key === "--tkt-prefix" && args.length) options.prefix.push(args.shift());
    else throw new Error(`unknown/incomplete option: ${key}`);
  }
  if (!options.pack) throw new Error("usage: node scripts/verify-tkt-usage.mjs --pack PATH [--tkt PATH] [--tkt-prefix ARG] [--cache PATH]");
  return options;
}
function collectMarkdown(directory, out = []) {
  if (!existsSync(directory)) return out;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collectMarkdown(path, out);
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(path);
  }
  return out;
}
function collectUsage(pack) {
  const roots = ["skills", join(".kiro", "skills"), join(".claude", "skills")].map((path) => join(pack, path));
  const commands = new Map(), globalRequirements = new Map();
  const noteGlobal = (flag, file) => {
    if (!globalRequirements.has(flag)) globalRequirements.set(flag, new Set());
    globalRequirements.get(flag).add(file.slice(pack.length + 1));
  };
  for (const file of roots.flatMap((root) => collectMarkdown(root))) {
    const text = readFileSync(file, "utf8");
    let inFence = false;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
      for (const match of line.matchAll(/\bglobal\s+`?(--[a-z][a-z0-9-]*)/gi)) noteGlobal(match[1], file);
      const sources = [...line.matchAll(/`([^`]+)`/g)].flatMap((match) => match[1].split(/→/).map((value) => value.trim())).filter((value) => /^tkt(?:\.exe)?\s/i.test(value));
      if (inFence && /^\s*(?:[$>]\s*)?tkt(?:\.exe)?\s/i.test(line)) {
        let commandLine = line.trim().replace(/^(?:[$>]\s*)/, "");
        while (/\\\s*$/.test(commandLine) && index + 1 < lines.length) commandLine = `${commandLine.replace(/\\\s*$/, " ")}${lines[++index].trim()}`;
        sources.push(...commandLine.split(/→/).map((value) => value.trim()).filter((value) => /^tkt(?:\.exe)?\s/i.test(value)));
      }
      for (const source of sources) {
        const tokens = source.trim().replace(/[.,;:]$/, "").split(/\s+/).slice(1);
        let at = 0;
        while (tokens[at]?.startsWith("-")) {
          const flag = tokens[at++].split("=", 1)[0]; noteGlobal(flag, file);
          if (!tokens[at]?.startsWith("-") && tokens[at] !== undefined) at++;
        }
        const command = tokens[at]?.match(/^([a-z][a-z0-9-]*)$/i)?.[1];
        if (!command || ["version", "capabilities"].includes(command)) continue;
        const flags = tokens.slice(at + 1).map((token) => token.match(/^(--[a-z][a-z0-9-]*|-[a-z])(?:=.*)?$/i)?.[1]).filter(Boolean);
        const key = `${command}:${flags.sort().join(",")}`;
        if (!commands.has(key)) commands.set(key, { command, flags, sources: [] });
        commands.get(key).sources.push(file.slice(pack.length + 1));
      }
    }
  }
  return {
    commands: [...commands.values()].map((entry) => ({ ...entry, sources: [...new Set(entry.sources)].sort() })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    globalFlags: [...globalRequirements].map(([flag, sources]) => ({ flag, sources: [...sources].sort() })).sort((a, b) => a.flag.localeCompare(b.flag)),
  };
}
function resolveExecutable(name) {
  if (isAbsolute(name) || existsSync(name)) {
    const path = resolve(name);
    if (!existsSync(path)) throw new Error(`cannot resolve tkt executable: ${name}`);
    return path;
  }
  const locator = process.platform === "win32" ? "where.exe" : "which";
  const found = spawnSync(locator, [name], { encoding: "utf8", windowsHide: true });
  if (found.status !== 0) throw new Error(`cannot resolve tkt executable: ${name}`);
  const paths = found.stdout.split(/\r?\n/).filter(Boolean);
  const executable = paths.find((path) => extname(path).toLowerCase() === (process.platform === "win32" ? ".exe" : "")) ?? paths[0];
  if (!executable || extname(executable).toLowerCase() === ".cmd" || extname(executable).toLowerCase() === ".bat") throw new Error(`resolve tkt to its native executable, not a shell shim: ${paths.join(", ")}`);
  return resolve(executable);
}
function run(executable, prefix, args, cwd, env) {
  const result = spawnSync(executable, [...prefix, ...args], { cwd, env, encoding: "utf8", windowsHide: true, timeout: 15000 });
  if (result.error || result.signal || result.status === null) throw new Error(`tkt ${args.join(" ")} could not complete: ${result.error?.message ?? result.signal ?? "timeout"}`);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
function helpFlags(help) {
  const flags = new Set();
  for (const line of help.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:-[A-Za-z],\s*)?(--[A-Za-z][A-Za-z0-9-]*)/);
    if (match) flags.add(match[1]);
    const short = line.match(/^\s*(-[A-Za-z]),\s*(--[A-Za-z][A-Za-z0-9-]*)/);
    if (short) flags.add(short[1]);
  }
  return flags;
}
function packCommit(pack) {
  const result = spawnSync("git", ["-C", pack, "rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`pack is not a readable Git checkout: ${result.stderr.trim()}`);
  return result.stdout.trim();
}
function saveCache(path, record) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temporary, json(record), { flag: "wx" });
  renameSync(temporary, path);
}
export function verifyTktUsage({ pack, tkt = "tkt", prefix = [], cache = join(here, "..", ".scratch", "verify-tkt-usage-cache.json"), cwd = process.cwd(), env = process.env }) {
  pack = resolve(pack); cache = resolve(cache);
  const usage = collectUsage(pack);
  const executable = resolveExecutable(tkt), executableHash = hash(readFileSync(executable));
  const prefixIdentity = prefix.map((arg) => existsSync(arg) ? { path: resolve(arg), sha256: hash(readFileSync(arg)) } : arg);
  const versionResult = run(executable, prefix, ["--version"], cwd, env);
  if (versionResult.status !== 0) throw new Error(`tkt --version failed: ${versionResult.stderr.trim()}`);
  const version = versionResult.stdout.trim();
  const buildHash = version.match(/\(([0-9a-f]{7,40})\)/i)?.[1] ?? null;
  const capabilitiesResult = run(executable, prefix, ["capabilities", "-o", "json"], cwd, env);
  let capabilities = null;
  if (capabilitiesResult.status === 0) { try { capabilities = JSON.parse(capabilitiesResult.stdout); } catch {} }
  const identity = {
    auditorHash: hash(readFileSync(fileURLToPath(import.meta.url))),
    version, buildHash, executable, executableHash, prefix: prefixIdentity,
    packCommit: packCommit(pack), packRoot: pack,
    commands: usage, cwd,
    environmentHash: hash(Object.keys(env).sort().map((key) => `${key}=${env[key]}`).join("\n")),
    capabilitiesHash: capabilities ? hash(JSON.stringify(canonical(capabilities))) : null,
  };
  let previous = null;
  if (existsSync(cache)) { try { previous = JSON.parse(readFileSync(cache, "utf8")); } catch {} }
  if (previous && JSON.stringify(previous.identity) === JSON.stringify(identity)) return { ...previous.result, reused: true };

  const findings = [], helpCache = new Map();
  function getHelp(args) {
    const key = JSON.stringify(args);
    if (!helpCache.has(key)) {
      const result = run(executable, prefix, [...args, "--help"], cwd, env);
      helpCache.set(key, { result, flags: helpFlags(result.stdout) });
    }
    return helpCache.get(key);
  }
  if (usage.globalFlags.length) {
    const globalHelp = getHelp([]);
    if (globalHelp.result.status !== 0) throw new Error(`tkt --help failed: ${globalHelp.result.stderr.trim()}`);
    for (const { flag, sources } of usage.globalFlags) if (!globalHelp.flags.has(flag)) findings.push(`${sources.join(", ")}: global ${flag} is not supported by ${version}`);
  }
  const manifestCommands = capabilities?.commands ?? {};
  for (const command of [...new Set(usage.commands.map((entry) => entry.command))]) {
    const { result, flags } = getHelp([command]);
    if (!manifestCommands[command] && (result.status !== 0 || !/Usage:\s+tkt(?:\.exe)?\s+/i.test(result.stdout))) {
      const sources = usage.commands.filter((entry) => entry.command === command).flatMap((entry) => entry.sources);
      findings.push(`${[...new Set(sources)].join(", ")}: command ${command} is not supported by ${version}`); continue;
    }
    if (manifestCommands[command] && result.status !== 0) throw new Error(`tkt ${command} --help failed: ${result.stderr.trim()}`);
    const schemaFlags = new Set(Object.keys(manifestCommands[command]?.inputSchema?.properties ?? {}).map((flag) => `--${flag.replaceAll("_", "-")}`));
    for (const flag of new Set(usage.commands.filter((entry) => entry.command === command).flatMap((entry) => entry.flags))) {
      if (!flags.has(flag) && !schemaFlags.has(flag)) {
        const sources = usage.commands.filter((entry) => entry.command === command && entry.flags.includes(flag)).flatMap((entry) => entry.sources);
        findings.push(`${[...new Set(sources)].join(", ")}: ${command} ${flag} is not supported by ${version}`);
      }
    }
  }
  const result = { version, buildHash, executable, executableHash, packCommit: identity.packCommit, commandsChecked: usage.commands.length, findings, reused: false, capabilitiesAvailable: Boolean(capabilities) };
  saveCache(cache, { identity, result });
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = verifyTktUsage(parseArgs(process.argv.slice(2)));
    console.log(json(result));
    process.exitCode = result.findings.length ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
