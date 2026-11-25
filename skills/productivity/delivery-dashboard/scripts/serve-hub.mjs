#!/usr/bin/env node
// Multi-project read-only LAN/Tailscale dashboard hub.
// Scans one or more parent directories (depth 1) or an explicit JSON registry for
// <project>/docs/status.html, renders a dark-mode hub index at `/`, and serves
// each project's dashboard plus ONLY its allowlisted relative linked assets at
// `/<slug>/docs/status.html`. Never serves .git, .env, .scratch, .references, or
// unlinked repository files.
//
// Usage:
//   node serve-hub.mjs [--root DIR]... [--registry FILE] [--host 127.0.0.1] [--port 8765]

import { createServer } from "node:http";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const FORBIDDEN_PARTS = new Set([".git", ".scratch", ".references", ".env"]);
const SLUG_RE = /^[a-zA-Z0-9._-]+$/;

function isAllowedPath(root, file) {
  const rel = relative(root, file);
  if (!rel || isAbsolute(rel) || rel === ".." || rel.startsWith("../") || rel.startsWith("..\\")) return false;
  return !rel.split(/[\\/]/).some((part) => FORBIDDEN_PARTS.has(part.toLowerCase()) || part.toLowerCase().startsWith(".env."));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
}

function parseDashboardBlocks(html) {
  const blocks = { config: {}, entries: [], tickets: { tickets: [] } };
  for (const [id, key] of [["gm-config", "config"], ["gm-entries", "entries"], ["gm-tickets", "tickets"]]) {
    const match = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`));
    if (!match) continue;
    try { blocks[key] = JSON.parse(match[1]); } catch { /* malformed block degrades cleanly */ }
  }
  return blocks;
}

export function linkedFiles(html, root) {
  const dashboard = resolve(root, "docs/status.html");
  const files = new Map([["/docs/status.html", dashboard]]);
  function visit(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (["href", "src"].includes(key) && typeof child === "string" && child && !child.startsWith("#") && !child.startsWith("/") && !/^[a-z][a-z0-9+.-]*:/i.test(child)) {
        try {
          const url = new URL(child, "http://dashboard.invalid/docs/status.html");
          const file = fileURLToPath(new URL(child, pathToFileURL(dashboard)));
          if (isAllowedPath(root, file)) files.set(url.pathname, file);
        } catch { /* ignore malformed relative URL */ }
      }
      visit(child);
    }
  }
  const { config, entries, tickets } = parseDashboardBlocks(html);
  visit(config); visit(entries); visit(tickets);
  return files;
}

function summarizeProject(slug, html) {
  const { config, entries, tickets } = parseDashboardBlocks(html);
  const decisions = Array.isArray(config?.decisions) ? config.decisions : [];
  const openDecisions = decisions.filter((d) => d && d.status !== "answered");
  const listEntries = Array.isArray(entries) ? entries : [];
  const openAsks = listEntries.flatMap((e) => Array.isArray(e?.asks) ? e.asks : []).filter((a) => a && a.status !== "answered");
  const ticketList = Array.isArray(tickets?.tickets) ? tickets.tickets : [];
  const doneIds = new Set(ticketList.filter((t) => t.status === "done").map((t) => t.id));
  const inProgress = ticketList.filter((t) => t.status === "in_progress").length;
  const ready = ticketList.filter((t) => t.status === "open" && (t.blocked_by ?? []).every((b) => doneIds.has(b))).length;
  const latest = listEntries[0] ?? null;
  return {
    slug,
    name: config?.project || slug,
    url: `/${encodeURIComponent(slug)}/docs/status.html`,
    updated: latest?.date ?? null,
    latestTitle: latest?.title ?? null,
    openDecisions: openDecisions.length,
    openDecisionItems: openDecisions.map((d) => ({ id: d.id, question: d.question })),
    answeredDecisions: decisions.length - openDecisions.length,
    openAsks: openAsks.length,
    inProgress,
    ready,
    totalTickets: ticketList.length,
  };
}

export async function discoverProjects({ roots = [], registry = null } = {}) {
  const found = new Map();
  const addCandidate = async (slug, dir) => {
    if (!SLUG_RE.test(slug)) return;
    const abs = resolve(dir);
    const dash = join(abs, "docs", "status.html");
    try {
      const st = await stat(dash);
      if (st.isFile() && !found.has(slug)) found.set(slug, { slug, root: abs, dashboard: dash });
    } catch { /* no dashboard */ }
  };

  if (registry) {
    try {
      const raw = JSON.parse(await readFile(resolve(registry), "utf8"));
      const entries = Array.isArray(raw?.projects) ? raw.projects : Array.isArray(raw) ? raw : [];
      for (const item of entries) {
        if (typeof item === "string") await addCandidate(basename(resolve(item)), item);
        else if (item?.path) await addCandidate(item.slug || basename(resolve(item.path)), item.path);
      }
    } catch { /* missing/unreadable registry degrades to roots */ }
  }

  for (const parent of roots) {
    let entries;
    try { entries = await readdir(resolve(parent), { withFileTypes: true }); }
    catch { continue; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      await addCandidate(entry.name, join(resolve(parent), entry.name));
    }
  }
  return found;
}

function renderHubHtml(summaries) {
  const needsYou = summaries.flatMap((p) => p.openDecisionItems.map((d) => ({ project: p.name, slug: p.slug, id: d.id, question: d.question })));
  const needsBanner = needsYou.length
    ? `<section class="needs"><h2>Open decisions across projects (${needsYou.length})</h2><ul>${needsYou.map((item) => `<li><a href="/${encodeURIComponent(item.slug)}/docs/status.html#decision-${encodeURIComponent(item.id)}"><b>${escapeHtml(item.project)}</b>: ${escapeHtml(item.question)}</a></li>`).join("")}</ul></section>`
    : `<section class="none">No pending decisions across discovered projects.</section>`;

  const cards = summaries.length
    ? summaries.map((p) => {
        const base = `/${encodeURIComponent(p.slug)}/docs/status.html`;
        const badges = [
          p.openDecisions ? `<span class="chip ask">${p.openDecisions} open decision${p.openDecisions === 1 ? "" : "s"}</span>` : "",
          p.openAsks ? `<span class="chip ask">${p.openAsks} ask${p.openAsks === 1 ? "" : "s"}</span>` : "",
          `<span class="chip wip">${p.inProgress} in progress</span>`,
          `<span class="chip ready">${p.ready} ready</span>`,
          `<span class="chip">${p.totalTickets} tickets</span>`,
        ].filter(Boolean).join("");
        const sub = p.updated ? `Updated ${escapeHtml(p.updated)}${p.latestTitle ? ` · ${escapeHtml(p.latestTitle)}` : ""}` : "No delivery entries yet";
        return `<article class="card${p.openDecisions || p.openAsks ? " attention" : ""}">
  <div class="head"><h3><a href="${base}">${escapeHtml(p.name)}</a></h3><span class="slug">${escapeHtml(p.slug)}</span></div>
  <p class="sub">${sub}</p>
  <div class="chips">${badges}</div>
  <nav class="links">
    <a class="btn primary" href="${base}#decisions">Decisions${p.openDecisions ? ` (${p.openDecisions})` : ""}</a>
    <a class="btn" href="${base}#overview">Overview</a>
    <a class="btn" href="${base}#plan">Plan</a>
  </nav>
</article>`;
      }).join("\n")
    : `<p class="none">No projects with <code>docs/status.html</code> found in the configured roots.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Project Dashboards</title>
<style>
:root{color-scheme:dark;--bg:#0a1120;--panel:#111b2f;--panel2:#162540;--line:#27395a;--text:#e8eef9;--muted:#a3b3cf;--blue:#6aaeff;--blue2:#3b82e0;--cyan:#56d4f0;--ask:#ffc857;--ok:#7fe0b0;--r:14px}
*{box-sizing:border-box}html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:0 clamp(16px,4vw,40px) 64px}
a{color:var(--blue);text-decoration:none}a:hover{color:var(--cyan);text-decoration:underline}
.wrap{max-width:980px;margin:0 auto}header{padding:28px 0 18px}
.eyebrow{color:var(--muted);font-size:13px;letter-spacing:.06em;text-transform:uppercase}
h1{margin:4px 0;font-size:clamp(26px,4vw,34px);line-height:1.2}
h2{font-size:13px;margin:0 0 10px;color:var(--ask);letter-spacing:.07em;text-transform:uppercase}
.needs{border:1px solid var(--ask);background:#1b1a14;border-radius:var(--r);padding:16px 20px;margin:0 0 22px}
.needs ul{margin:0;padding-left:20px}.needs li{margin:4px 0}
.grid{display:grid;gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px}
.card.attention{border-color:var(--ask);background:linear-gradient(180deg,var(--panel2),var(--panel))}
.head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.card h3{margin:0;font-size:21px}.slug{color:var(--muted);font-size:13px;font-family:ui-monospace,monospace}
.sub{color:var(--muted);font-size:14px;margin:6px 0 12px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.chip{border:1px solid var(--line);border-radius:99px;padding:2px 10px;font-size:12.5px;background:#0e1830}
.chip.ask{border-color:var(--ask);color:var(--ask)}.chip.wip{border-color:var(--cyan);color:var(--cyan)}.chip.ready{border-color:var(--ok);color:var(--ok)}
.links{display:flex;flex-wrap:wrap;gap:8px}
.btn{display:inline-flex;align-items:center;min-height:40px;padding:6px 14px;border-radius:10px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:500}
.btn:hover{border-color:var(--blue);text-decoration:none}
.btn.primary{background:var(--blue2);border-color:var(--blue2);color:#fff}
.btn.primary:hover{background:#2f6fc7}
.none{color:var(--muted);border:1px dashed var(--line);border-radius:var(--r);padding:14px 18px;margin:0 0 20px}
</style>
</head>
<body>
<div class="wrap">
<header>
  <div class="eyebrow">grey-matter dashboard hub</div>
  <h1>Project Dashboards</h1>
</header>
${needsBanner}
<main class="grid">
${cards}
</main>
</div>
</body>
</html>
`;
}

export function createHubServer(options = {}) {
  const roots = (options.roots?.length ? options.roots : [join(homedir(), "code")]).map((r) => resolve(r));
  const registry = options.registry ? resolve(options.registry) : null;

  return createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://hub.invalid").pathname); }
    catch { res.writeHead(400); res.end("Invalid URL"); return; }

    const projects = await discoverProjects({ roots, registry });

    if (pathname === "/" || pathname === "/index.html" || pathname === "/api/projects.json") {
      const summaries = [];
      for (const proj of projects.values()) {
        try {
          const html = await readFile(proj.dashboard, "utf8");
          summaries.push(summarizeProject(proj.slug, html));
        } catch { /* skip unreadable */ }
      }
      summaries.sort((a, b) => (b.openDecisions - a.openDecisions) || (b.openAsks - a.openAsks) || (b.inProgress - a.inProgress) || a.slug.localeCompare(b.slug));
      const body = pathname === "/api/projects.json"
        ? Buffer.from(JSON.stringify({ projects: summaries }, null, 2) + "\n")
        : Buffer.from(renderHubHtml(summaries));
      const contentType = pathname === "/api/projects.json" ? MIME[".json"] : MIME[".html"];
      res.writeHead(200, { "Content-Type": contentType, "Content-Length": body.length });
      res.end(req.method === "HEAD" ? undefined : body);
      return;
    }

    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[0];
    const proj = slug && projects.get(slug);
    if (!proj) { res.writeHead(404); res.end("Not found"); return; }

    const subPath = "/" + parts.slice(1).join("/");
    if (subPath === "/" || subPath === "/status.html") {
      res.writeHead(302, { Location: `/${encodeURIComponent(slug)}/docs/status.html` });
      res.end();
      return;
    }

    try {
      const html = await readFile(proj.dashboard, "utf8");
      const target = linkedFiles(html, proj.root).get(subPath);
      if (!target) { res.writeHead(404); res.end("Not found"); return; }
      const [realRoot, realTarget] = await Promise.all([realpath(proj.root), realpath(target)]);
      if (!isAllowedPath(realRoot, realTarget)) { res.writeHead(404); res.end("Not found"); return; }
      const body = await readFile(realTarget);
      const contentType = MIME[extname(realTarget).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType, "Content-Length": body.length });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (error) {
      const missing = ["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code);
      res.writeHead(missing ? 404 : 500);
      res.end(missing ? "Not found" : "Cannot read dashboard");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      root: { type: "string", multiple: true },
      registry: { type: "string" },
      host: { type: "string", default: "127.0.0.1" },
      port: { type: "string", default: "8765" },
    },
  });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("--port must be an integer from 1 to 65535");
    process.exit(2);
  }
  const server = createHubServer({ roots: values.root, registry: values.registry });
  server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, values.host, () => {
    console.log(`Dashboard hub: http://${values.host}:${port}/`);
  });
}
