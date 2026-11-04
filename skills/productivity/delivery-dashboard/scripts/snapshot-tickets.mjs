#!/usr/bin/env node
// snapshot-tickets.mjs: refresh a dashboard's gm-tickets block from the tkt board.
// Usage: node snapshot-tickets.mjs <dashboard.html> [--repo DIR]
// Rewrites only the gm-tickets block; every other byte of the file is kept. The repo
// defaults to the Git checkout holding the dashboard.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BLOCK = /(<script type="application\/json" id="gm-tickets">)[\s\S]*?(<\/script>)/;
const FIELDS = ["id", "title", "status", "priority", "blocked_by", "tags", "gate", "assignee", "body_id"];

const lines = (text) => text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));

function metadataById(repo, run = execFileSync) {
  const dir = join(repo, ".tickets"), result = new Map();
  if (!existsSync(dir)) return result;
  const records = [];
  // Ticket source is also needed for current byte identity and the older CLI tag fallback.
  for (const name of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
    // README.md is repository guidance; every other Markdown file here must be a ticket.
    if (name.toLowerCase() === "readme.md") continue;
    const source = readFileSync(join(dir, name), "utf8");
    const header = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!header) throw new Error(`ticket file ${name} is missing YAML frontmatter`);
    const id = header[1].match(/^id:\s*(.+)$/m), field = header[1].match(/^tags:([^\n]*(?:\n[ \t]+[^\n]*)*)/m);
    if (!id) throw new Error(`ticket file ${name} has no id in YAML frontmatter`);
    const value = (field?.[1] || "").trim(), unquote = (text) => text.trim().replace(/^["']+|["']+$/g, "");
    const ticketId = unquote(id[1]);
    if (!ticketId) throw new Error(`ticket file ${name} has an empty id`);
    const tags = value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1).split(",").map(unquote).filter(Boolean) : value.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("-")).map((line) => unquote(line.slice(1))).filter(Boolean);
    const gates = tags.filter((tag) => tag === "gate:decision" || tag === "gate:evidence");
    if (gates.length > 1) throw new Error(`conflicting planning gates in ${name}`);
    const note = source.slice(header[0].length).match(/(?:^|\n)## Planning gate\r?\n([\s\S]*?)(?=\n## |$)/);
    const reason = note?.[1].trim();
    if (gates.length && !reason) throw new Error(`planning gate in ${name} needs a ## Planning gate explanation`);
    if (result.has(ticketId)) throw new Error(`duplicate ticket id ${ticketId} in .tickets`);
    records.push({ name, id: ticketId, tags, ...(gates.length ? { gate: { kind: gates[0].slice(5), reason } } : {}) });
  }
  const hashes = hashFiles(repo, records, run);
  records.forEach(({ name, id, ...metadata }) => result.set(id, { ...metadata, body_id: hashes.get(name) }));
  return result;
}

function runGitHash(repo, source, run = execFileSync) {
  return run("git", ["-C", repo, "hash-object", "--stdin"], { encoding: "utf8", input: source }).trim();
}

function hashFiles(repo, records, run) {
  if (!records.length) return new Map();
  // Git's batch input is newline-delimited; keep legal newline names unambiguous.
  const batch = records.filter(({ name }) => !/[\r\n]/.test(name));
  const hashes = new Map();
  if (batch.length) {
    const paths = batch.map(({ name }) => join(".tickets", name));
    const output = run("git", ["-C", repo, "hash-object", "--stdin-paths", "--no-filters"], {
      encoding: "utf8",
      input: `${paths.join("\n")}\n`,
    }).trim().split(/\r?\n/);
    if (output.length !== batch.length || output.some((hash) => !/^[a-f0-9]{40,64}$/.test(hash))) throw new Error("Git returned an invalid ticket body identity batch");
    batch.forEach(({ name }, i) => hashes.set(name, output[i]));
  }
  for (const { name } of records.filter(({ name }) => /[\r\n]/.test(name))) {
    hashes.set(name, runGitHash(repo, readFileSync(join(repo, ".tickets", name), "utf8"), run));
  }
  return hashes;
}

export function authoritativeProjection(repo, run = execFileSync) {
  const context = process.env.TKT_CONTEXT || (existsSync(join(repo, ".tickets/.context")) && readFileSync(join(repo, ".tickets/.context"), "utf8").trim());
  if (context) throw new Error(`tkt tag context "${context}" is set; clear it (tkt context --clear, unset TKT_CONTEXT) so the Plan tab shows every ticket`);
  const tkt = (args) => run("tkt", args, { cwd: repo, encoding: "utf8", env: { ...process.env, TKT_ADVICE: "0" } });
  const metadata = metadataById(repo, run);
  const queried = lines(tkt(["query", "--all-context", "-o", "json"]));
  if (new Set(queried.map((ticket) => ticket.id)).size !== queried.length) throw new Error("tkt query returned duplicate ticket ids");
  const tickets = queried.map((ticket) => {
    const source = metadata.get(ticket.id);
    if (!source) throw new Error(`ticket ${ticket.id} is missing from .tickets; cannot compare the complete board`);
    return Object.fromEntries(FIELDS.filter((key) => key === "body_id" ? source.body_id !== undefined : ticket[key] !== undefined || source[key] !== undefined)
      .map((key) => [key, key === "body_id" ? source.body_id : ticket[key] ?? source[key]]));
  });
  if (tickets.length !== metadata.size || tickets.some((ticket) => !metadata.has(ticket.id))) throw new Error("tkt query and .tickets files do not contain the same complete board");
  const frontier = lines(tkt(["ready", "-o", "json"])).map((ticket) => ticket.id);
  return { tickets, frontier, executionOrder: authoredExecutionOrder(repo) };
}

export function authoredExecutionOrder(repo) {
  const planPath = join(repo, "docs", "plan.md");
  if (!existsSync(planPath)) return [];
  const plan = readFileSync(planPath, "utf8");
  const ids = [];
  const seen = new Set();
  let inTicketTable = false;
  for (const line of plan.split(/\r?\n/)) {
    if (/^\|\s*ID\s*\|\s*Work\s*\|\s*Status\s*\|\s*$/i.test(line)) { inTicketTable = true; continue; }
    if (!inTicketTable) continue;
    if (/^\|\s*:?-{3,}\s*\|/.test(line)) continue;
    const match = line.match(/^\|\s*([^|]+?)\s*\|/);
    if (!match) { inTicketTable = false; continue; }
    const id = match[1].trim();
    if (id && !seen.has(id)) { seen.add(id); ids.push(id); }
  }
  return ids;
}

export function snapshot(file, { repo, run = execFileSync, now = new Date() } = {}) {
  const html = readFileSync(file, "utf8");
  if (!BLOCK.test(html)) throw new Error(`no gm-tickets block in ${file}; copy it from the template`);
  const cwd = repo || run("git", ["-C", dirname(resolve(file)), "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  // tkt filters query and ready by tag context; a scoped snapshot would silently drop tickets.
  const { tickets, frontier } = authoritativeProjection(cwd, run);
  const data = { generated: now.toISOString(), frontier, tickets };
  // Ticket titles are outside text: escape "<" so a title cannot close the script element.
  writeFileSync(file, html.replace(BLOCK, (_, open, close) => `${open}\n${JSON.stringify(data).replace(/</g, "\\u003c")}\n${close}`));
  return { tickets: tickets.length, frontier: frontier.length };
}

// fileURLToPath, not URL.pathname: on Windows the pathname is /D:/..., so the CLI never ran.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--repo");
  const repoAt = args.indexOf("--repo");
  if (!file || !existsSync(file)) { console.error("usage: snapshot-tickets.mjs <dashboard.html> [--repo DIR]"); process.exit(2); }
  try { console.log(JSON.stringify(snapshot(file, { repo: repoAt >= 0 ? resolve(args[repoAt + 1]) : undefined }))); }
  catch (e) { console.error(e.message); process.exit(1); }
}
