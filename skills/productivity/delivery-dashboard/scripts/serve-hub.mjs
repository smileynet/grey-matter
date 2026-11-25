#!/usr/bin/env node
// Multi-project read-only LAN/Tailscale dashboard hub.
// Scans one or more parent directories (depth 1) or an explicit JSON registry for
// <project>/docs/status.html, renders a dark-mode hub index at `/`, and serves
// each project's dashboard plus ONLY its allowlisted relative linked assets at
// `/<slug>/docs/status.html`. Never serves .git, .env, .scratch, .references, or
// unlinked repository files.
//
// Usage:
//   node serve-hub.mjs [--root DIR]... [--registry FILE] [--host 127.0.0.1] [--port 8765] [--config FILE]
//   node serve-hub.mjs --url DIR_OR_SLUG [--hash decisions|overview|plan] [--config FILE]
//   node serve-hub.mjs --inbox [DIR_OR_SLUG] [--clear] [--config FILE]
//   node serve-hub.mjs --wait DIR_OR_SLUG [--timeout SECONDS] [--config FILE]

import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync, watch } from "node:fs";
import { mkdir, readdir, readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const MAX_INBOX_BYTES = 32 * 1024;
const MAX_TEXT_CHARS = 24000;

export function defaultInboxDir() {
  return join(homedir(), ".local", "state", "grey-matter", "inbox");
}

export function isLoopbackAddress(addr) {
  return addr === "127.0.0.1" || addr === "::1" || addr === "::ffff:127.0.0.1";
}

export function evaluateTailscaleAuth(req, inboxConfig = {}) {
  const remoteLoopback = isLoopbackAddress(req.socket?.remoteAddress);
  const login = typeof req.headers?.["tailscale-user-login"] === "string" ? req.headers["tailscale-user-login"].trim() : "";
  const name = typeof req.headers?.["tailscale-user-name"] === "string" ? req.headers["tailscale-user-name"].trim() : "";
  const forwardedProto = typeof req.headers?.["x-forwarded-proto"] === "string" ? req.headers["x-forwarded-proto"].trim().toLowerCase() : "";
  const allowedUsers = Array.isArray(inboxConfig?.allowedUsers)
    ? inboxConfig.allowedUsers.map((u) => String(u).trim().toLowerCase()).filter(Boolean)
    : [];
  const viaTailscale = remoteLoopback && Boolean(login);
  const userAllowed = viaTailscale && (allowedUsers.length === 0 || allowedUsers.includes(login.toLowerCase()));
  return { remoteLoopback, viaTailscale, userAllowed, login, name, forwardedProto };
}

export function isAllowedOrigin(req, expectedOrigin = "") {
  const fetchSite = typeof req.headers?.["sec-fetch-site"] === "string" ? req.headers["sec-fetch-site"].trim().toLowerCase() : "";
  if (fetchSite === "cross-site") return false;
  const origin = typeof req.headers?.origin === "string" ? req.headers.origin.trim() : "";
  if (!origin) return false;
  if (expectedOrigin) return origin === expectedOrigin;
  const host = typeof req.headers?.host === "string" ? req.headers.host.trim() : "";
  return Boolean(host) && (origin === `https://${host}` || origin === `http://${host}`);
}

async function readLimitedJson(req, maxBytes = MAX_INBOX_BYTES) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error("Payload too large");
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const err = new Error("Invalid JSON body");
    err.statusCode = 400;
    throw err;
  }
}

function yamlStr(value) {
  return JSON.stringify(String(value ?? "").replace(/[\r\n]+/g, " ").trim());
}

export async function saveInboxSubmission({ inboxDir, slug, project, text, submittedBy, submittedName = "" }) {
  const dir = join(resolve(inboxDir), slug);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const now = new Date();
  const savedAt = now.toISOString();
  const stamp = savedAt.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const id = `${stamp}-${randomBytes(3).toString("hex")}`;
  const content = [
    "---",
    `id: ${yamlStr(id)}`,
    `slug: ${yamlStr(slug)}`,
    `project: ${yamlStr(project || slug)}`,
    `submitted_at: ${yamlStr(savedAt)}`,
    `submitted_by: ${yamlStr(submittedBy)}`,
    ...(submittedName ? [`submitted_name: ${yamlStr(submittedName)}`] : []),
    `source: "tailscale-serve"`,
    "---",
    "",
    String(text).trim(),
    "",
  ].join("\n");
  const writeAtomic = async (file) => {
    const tmp = `${file}.${process.pid}.${randomBytes(3).toString("hex")}.tmp`;
    await writeFile(tmp, content, { encoding: "utf8", mode: 0o600 });
    await rename(tmp, file);
  };
  await writeAtomic(join(dir, `${id}.md`));
  await writeAtomic(join(dir, "latest.md"));
  return { ok: true, id, slug, savedAt };
}

export async function readInbox({ inboxDir, slug = null }) {
  const base = resolve(inboxDir);
  const slugs = [];
  if (slug) {
    if (!SLUG_RE.test(slug)) return { projects: [] };
    slugs.push(slug);
  } else {
    try {
      const entries = await readdir(base, { withFileTypes: true });
      for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (e.isDirectory() && SLUG_RE.test(e.name)) slugs.push(e.name);
      }
    } catch { return { projects: [] }; }
  }
  const projects = [];
  for (const s of slugs) {
    const dir = join(base, s);
    let files;
    try { files = await readdir(dir, { withFileTypes: true }); }
    catch { continue; }
    const pending = files
      .filter((f) => f.isFile() && f.name.endsWith(".md") && f.name !== "latest.md")
      .map((f) => f.name)
      .sort()
      .reverse();
    const items = [];
    for (const name of pending) {
      try {
        items.push({ id: name.replace(/\.md$/, ""), content: await readFile(join(dir, name), "utf8") });
      } catch { /* skip unreadable */ }
    }
    if (items.length || slug) projects.push({ slug: s, pendingCount: items.length, items });
  }
  return { projects };
}

export function resolveSlugArg(projectOrSlug) {
  const trimmed = String(projectOrSlug ?? "").trim();
  if (!trimmed) return null;
  const candidatePath = resolve(expandHome(trimmed));
  const slug = existsSync(candidatePath) ? basename(candidatePath) : trimmed;
  return SLUG_RE.test(slug) ? slug : null;
}

export async function waitForInbox({ inboxDir, slug, timeoutMs = 1800_000, pollMs = 1500, afterIds = [] }) {
  if (!slug || !SLUG_RE.test(slug)) throw new Error("Invalid project slug");
  const seen = new Set(afterIds);
  const check = async () => {
    const res = await readInbox({ inboxDir, slug });
    const items = (res.projects[0]?.items || []).filter((item) => !seen.has(item.id));
    return items.length ? items : null;
  };

  const immediate = await check();
  if (immediate) return { ok: true, timedOut: false, slug, items: immediate };

  const dir = join(resolve(inboxDir), slug);
  await mkdir(dir, { recursive: true, mode: 0o700 });

  return new Promise((resolveWait) => {
    let settled = false;
    let watcher = null;
    let timer = null;
    let poller = null;
    let checking = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (watcher) { try { watcher.close(); } catch { /* ignore */ } }
      if (timer) clearTimeout(timer);
      if (poller) clearInterval(poller);
      resolveWait(result);
    };

    const probe = async () => {
      if (settled || checking) return;
      checking = true;
      try {
        const items = await check();
        if (items) finish({ ok: true, timedOut: false, slug, items });
      } finally {
        checking = false;
      }
    };

    try {
      watcher = watch(dir, (_event, filename) => {
        if (!filename || (filename.endsWith(".md") && filename !== "latest.md")) void probe();
      });
      watcher.on("error", () => { /* rely on poller fallback */ });
    } catch { /* rely on poller fallback */ }

    poller = setInterval(() => { void probe(); }, Math.max(50, pollMs));
    if (timeoutMs > 0) {
      timer = setTimeout(() => finish({ ok: false, timedOut: true, slug, items: [] }), timeoutMs);
    }
    void probe();
  });
}

export async function clearInbox({ inboxDir, slug }) {
  if (!slug || !SLUG_RE.test(slug)) return { cleared: 0 };
  const dir = join(resolve(inboxDir), slug);
  const archived = join(dir, "processed");
  let files;
  try { files = await readdir(dir, { withFileTypes: true }); }
  catch { return { cleared: 0 }; }
  const targets = files.filter((f) => f.isFile() && f.name.endsWith(".md")).map((f) => f.name);
  if (!targets.length) return { cleared: 0 };
  await mkdir(archived, { recursive: true, mode: 0o700 });
  let cleared = 0;
  for (const name of targets) {
    await rename(join(dir, name), join(archived, name));
    if (name !== "latest.md") cleared++;
  }
  return { cleared };
}

const INBOX_CLIENT_JS = `"use strict";
(function () {
  var exportBox = document.getElementById("decision-export");
  var copyBtn = document.getElementById("copy-decisions");
  var statusEl = document.getElementById("decision-copy-status");
  var cfgEl = document.getElementById("gm-config");
  if (!exportBox || !copyBtn || !cfgEl) return;
  var cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  var openDecisions = (cfg.decisions || []).filter(function (d) { return d && d.status !== "answered"; });
  if (!openDecisions.length) return;
  var parts = location.pathname.split("/").filter(Boolean);
  var slug = decodeURIComponent(parts[0] || "");
  if (!slug) return;

  function collectText() {
    var answers = Object.create(null);
    openDecisions.forEach(function (d) {
      var checked = document.querySelector('input[name="decision-' + d.id + '"]:checked');
      var notes = document.getElementById("decision-notes-" + d.id);
      answers[d.id] = { choice: checked ? checked.value : d.recommended, notes: notes ? notes.value : "" };
    });
    if (window.GMDashboard && typeof window.GMDashboard.decisionReply === "function") {
      return { answers: answers, text: window.GMDashboard.decisionReply(cfg.project || slug, openDecisions, answers) };
    }
    var lines = ["Decisions for " + (cfg.project || slug)];
    openDecisions.forEach(function (d, i) {
      var a = answers[d.id];
      var opt = (d.options || []).filter(function (o) { return o.id === a.choice; })[0];
      lines.push("", (i + 1) + ". " + d.question, "Choice: " + (opt ? opt.label : a.choice));
      if (a.notes.trim()) lines.push("Notes: " + a.notes.trim());
    });
    return { answers: answers, text: lines.join("\\n") };
  }

  var row = document.createElement("div");
  row.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:8px";
  copyBtn.parentNode.insertBefore(row, copyBtn);

  var sendBtn = document.createElement("button");
  sendBtn.type = "button";
  sendBtn.id = "send-decisions-inbox";
  sendBtn.className = copyBtn.className || "primary";
  sendBtn.textContent = "Send to hub inbox";
  sendBtn.addEventListener("click", function () {
    var payload = collectText();
    sendBtn.disabled = true;
    if (statusEl) statusEl.textContent = "Sending decisions to hub inbox…";
    fetch("/api/inbox/" + encodeURIComponent(slug), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: cfg.project || slug, text: payload.text, answers: payload.answers })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
    }).then(function (res) {
      if (res.ok && res.data && res.data.ok) {
        if (statusEl) statusEl.textContent = "Sent to hub inbox (" + res.data.id + "). In chat, say: pick up my dashboard answers.";
      } else {
        if (statusEl) statusEl.textContent = "Could not send (" + (res.data && res.data.error ? res.data.error : "HTTP " + res.status) + "). Use Copy answers for chat instead.";
      }
      sendBtn.disabled = false;
    }).catch(function () {
      if (statusEl) statusEl.textContent = "Network error sending to hub inbox. Use Copy answers for chat instead.";
      sendBtn.disabled = false;
    });
  });

  row.appendChild(sendBtn);
  row.appendChild(copyBtn);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    var shareBtn = document.createElement("button");
    shareBtn.type = "button";
    shareBtn.id = "share-decisions";
    shareBtn.textContent = "Share";
    shareBtn.addEventListener("click", function () {
      var payload = collectText();
      navigator.share({ title: "Decisions for " + (cfg.project || slug), text: payload.text }).catch(function () {});
    });
    row.appendChild(shareBtn);
  }
})();
`;

export function defaultHubConfigPath() {
  return process.env.GM_HUB_CONFIG ? resolve(process.env.GM_HUB_CONFIG) : join(homedir(), ".config", "grey-matter", "hub.json");
}

function expandHome(value) {
  if (typeof value !== "string") return value;
  if (value === "~") return homedir();
  if (value.startsWith("~/") || value.startsWith("~\\")) return join(homedir(), value.slice(2));
  return value;
}

export async function readHubConfig(configPath = defaultHubConfigPath()) {
  try {
    const raw = JSON.parse(await readFile(resolve(configPath), "utf8"));
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
  } catch {
    return null;
  }
}

export async function resolveProjectUrls(projectOrSlug, { hash = "", configPath = defaultHubConfigPath() } = {}) {
  const config = await readHubConfig(configPath);
  if (!config) return null;
  const trimmed = String(projectOrSlug ?? "").trim();
  if (!trimmed) return null;
  const candidatePath = resolve(expandHome(trimmed));
  const slug = existsSync(candidatePath) ? basename(candidatePath) : trimmed;
  if (!SLUG_RE.test(slug)) return null;
  const frag = hash ? `#${String(hash).replace(/^#/, "")}` : "";
  const route = `/${encodeURIComponent(slug)}/docs/status.html${frag}`;
  const hub = {};
  const urls = {};
  for (const key of ["baseUrl", "lanUrl", "mdnsUrl"]) {
    const raw = typeof config[key] === "string" ? config[key].trim().replace(/\/+$/, "") : "";
    if (!raw) continue;
    hub[key] = `${raw}/`;
    urls[key] = `${raw}${route}`;
  }
  if (!Object.keys(urls).length) return null;
  return { configured: true, slug, hub, urls };
}

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
  const inboxOpt = options.inbox && typeof options.inbox === "object" ? options.inbox : {};
  const inboxEnabled = inboxOpt.enabled === true;
  const inboxDir = resolve(expandHome(inboxOpt.dir || defaultInboxDir()));
  const allowedUsers = Array.isArray(inboxOpt.allowedUsers) ? inboxOpt.allowedUsers : [];
  let expectedOrigin = "";
  if (typeof inboxOpt.expectedOrigin === "string" && inboxOpt.expectedOrigin.trim()) {
    expectedOrigin = inboxOpt.expectedOrigin.trim().replace(/\/+$/, "");
  } else if (typeof options.baseUrl === "string" && options.baseUrl.trim()) {
    try { expectedOrigin = new URL(options.baseUrl.trim()).origin; } catch { /* ignore invalid */ }
  }

  return createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://hub.invalid").pathname); }
    catch { res.writeHead(400); res.end("Invalid URL"); return; }

    const auth = evaluateTailscaleAuth(req, { allowedUsers });
    const sendJson = (status, data) => {
      const body = Buffer.from(JSON.stringify(data, null, 2) + "\n");
      res.writeHead(status, { "Content-Type": MIME[".json"], "Content-Length": body.length });
      res.end(req.method === "HEAD" ? undefined : body);
    };

    if (req.method === "POST" && pathname.startsWith("/api/inbox/")) {
      if (!inboxEnabled) {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end();
        return;
      }
      if (!auth.userAllowed) {
        sendJson(403, { ok: false, error: "Tailscale Serve authentication required" });
        return;
      }
      const ctype = String(req.headers["content-type"] || "").toLowerCase();
      if (!ctype.startsWith("application/json")) {
        sendJson(415, { ok: false, error: "Content-Type must be application/json" });
        return;
      }
      if (!isAllowedOrigin(req, expectedOrigin)) {
        sendJson(403, { ok: false, error: "Origin not allowed" });
        return;
      }
      const slug = pathname.slice("/api/inbox/".length);
      if (!slug || slug.includes("/") || !SLUG_RE.test(slug)) {
        sendJson(404, { ok: false, error: "Unknown project" });
        return;
      }
      const projects = await discoverProjects({ roots, registry });
      if (!projects.has(slug)) {
        sendJson(404, { ok: false, error: "Unknown project" });
        return;
      }
      let body;
      try { body = await readLimitedJson(req); }
      catch (err) {
        sendJson(err.statusCode || 400, { ok: false, error: err.message });
        return;
      }
      const text = typeof body?.text === "string" ? body.text.trim() : "";
      if (!text || text.length > MAX_TEXT_CHARS) {
        sendJson(400, { ok: false, error: "Field 'text' must be a non-empty string under 24000 chars" });
        return;
      }
      const project = typeof body?.project === "string" && body.project.trim() ? body.project.trim().slice(0, 120) : slug;
      try {
        const saved = await saveInboxSubmission({
          inboxDir,
          slug,
          project,
          text,
          submittedBy: auth.login,
          submittedName: auth.name,
        });
        sendJson(201, saved);
      } catch {
        sendJson(500, { ok: false, error: "Could not save inbox submission" });
      }
      return;
    }

    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }

    if (pathname === "/api/inbox/status") {
      sendJson(200, {
        enabled: inboxEnabled,
        writable: inboxEnabled && auth.userAllowed,
        viaTailscale: auth.viaTailscale,
        remoteLoopback: auth.remoteLoopback,
        forwardedProto: auth.forwardedProto || null,
        hasTailscaleLogin: Boolean(auth.login),
      });
      return;
    }

    if (pathname === "/_hub/inbox.js") {
      const body = Buffer.from(INBOX_CLIENT_JS);
      res.writeHead(200, { "Content-Type": MIME[".js"], "Content-Length": body.length });
      res.end(req.method === "HEAD" ? undefined : body);
      return;
    }

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
      let body = await readFile(realTarget);
      if (subPath === "/docs/status.html" && inboxEnabled && auth.userAllowed) {
        const text = body.toString("utf8");
        const inject = `<script src="/_hub/inbox.js" defer></script></body>`;
        body = Buffer.from(text.includes("</body>") ? text.replace("</body>", inject) : text + inject);
      }
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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      root: { type: "string", multiple: true },
      registry: { type: "string" },
      host: { type: "string" },
      port: { type: "string" },
      config: { type: "string" },
      url: { type: "string" },
      hash: { type: "string" },
      inbox: { type: "boolean" },
      clear: { type: "boolean" },
      wait: { type: "string" },
      timeout: { type: "string", default: "1800" },
    },
  });
  const configPath = values.config ? resolve(expandHome(values.config)) : defaultHubConfigPath();
  if (values.url !== undefined) {
    const resolved = await resolveProjectUrls(values.url, { hash: values.hash ?? "", configPath });
    if (!resolved) {
      console.log(JSON.stringify({ configured: false }, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify(resolved, null, 2));
    process.exit(0);
  }
  const config = await readHubConfig(configPath);
  if (values.wait !== undefined) {
    const inboxDir = resolve(expandHome(config?.inbox?.dir || defaultInboxDir()));
    const slug = resolveSlugArg(values.wait);
    if (!slug) { console.error("--wait requires a valid project directory or slug"); process.exit(2); }
    const timeoutSec = Number(values.timeout);
    if (!Number.isFinite(timeoutSec) || timeoutSec < 0) {
      console.error("--timeout must be a non-negative number of seconds");
      process.exit(2);
    }
    const result = await waitForInbox({ inboxDir, slug, timeoutMs: Math.round(timeoutSec * 1000) });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 124);
  }
  if (values.inbox) {
    const inboxDir = resolve(expandHome(config?.inbox?.dir || defaultInboxDir()));
    const slug = positionals[0] ? resolveSlugArg(positionals[0]) : null;
    if (positionals[0] && !slug) { console.error("Invalid project directory or slug"); process.exit(2); }
    if (values.clear) {
      if (!slug) { console.error("--clear requires a project directory or slug"); process.exit(2); }
      console.log(JSON.stringify(await clearInbox({ inboxDir, slug }), null, 2));
      process.exit(0);
    }
    console.log(JSON.stringify(await readInbox({ inboxDir, slug }), null, 2));
    process.exit(0);
  }
  const host = values.host ?? (typeof config?.host === "string" && config.host.trim() ? config.host.trim() : "127.0.0.1");
  const port = Number(values.port ?? config?.port ?? 8765);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("--port must be an integer from 1 to 65535");
    process.exit(2);
  }
  const roots = (values.root?.length ? values.root : Array.isArray(config?.roots) && config.roots.length ? config.roots : [join(homedir(), "code")]).map((r) => expandHome(r));
  const registry = values.registry ? expandHome(values.registry) : typeof config?.registry === "string" && config.registry.trim() ? expandHome(config.registry.trim()) : null;
  const server = createHubServer({ roots, registry, baseUrl: config?.baseUrl, inbox: config?.inbox });
  server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => {
    console.log(`Dashboard hub: http://${host}:${port}/`);
  });
}
