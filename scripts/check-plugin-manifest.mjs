#!/usr/bin/env node
// check-plugin-manifest.mjs — the plugin-manifest pre-push check: the plugin manifests stay true to
// disk, to each other, and to the latest release tag (tickets 22, 64). The checks live in
// `deploy.mjs check --static` so every pack that vendors the deployer gets them; this runs it here.
//
// Read-only. Exit 0 = consistent, 1 = at least one problem (details on stderr).
// Run:  node scripts/check-plugin-manifest.mjs
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const deploy = join(root, "scripts", "deploy.mjs");
const r = spawnSync(process.execPath, [deploy, "check", "--static"], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

const problems = [];
const readJson = (path, label) => {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { problems.push(`${label} is missing or invalid: ${error.message}`); return null; }
};
const claude = readJson(join(root, ".claude-plugin", "plugin.json"), "Claude manifest");
const kimi = readJson(join(root, ".kimi-plugin", "kimi.plugin.json"), "Kimi manifest");
if (claude && kimi) {
  if (kimi.name !== claude.name || kimi.version !== claude.version) problems.push("Kimi and Claude plugin identities/versions differ");
  if (kimi.license !== claude.license) problems.push("Kimi and Claude plugin licenses differ");
  if (kimi.skills !== "./skills/") problems.push("Kimi skills must point at ./skills/");
  if (kimi.mcp || kimi.hooks) problems.push("Kimi package must remain skill-only with no MCP or hooks");
  const locale = readJson(join(root, ".kimi-plugin", "locales", "zh-CN.json"), "Kimi zh-CN locale");
  if (locale) {
    for (const key of ["displayName", "shortDescription", "longDescription", "developerName", "tryPrompts"]) {
      if (!locale[key] || !kimi.interface?.[key]) problems.push(`Kimi interface/locale is missing ${key}`);
    }
  }
}
const kimiIcon = join(root, ".kimi-plugin", "icon.png");
const claudeIcon = join(root, ".claude-plugin", "icon.png");
if (!existsSync(kimiIcon) || !existsSync(claudeIcon)) problems.push("Kimi and Claude catalog icons must both exist");
else if (!readFileSync(kimiIcon).equals(readFileSync(claudeIcon))) problems.push("Kimi and Claude catalog icons differ");
if (problems.length) {
  console.error(`Kimi plugin-manifest check FAILED (${problems.length}):`);
  for (const problem of problems) console.error("  - " + problem);
  process.exit(1);
}
console.log(`Kimi plugin-manifest check OK: ${kimi.name} v${kimi.version}.`);
