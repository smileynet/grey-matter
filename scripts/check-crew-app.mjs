// Stages the Kiro Crew app with `deploy.mjs kirocrew build` and checks the staged layout:
// every listed skill path exists inside the app folder, every staged skill is listed, startWith
// is listed, and the version matches plugin.json.
import { readFileSync, existsSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const out = join(root, ".scratch", "crew-app-check");
const plugin = JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"));
const errors = [];
rmSync(out, { recursive: true, force: true });
mkdirSync(join(root, ".scratch"), { recursive: true });
const build = spawnSync(process.execPath, [join(root, "scripts", "deploy.mjs"), "kirocrew", "build", "--out", out, "--pack", root], { encoding: "utf8" });
if (build.status !== 0) { console.error(`staging failed:\n${build.stdout}${build.stderr}`); process.exit(1); }
const app = JSON.parse(readFileSync(join(out, "app.json"), "utf8"));
for (const p of app.skills) {
  if (p.startsWith("..") || p.startsWith("/")) errors.push(`path leaves the app folder: ${p}`);
  else if (!existsSync(join(out, p, "SKILL.md"))) errors.push(`missing skill: ${p}`);
}
if (new Set(app.skills).size !== app.skills.length) errors.push("duplicate skill path");
const staged = readdirSync(join(out, "skills")).map((n) => `skills/${n}`);
for (const p of staged) if (!app.skills.includes(p)) errors.push(`staged skill not listed in app.json: ${p}`);
if (!app.skills.includes(`skills/${app.startWith}`)) errors.push(`startWith ${app.startWith} not listed`);
if (app.version !== plugin.version) errors.push(`version ${app.version} != plugin ${plugin.version}`);
if (app.defaultEnabled !== false) errors.push("defaultEnabled must be false");
rmSync(out, { recursive: true, force: true });
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`crew-app: ${app.skills.length} staged skills ok`);
