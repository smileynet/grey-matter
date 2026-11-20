// Confirms every skill path in .kiro-crew/app.json resolves to a SKILL.md and the version matches plugin.json.
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dir = join(root, ".kiro-crew");
const app = JSON.parse(readFileSync(join(dir, "app.json"), "utf8"));
const plugin = JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"));
const errors = [];
for (const p of app.skills) if (!existsSync(join(dir, p, "SKILL.md"))) errors.push(`missing skill: ${p}`);
if (new Set(app.skills).size !== app.skills.length) errors.push("duplicate skill path");
if (!app.skills.some((p) => p.endsWith(`/${app.startWith}`))) errors.push(`startWith ${app.startWith} not listed`);
if (app.version !== plugin.version) errors.push(`version ${app.version} != plugin ${plugin.version}`);
if (app.defaultEnabled !== false) errors.push("defaultEnabled must be false");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`crew-app: ${app.skills.length} skills ok`);
