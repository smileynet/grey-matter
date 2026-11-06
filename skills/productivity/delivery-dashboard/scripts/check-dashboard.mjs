#!/usr/bin/env node
// check-dashboard.mjs: read-only contract check for a delivery-dashboard HTML file.
// Usage: node check-dashboard.mjs <dashboard.html> [--repo DIR] [--strict]
// JSON on stdout: { ok, errors, warnings, stats }. Exit 0 = no errors, 1 = errors, 2 = unreadable input.
// --strict also fails on warnings (template examples left in, sausage-making words in headlines).
// It parses the data blocks and runs the page's own selection logic; it renders nothing and
// is no substitute for opening the page. Trusted repository HTML only (not a sandbox).
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { authoritativeProjection } from "./snapshot-tickets.mjs";

const KINDS = ["shipped", "progress", "decision", "blocked", "learning"];
const RUNGS = ["wireframe", "mocked", "live"];
const VISUALS = ["image", "compare", "progress", "steps", "metrics"];
const STATUSES = ["backlog", "open", "in_progress", "done", "cancelled"];
const PRIORITIES = ["urgent", "high", "medium", "low"];
const LIMITS = { title: 90, summary: 280, changes: 3, change: 100, question: 140, option: 60 };
const MAX_FILE = 400 * 1024;
const MAX_DATA_URI = 50 * 1024;
const SAUSAGE = [
  [/(^|\s)#\d{1,4}\b|\bticket\s+#?\d+/i, "ticket id"],
  [/\b[0-9a-f]{7,40}\b/, "commit hash"],
  [/\b[\w.-]+\/[\w./-]+\.(?:m?js|ts|py|rs|md|json|ya?ml|html|css)\b/i, "file path"],
  [/\b(refactor\w*|lint\w*|typecheck\w*|merge conflict|dependency bump)\b/i, "internal mechanics"],
];

export function check(path, { strict = false, repo, claim, agent, run = execFileSync } = {}) {
  const errors = [], warnings = [];
  let openAsks = 0, examples = 0, tickets = 0, logic = null;
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
  const html = readFileSync(path, "utf8");
  const base = dirname(resolve(path));
  if (Buffer.byteLength(html) > MAX_FILE) err(`file is ${Math.round(Buffer.byteLength(html) / 1024)} KB; keep the dashboard under ${MAX_FILE / 1024} KB and link media as separate files`);

  const block = (id, optional) => {
    const m = html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`));
    if (!m) { (optional ? warn : err)(`missing <script type="application/json" id="${id}"> block`); return null; }
    try { return JSON.parse(m[1]); } catch (e) { err(`${id} is not valid JSON: ${e.message}`); return null; }
  };
  const customMatch = html.match(/<script type="application\/json" id="gm-dashboard-contract">([\s\S]*?)<\/script>/);
  let custom = null;
  if (customMatch) {
    try { custom = JSON.parse(customMatch[1]); }
    catch (error) { err(`gm-dashboard-contract is not valid JSON: ${error.message}`); }
  }
  const cfg = custom ? { recentCount: 5 } : block("gm-config");
  const entries = custom ? custom.entries : block("gm-entries");
  const snap = custom ? custom.tickets : block("gm-tickets", true);
  if (!Array.isArray(entries)) { err(custom ? "custom contract entries must be a JSON array" : "gm-entries must be a JSON array"); return finish(); }
  if (custom && (!snap || !Array.isArray(snap.tickets) || !Array.isArray(snap.frontier))) err("custom contract needs a complete ticket snapshot");
  if (cfg && cfg.recentCount !== undefined && !(Number.isInteger(cfg.recentCount) && cfg.recentCount >= 1 && cfg.recentCount <= 5)) err("recentCount must be an integer from 1 to 5");

  if (cfg && cfg.ticketFlow !== undefined && cfg.ticketFlow !== false) {
    const flow = cfg.ticketFlow;
    if (!flow || typeof flow !== "object" || Array.isArray(flow)) err("ticketFlow must be false or a configuration object");
    else {
      if (flow.enabled !== undefined && typeof flow.enabled !== "boolean") err("ticketFlow.enabled must be boolean");
      if (flow.groupBy !== undefined && !["dependencies", "workstreams"].includes(flow.groupBy)) err("ticketFlow.groupBy must be dependencies or workstreams");
      const scopes = flow.scopes === undefined ? [] : flow.scopes;
      if (!Array.isArray(scopes)) err("ticketFlow.scopes must be a list");
      else {
        const scopeIds = new Set(["all"]);
        scopes.forEach((scope) => {
          if (!scope || typeof scope.id !== "string" || !scope.id || scopeIds.has(scope.id)) err("ticketFlow scopes need unique ids other than all");
          else scopeIds.add(scope.id);
          if (!scope || typeof scope.label !== "string" || !scope.label || !Array.isArray(scope.tags) || !scope.tags.length || !scope.tags.every((tag) => typeof tag === "string" && tag)) err("ticketFlow scopes need a label and nonempty tags list");
        });
        if (flow.defaultScope !== undefined && !scopeIds.has(flow.defaultScope)) err("ticketFlow.defaultScope must name all or a configured scope");
      }
    }
  }

  const policy = cfg && Object.hasOwn(cfg, "executionPolicy") ? cfg.executionPolicy : { mode: "off" };
  if (!policy || typeof policy !== "object" || Array.isArray(policy) || !["off", "serial", "parallel"].includes(policy.mode)) err("executionPolicy.mode must be off, serial or parallel");
  if (claim !== undefined) {
    if (!repo) err("--claim requires --repo so the full tracker and plan are checked");
    if (!policy || !["serial", "parallel"].includes(policy.mode)) err("--claim requires executionPolicy.mode serial or parallel");
    if (!snap || !Array.isArray(snap.tickets) || !Array.isArray(snap.executionOrder)) err("--claim requires a complete ticket snapshot with executionOrder");
  }

  const ids = new Set();
  if (cfg && cfg.decisions !== undefined) {
    const decisions = cfg.decisions, decisionIds = new Set();
    const text = (value) => typeof value === "string" && value.trim().length > 0;
    const safeId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]+$/.test(value);
    if (!Array.isArray(decisions)) err("decisions must be an array");
    else decisions.forEach((d, i) => {
      const at = `decision ${i}`;
      if (!d || typeof d !== "object") return err(`${at}: object required`);
      if (!safeId(d.id) || decisionIds.has(d.id)) err(`${at}: unique DOM-safe id required`);
      decisionIds.add(d.id);
      for (const field of ["question", "context", "reason"]) if (!text(d[field])) err(`${at}: ${field} required`);
      if (text(d.question) && d.question.length > LIMITS.question) err(`${at}: question too long`);
      if (!["open", "answered"].includes(d.status)) err(`${at}: status must be open or answered`);
      if (d.status === "answered" && !text(d.answer)) err(`${at}: answer required`);
      const optionIds = new Set();
      if (!Array.isArray(d.options) || d.options.length < 2) err(`${at}: at least two options required`);
      else d.options.forEach((o) => {
        if (!o || !safeId(o.id) || optionIds.has(o.id) || !text(o.label) || !text(o.detail)) err(`${at}: options need unique DOM-safe ids, labels and tradeoffs`);
        if (o) optionIds.add(o.id);
      });
      if (!optionIds.has(d.recommended)) err(`${at}: recommended must name an option`);
      if (d.tickets !== undefined && (!Array.isArray(d.tickets) || !d.tickets.every(text))) err(`${at}: tickets must be a list of ids`);
    });
    for (const id of ["tab-decisions", "decision-list", "copy-decisions", "decision-reply", "decision-copy-status"]) {
      if (!html.includes(`id="${id}"`)) err(`missing decisions control ${id}`);
    }
  }
  const hrefOk = (h, where) => {
    if (typeof h !== "string" || !h) return err(`${where}: empty link`);
    if (/^(javascript|data|vbscript):/i.test(h)) return err(`${where}: unsafe link scheme`);
    if (/^https?:/i.test(h) || h.startsWith("#")) return;
    if (!existsSync(resolve(base, h.split("#")[0]))) err(`${where}: relative link does not resolve: ${h}`);
  };
  const srcOk = (s, where) => {
    if (/^https?:/i.test(s || "")) return err(`${where}: remote image breaks offline opening: ${s}`);
    if (/^data:/i.test(s || "")) return warn(`${where}: embedded image; link a file instead`);
    hrefOk(s, where);
  };

  entries.forEach((e, i) => {
    const at = `entry ${e && e.id ? e.id : "#" + i}`;
    if (!e || typeof e !== "object") return err(`${at}: not an object`);
    if (!e.id || typeof e.id !== "string") err(`${at}: id required`);
    else if (ids.has(e.id)) err(`${at}: duplicate id`); else ids.add(e.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) err(`${at}: date must be YYYY-MM-DD`);
    if (!KINDS.includes(e.kind)) err(`${at}: kind must be one of ${KINDS.join(", ")}`);
    if (e.fidelity !== undefined && !RUNGS.includes(e.fidelity)) err(`${at}: fidelity must be ${RUNGS.join(", ")}`);
    if (!e.title) err(`${at}: title required`); else if (e.title.length > LIMITS.title) err(`${at}: title is ${e.title.length} characters (limit ${LIMITS.title})`);
    if (!e.summary) err(`${at}: summary required`); else if (e.summary.length > LIMITS.summary) err(`${at}: summary is ${e.summary.length} characters (limit ${LIMITS.summary})`);
    if (e.example) examples++;
    if (e.changes) {
      if (!Array.isArray(e.changes) || e.changes.length > LIMITS.changes) err(`${at}: at most ${LIMITS.changes} visible changes; move the rest into details`);
      else e.changes.forEach((c) => c.length > LIMITS.change && err(`${at}: a change is over ${LIMITS.change} characters`));
    }
    for (const [field, text] of [["title", e.title], ["summary", e.summary], ...((e.changes || []).map((c) => ["changes", c]))]) {
      for (const [re, what] of SAUSAGE) if (typeof text === "string" && re.test(text)) warn(`${at}: ${field} mentions ${what}; keep it in details`);
    }
    const v = e.visual;
    if (v) {
      if (!VISUALS.includes(v.type)) err(`${at}: visual.type must be one of ${VISUALS.join(", ")}`);
      if (v.type === "image") { if (!v.alt) err(`${at}: image needs alt text`); srcOk(v.src, `${at} visual`); }
      if (v.type === "compare") for (const s of [v.before, v.after]) { if (!s || !s.alt) err(`${at}: compare images need alt text`); else srcOk(s.src, `${at} visual`); }
      if (v.type === "progress" && !(Number.isFinite(v.done) && Number.isFinite(v.total) && v.total >= 0 && v.done >= 0 && v.done <= v.total)) err(`${at}: progress needs numeric done <= total`);
      if (v.type === "steps" && !(
        (v.mode === undefined || v.mode === "sequence") && Array.isArray(v.items) &&
        v.items.every((step) => step?.label && (v.mode === "sequence" ? step.state === undefined : ["done", "now", "next"].includes(step.state)))
      )) err(`${at}: steps need labels and states done|now|next, or labels alone in sequence mode`);
      if (v.type === "metrics" && !(Array.isArray(v.items) && v.items.every((m) => m.label && m.value !== undefined))) err(`${at}: metrics need label and value`);
    }
    if (e.tickets !== undefined) {
      if (!Array.isArray(e.tickets) || !e.tickets.length || !e.tickets.every((t) => typeof t === "string" && t)) err(`${at}: tickets must be a nonempty list of ticket ids`);
      else if (!v) err(`${at}: a ticket entry needs a visual (a live capture, a labelled mock or wireframe, or steps showing plan movement)`);
    }
    if (e.try) hrefOk(e.try.href, `${at} try link`);
    (e.links || []).forEach((l) => { if (!l.label) err(`${at}: link needs a label`); hrefOk(l.href, `${at} link`); });
    (e.asks || []).forEach((a) => {
      if (!a.id || !a.question) return err(`${at}: ask needs id and question`);
      if (a.question.length > LIMITS.question) err(`${at}: ask question over ${LIMITS.question} characters`);
      if (a.status === "open") {
        openAsks++;
        if (!a.recommendation) err(`${at}: open ask "${a.id}" needs a recommendation`);
        if (!Array.isArray(a.options) || a.options.length < 2) err(`${at}: open ask "${a.id}" needs at least two options`);
        else if (a.recommendation && !a.options.includes(a.recommendation)) err(`${at}: recommendation of "${a.id}" must be one of its options`);
        else a.options.forEach((o) => o.length > LIMITS.option && err(`${at}: option over ${LIMITS.option} characters`));
      } else if (a.status === "answered") { if (!a.answer) err(`${at}: answered ask "${a.id}" needs an answer`); }
      else err(`${at}: ask status must be open or answered`);
    });
  });

  if (snap) {
    const list = snap.tickets, tids = new Set();
    if (!Array.isArray(list) || !Array.isArray(snap.frontier) || !(snap.generated === null || !Number.isNaN(Date.parse(snap.generated)))) err("gm-tickets needs generated (ISO time or null), frontier and tickets arrays; regenerate it with snapshot-tickets.mjs");
    else {
      tickets = list.length;
      if (snap.executionOrder !== undefined && (!Array.isArray(snap.executionOrder) || new Set(snap.executionOrder).size !== snap.executionOrder.length || snap.executionOrder.some((id) => typeof id !== "string" || !id))) err("gm-tickets.executionOrder must be a unique list of ticket ids; regenerate it from docs/plan.md");
      if ((repo || policy?.mode === "serial" || policy?.mode === "parallel") && !Array.isArray(snap.executionOrder)) err("gm-tickets.executionOrder is required for repository comparison and execution policy; regenerate it from docs/plan.md");
      list.forEach((t, i) => {
        const at = `ticket ${t && t.id ? t.id : "#" + i}`;
        if (!t || typeof t.id !== "string" || !t.id) return err(`${at}: id required`);
        if (tids.has(t.id)) err(`${at}: duplicate id`); tids.add(t.id);
        if (typeof t.title !== "string" || !t.title) err(`${at}: title required`);
        if (!STATUSES.includes(t.status)) err(`${at}: status must be one of ${STATUSES.join(", ")}`);
        if (t.priority !== undefined && !PRIORITIES.includes(t.priority)) err(`${at}: priority must be one of ${PRIORITIES.join(", ")}`);
        if (t.tags !== undefined && !(Array.isArray(t.tags) && t.tags.every((tag) => typeof tag === "string"))) err(`${at}: tags must be a list of strings`);
        if (t.gate !== undefined && (!t.gate || !["decision", "evidence"].includes(t.gate.kind) || typeof t.gate.reason !== "string" || !t.gate.reason.trim())) err(`${at}: gate needs decision or evidence kind and a nonempty reason`);
        if (t.blocked_by !== undefined && !(Array.isArray(t.blocked_by) && t.blocked_by.every((b) => typeof b === "string"))) err(`${at}: blocked_by must be a list of ids`);
      });
      (Array.isArray(snap.executionOrder) ? snap.executionOrder : []).forEach((id) => { if (!tids.has(id)) err(`gm-tickets.executionOrder names ${id}, which is missing from the ticket snapshot`); });
      list.forEach((t) => (t && Array.isArray(t.blocked_by) ? t.blocked_by : []).forEach((b) => tids.has(b) || err(`ticket ${t.id}: blocker ${b} is not in the snapshot`)));
      snap.frontier.forEach((id) => { const t = list.find((x) => x && x.id === id); if (!t || t.status !== "open") err(`gm-tickets frontier lists ${id}, which is not an open ticket in the snapshot`); });
      if (list.length) entries.forEach((e) => (Array.isArray(e && e.tickets) ? e.tickets : []).forEach((id) => tids.has(id) || warn(`entry ${e.id}: ticket ${id} is not in the snapshot`)));
      const newest = entries.map((e) => e && e.date).filter(Boolean).sort().pop();
      if (snap.generated && newest && String(snap.generated).slice(0, 10) < newest) warn(`ticket snapshot (${String(snap.generated).slice(0, 10)}) predates the newest entry (${newest}); rerun snapshot-tickets.mjs`);
      if (entries.some((e) => e && e.tickets) && !list.length) warn("entries name tickets but the ticket snapshot is empty; run snapshot-tickets.mjs");
    }
  }

  if (repo) {
    if (!snap || !Array.isArray(snap.tickets) || !Array.isArray(snap.frontier)) err("full-board comparison requires a valid ticket snapshot");
    else try {
      const board = authoritativeProjection(resolve(repo), run);
      run("tkt", ["sync-plan", "--check", "--strict", "--brief"], { cwd: resolve(repo), encoding: "utf8", env: { ...process.env, TKT_ADVICE: "0" } });
      const fields = ["title", "status", "priority", "blocked_by", "tags", "gate", "body_id"];
      const expected = new Map(board.tickets.map((ticket) => [ticket.id, ticket]));
      const actual = new Map(snap.tickets.map((ticket) => [ticket.id, ticket]));
      const mismatches = [];
      for (const id of new Set([...expected.keys(), ...actual.keys()])) {
        const source = expected.get(id), projection = actual.get(id);
        if (!source || !projection) { mismatches.push(id); continue; }
        if (fields.some((field) => JSON.stringify(source[field]) !== JSON.stringify(projection[field]))) mismatches.push(id);
      }
      if (mismatches.length) err(`dashboard ticket facts differ from the authoritative board (missing, extra or stale rows: ${mismatches.join(", ")})`);
      if (JSON.stringify(snap.frontier) !== JSON.stringify(board.frontier)) err("dashboard frontier differs from the authoritative board");
      if (JSON.stringify(snap.executionOrder || []) !== JSON.stringify(board.executionOrder)) err("dashboard execution order differs from the maintained docs/plan.md order");
    } catch (error) {
      const output = [error.stderr, error.stdout].map((value) => Buffer.isBuffer(value) ? value.toString() : value)
        .filter((value) => typeof value === "string" && value.trim()).join("\n").trim();
      err(`authoritative board/plan comparison failed: ${output || error.message}`);
    }
  }

  if (policy && typeof policy === "object" && ["serial", "parallel"].includes(policy.mode) && snap && Array.isArray(snap.tickets) && Array.isArray(snap.executionOrder)) {
    const ticketsById = new Map(snap.tickets.map((ticket) => [ticket.id, ticket]));
    const order = snap.executionOrder;
    const active = snap.tickets.filter((ticket) => ticket.status === "in_progress");
    const unsequenced = snap.tickets.filter((ticket) => ["open", "in_progress", "backlog"].includes(ticket.status) && !order.includes(ticket.id));
    if (unsequenced.length) err(`execution policy requires every unfinished ticket to appear in the maintained plan order: ${unsequenced.map((ticket) => ticket.id).join(", ")}`);
    if (policy.mode === "serial" && active.length > 1) err(`serial execution allows one in-progress ticket; found ${active.length}`);
    if (policy.mode === "parallel") {
      const owners = active.map((ticket) => typeof ticket.assignee === "string" ? ticket.assignee.trim() : "").filter(Boolean);
      if (owners.length !== active.length) err("parallel execution requires a distinct nonempty assignee for every in-progress ticket");
      if (new Set(owners).size !== owners.length) err("parallel execution requires distinct assignees for in-progress tickets");
    }
    if (claim !== undefined) {
      const requested = ticketsById.get(String(claim));
      if (!requested) err(`--claim ${claim} is missing from the ticket snapshot`);
      else {
        if (requested.status !== "open") err(`--claim ${claim} must be open; current status is ${requested.status}`);
        if (!(snap.frontier || []).includes(requested.id)) err(`--claim ${claim} is outside the native tkt frontier`);
        if (!order.includes(requested.id)) err(`--claim ${claim} is unsequenced in docs/plan.md`);
        if ((requested.blocked_by || []).some((id) => !ticketsById.has(id) || ticketsById.get(id).status !== "done")) err(`--claim ${claim} has unfinished or missing prerequisites`);
        if (requested.gate) err(`--claim ${claim} has an unresolved planning gate`);
        if (policy.mode === "serial" && active.length) err(`serial execution already has in-progress ticket ${active[0].id}; finish or return it before claiming`);
        const frontier = new Set(snap.frontier || []);
        const next = order.map((id) => ticketsById.get(id)).find((ticket) => ticket && frontier.has(ticket.id) && ticket.status === "open" && !(ticket.blocked_by || []).some((id) => !ticketsById.has(id) || ticketsById.get(id).status !== "done") && !ticket.gate);
        if (policy.mode === "serial" && next && next.id !== requested.id) err(`--claim ${claim} is not next; the first eligible planned ticket is ${next.id}`);
        if (policy.mode === "parallel") {
          if (typeof agent !== "string" || !agent.trim()) err("parallel --claim requires --agent <owner>");
          else if (active.some((ticket) => typeof ticket.assignee === "string" && ticket.assignee.trim() === agent.trim())) err(`parallel owner ${agent} already owns an in-progress ticket`);
        }
      }
    }
  }

  if (custom) {
    if (custom.version !== 1) err("custom contract version must be 1");
    const expectedViews = ["needs-you", "overview", "history", "plan"];
    if (!Array.isArray(custom.viewOrder) || JSON.stringify(custom.viewOrder) !== JSON.stringify(expectedViews)) err("Needs you must be first, followed by overview, history and plan");
    const equalIds = (actual, expected) => Array.isArray(actual) && JSON.stringify(actual) === JSON.stringify(expected);
    const askIds = entries.flatMap((entry) => entry && Array.isArray(entry.asks) ? entry.asks.filter((ask) => ask.status === "open").map((ask) => `${entry.id}:${ask.id}`) : []);
    if (!equalIds(custom.needsYouAskIds, askIds)) err("Needs you must include every open ask in entry order");
    const ids = entries.map((entry) => entry && entry.id);
    const overview = custom.overviewEntryIds;
    if (!Array.isArray(overview) || overview.length > 5 || !equalIds(overview, ids.slice(0, overview.length))) err("overview may show at most five newest entries, in order");
    if (custom.historySearchable !== true || !equalIds(custom.historyEntryIds, ids)) err("searchable history must include every entry, including the overview entries");
    const plan = custom.plan, tickets = snap && Array.isArray(snap.tickets) ? snap.tickets : [];
    if (!plan || typeof plan !== "object" || Array.isArray(plan) || !Array.isArray(plan.currentIds) || !Array.isArray(plan.historyIds)) err("custom plan needs currentIds and historyIds lists");
    else {
      const expectedCurrent = tickets.filter((ticket) => !["done", "cancelled"].includes(ticket.status)).map((ticket) => ticket.id);
      const expectedHistory = tickets.filter((ticket) => ["done", "cancelled"].includes(ticket.status)).map((ticket) => ticket.id);
      const uniqueSet = (values) => new Set(values).size === values.length;
      if (!uniqueSet(plan.currentIds) || !uniqueSet(plan.historyIds) || plan.currentIds.some((id) => plan.historyIds.includes(id))) err("custom plan ids must be unique and appear in one view");
      const sameSet = (actual, expected) => actual.length === expected.length && actual.every((id) => expected.includes(id));
      if (!sameSet(plan.currentIds, expectedCurrent)) err("unfinished tickets must remain in the current Plan, in authored order");
      if (!sameSet(plan.historyIds, expectedHistory)) err("terminal tickets belong only in Plan history");
    }
    logic = { overview: Array.isArray(custom.overviewEntryIds) ? custom.overviewEntryIds.length : 0,
      history: Array.isArray(custom.historyEntryIds) ? custom.historyEntryIds.length : 0,
      total: entries.length, plan: Array.isArray(custom.plan?.currentIds) ? custom.plan.currentIds.length : 0 };
  }

  if (examples) warn(`${examples} template example entr${examples === 1 ? "y" : "ies"} still present; delete them`);
  const sorted = entries.map((e) => e && e.date).filter(Boolean);
  if (sorted.some((d, i) => i && d > sorted[i - 1])) warn("entries are not newest first; the page sorts them, but keep the block ordered for clean diffs");

  const remote = [...html.matchAll(/<(?:script|link|img|iframe)\b[^>]*\b(?:src|href)=["'](https?:[^"']+)/gi)].map((m) => m[1]);
  if (remote.length) err(`remote resource breaks offline opening: ${remote[0]}`);
  if (/@import\s+url\(\s*["']?https?:/i.test(html)) err("remote @import breaks offline opening");
  const dataBytes = [...html.matchAll(/data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+/g)].reduce((n, m) => n + m[0].length, 0);
  if (dataBytes > MAX_DATA_URI) err(`${Math.round(dataBytes / 1024)} KB of embedded base64 media; link files instead (limit ${MAX_DATA_URI / 1024} KB)`);
  if (!/color-scheme:\s*dark/.test(html)) err("dark color-scheme missing");
  if (!custom && (!/role="tablist"/.test(html) || !/id="q"/.test(html))) err("history tab with search is missing");

  if (!custom) {
  // The page's own selection logic: the overview shows the newest 5 and nothing is lost from history.
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).pop();

  if (script) {
    const ctx = { window: {} };
    try {
      vm.runInNewContext(script, ctx, { timeout: 2000 });
      const api = ctx.window.GMDashboard;
      const n = (cfg && cfg.recentCount) || 5;
      const s = api.splitRecent(entries, n);
      const shown = (s.latest ? 1 : 0) + s.recent.length;
      logic = { overview: shown, history: shown + s.rest.length, total: entries.length };
      if (shown > n || logic.history !== entries.length) err(`selection logic broken: overview ${shown}, history ${logic.history}, total ${entries.length}`);
      if (snap && Array.isArray(snap.tickets) && api.planGroups) {
        const g = api.planGroups(snap), grouped = Object.values(g).reduce((s, x) => s + x.length, 0);
        logic.plan = grouped;
        if (grouped !== snap.tickets.length) err(`plan grouping broken: ${grouped} of ${snap.tickets.length} tickets shown`);
        if (api.ticketFlow && cfg && cfg.ticketFlow !== false && !(cfg.ticketFlow && cfg.ticketFlow.enabled === false)) {
          const flow = api.ticketFlow(snap, { scopes: cfg.ticketFlow && cfg.ticketFlow.scopes });
          const remaining = snap.tickets.filter((ticket) => !["done", "cancelled"].includes(ticket.status));
          if (flow.visible.length !== remaining.length || remaining.some((ticket) => !flow.visible.some((visible) => visible.id === ticket.id))) err("default ticket flow hides remaining work");
          if (Object.values(flow.counts).reduce((total, count) => total + count, 0) !== flow.visible.length) err("ticket flow status counts omit visible work");
          if (flow.readiness && Object.values(flow.readiness).reduce((total, count) => total + count, 0) !== flow.visible.length) err("ticket flow planning counts omit visible work");
          if (flow.groups && new Set(flow.groups.flatMap((group) => group.tickets.map((ticket) => ticket.id))).size !== remaining.length) err("workstream grouping omits remaining work");
        }
      }
    } catch (e) { err(`page script failed to load: ${e.message}`); }
  } else err("page script missing");
  }

  return finish();
  function finish() {
    const stats = { entries: Array.isArray(entries) ? entries.length : 0, tickets, openAsks, bytes: Buffer.byteLength(html), logic };
    const failed = errors.length > 0 || (strict && warnings.length > 0);
    return { ok: !failed, errors, warnings, stats };
  }
}

// fileURLToPath, not URL.pathname: on Windows the pathname is /D:/..., so the CLI never ran.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const repoAt = args.indexOf("--repo");
  if (!file || !existsSync(file)) { console.error("usage: check-dashboard.mjs <dashboard.html> [--repo DIR] [--strict] [--claim ID [--agent OWNER]]"); process.exit(2); }
  if (repoAt >= 0 && (!args[repoAt + 1] || args[repoAt + 1].startsWith("--"))) {
    console.error("--repo requires a project root");
    process.exit(2);
  }
  const claimAt = args.indexOf("--claim"), agentAt = args.indexOf("--agent");
  if (claimAt >= 0 && (!args[claimAt + 1] || args[claimAt + 1].startsWith("--"))) { console.error("--claim requires a ticket ID"); process.exit(2); }
  if (agentAt >= 0 && (!args[agentAt + 1] || args[agentAt + 1].startsWith("--"))) { console.error("--agent requires an owner"); process.exit(2); }
  if (agentAt >= 0 && claimAt < 0) { console.error("--agent requires --claim"); process.exit(2); }
  const r = check(file, { strict: args.includes("--strict"), repo: repoAt >= 0 ? args[repoAt + 1] : undefined,
    claim: claimAt >= 0 ? args[claimAt + 1] : undefined, agent: agentAt >= 0 ? args[agentAt + 1] : undefined });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
