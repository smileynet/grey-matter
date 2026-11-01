#!/usr/bin/env node
// Validate a project's "## Provider fallback" section (docs/agents/provider-switching.md) and
// print the policy an agent should apply. An absent section is valid and means no opt-in; a
// present section must be well formed, so a typo can never read as permission.
// Usage: node scripts/check-provider-fallback.mjs [AGENTS.md] [--json]
// Exit codes: 0 = valid (policy printed), 1 = invalid section, 2 = unreadable file.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PROVIDERS = ["anthropic", "openai", "amazon", "google"];
export const TASK_CLASSES = ["orchestration", "implementation", "review", "research", "docs", "triage"];
const FIELDS = {
  allowed: "Allowed",
  providers: "Providers, in order",
  tasks: "Task classes",
  notFor: "Not for",
  announce: "Announce",
};

const list = (v) => (v.trim().toLowerCase() === "none" ? [] : v.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));

export function parse(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const starts = lines.flatMap((l, i) => (/^##\s+Provider fallback\s*$/i.test(l) ? [i] : []));
  if (starts.length === 0) return { present: false, errors: [], policy: { allowed: false, reason: "no Provider fallback section" } };
  const errors = [];
  if (starts.length > 1) errors.push(`found ${starts.length} "## Provider fallback" sections; keep exactly one`);
  const body = [];
  for (let i = starts[0] + 1; i < lines.length && !/^#{1,2}\s/.test(lines[i]); i++) body.push(lines[i]);
  const values = {};
  for (const line of body) {
    const m = line.match(/^\s*[-*]\s+\*\*(.+?):\*\*\s*(.*?)\s*$/);
    if (!m) continue;
    const key = Object.keys(FIELDS).find((k) => FIELDS[k].toLowerCase() === m[1].trim().toLowerCase());
    if (!key) { errors.push(`unknown field "${m[1]}" (expected: ${Object.values(FIELDS).join(", ")})`); continue; }
    if (key in values) { errors.push(`field "${FIELDS[key]}" appears twice`); continue; }
    values[key] = m[2];
  }
  for (const [k, label] of Object.entries(FIELDS)) if (!(k in values)) errors.push(`missing field "${label}"`);
  const yesNo = (k) => {
    if (!(k in values)) return null;
    const v = values[k].trim().toLowerCase();
    if (v !== "yes" && v !== "no") { errors.push(`"${FIELDS[k]}" must be yes or no, got "${values[k]}"`); return null; }
    return v === "yes";
  };
  const allowed = yesNo("allowed"), announce = yesNo("announce");
  const providers = "providers" in values ? list(values.providers) : [];
  const tasks = "tasks" in values ? list(values.tasks) : [];
  const notFor = "notFor" in values ? list(values.notFor) : [];
  for (const p of providers) if (!PROVIDERS.includes(p)) errors.push(`unknown provider "${p}" (expected: ${PROVIDERS.join(", ")})`);
  for (const t of tasks) if (!TASK_CLASSES.includes(t)) errors.push(`unknown task class "${t}" (expected: ${TASK_CLASSES.join(", ")})`);
  if (new Set(providers).size !== providers.length) errors.push("a provider is listed twice");
  if (allowed === true) {
    if (!providers.length) errors.push('"Allowed: yes" needs at least one provider');
    if (!tasks.length) errors.push('"Allowed: yes" needs at least one task class');
  }
  if (allowed === false && (providers.length || tasks.length)) errors.push('"Allowed: no" must list "none" for providers and task classes, so the off state is unambiguous');
  const policy = errors.length || !allowed
    ? { allowed: false, reason: errors.length ? "invalid section: treated as no opt-in" : "Allowed: no" }
    : { allowed: true, providers, tasks, notFor, announce };
  return { present: true, errors, policy };
}

export function main(argv = process.argv.slice(2), log = console.log) {
  const json = argv.includes("--json");
  const file = resolve(argv.find((a) => a !== "--json") ?? "AGENTS.md");
  let text;
  try { text = readFileSync(file, "utf8"); } catch (e) { log(`error: cannot read ${file}: ${e.message}`); return 2; }
  const result = parse(text);
  if (json) log(JSON.stringify({ file, ...result }, null, 2));
  else {
    for (const e of result.errors) log(`invalid: ${e}`);
    const p = result.policy;
    log(p.allowed
      ? `provider fallback: allowed to ${p.providers.join(" > ")} for ${p.tasks.join(", ")}; never for ${p.notFor.join(", ") || "(nothing listed)"}; announce ${p.announce ? "yes" : "no"}`
      : `provider fallback: not allowed (${p.reason})`);
  }
  return result.errors.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
