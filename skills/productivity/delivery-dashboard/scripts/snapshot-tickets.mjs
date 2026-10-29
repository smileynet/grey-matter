#!/usr/bin/env node
// snapshot-tickets.mjs: refresh a dashboard's gm-tickets block from the tkt board.
// Usage: node snapshot-tickets.mjs <dashboard.html> [--repo DIR]
// Rewrites only the gm-tickets block; every other byte of the file is kept. The repo
// defaults to the Git checkout holding the dashboard.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const BLOCK = /(<script type="application\/json" id="gm-tickets">)[\s\S]*?(<\/script>)/;
const FIELDS = ["id", "title", "status", "priority", "blocked_by", "tags"];

const lines = (text) => text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));

export function snapshot(file, { repo, run = execFileSync, now = new Date() } = {}) {
  const html = readFileSync(file, "utf8");
  if (!BLOCK.test(html)) throw new Error(`no gm-tickets block in ${file}; copy it from the template`);
  const cwd = repo || run("git", ["-C", dirname(resolve(file)), "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  // tkt filters query and ready by tag context; a scoped snapshot would silently drop tickets.
  const context = process.env.TKT_CONTEXT || (existsSync(join(cwd, ".tickets/.context")) && readFileSync(join(cwd, ".tickets/.context"), "utf8").trim());
  if (context) throw new Error(`tkt tag context "${context}" is set; clear it (tkt context --clear, unset TKT_CONTEXT) so the Plan tab shows every ticket`);
  const tkt = (args) => run("tkt", args, { cwd, encoding: "utf8", env: { ...process.env, TKT_ADVICE: "0" } });
  const tickets = lines(tkt(["query", "-o", "json"])).map((t) => Object.fromEntries(FIELDS.filter((k) => t[k] !== undefined).map((k) => [k, t[k]])));
  const frontier = lines(tkt(["ready", "-o", "json"])).map((t) => t.id);
  const data = { generated: now.toISOString(), frontier, tickets };
  // Ticket titles are outside text: escape "<" so a title cannot close the script element.
  writeFileSync(file, html.replace(BLOCK, (_, open, close) => `${open}\n${JSON.stringify(data).replace(/</g, "\\u003c")}\n${close}`));
  return { tickets: tickets.length, frontier: frontier.length };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const args = process.argv.slice(2);
  const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--repo");
  const repoAt = args.indexOf("--repo");
  if (!file || !existsSync(file)) { console.error("usage: snapshot-tickets.mjs <dashboard.html> [--repo DIR]"); process.exit(2); }
  try { console.log(JSON.stringify(snapshot(file, { repo: repoAt >= 0 ? resolve(args[repoAt + 1]) : undefined }))); }
  catch (e) { console.error(e.message); process.exit(1); }
}
