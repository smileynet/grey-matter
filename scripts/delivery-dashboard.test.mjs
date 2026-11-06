#!/usr/bin/env node
// Protect the delivery-dashboard contract: the shipped template passes, the overview/history
// selection never loses an entry, and each rule in the checker rejects a bad dashboard.
// Run: node --test scripts/delivery-dashboard.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { check } from "../skills/productivity/delivery-dashboard/scripts/check-dashboard.mjs";
import { compareReadinessIdentity } from "../skills/productivity/delivery-dashboard/scripts/readiness-identity.mjs";
import { authoredExecutionOrder, authoritativeProjection, snapshot } from "../skills/productivity/delivery-dashboard/scripts/snapshot-tickets.mjs";

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "../skills/productivity/delivery-dashboard");
const TEMPLATE = readFileSync(join(SKILL, "assets/dashboard-template.html"), "utf8");
const ENTRIES = /(<script type="application\/json" id="gm-entries">)([\s\S]*?)(<\/script>)/;
const TICKETS = /(<script type="application\/json" id="gm-tickets">)([\s\S]*?)(<\/script>)/;
const BODY_ID = "a".repeat(40);
const withTickets = (snap) => (h) => h.replace(TICKETS, `$1${JSON.stringify(snap)}$3`);
const api = () => {
  const ctx = { window: {} };
  vm.runInNewContext(TEMPLATE.match(/<script>([\s\S]*?)<\/script>/g).pop().replace(/<\/?script>/g, ""), ctx);
  return ctx.window.GMDashboard;
};
const tk = (id, status, blocked_by = []) => ({ id, title: `Ticket ${id}`, status, blocked_by });

test("cancelled tickets stay distinct terminal context and never satisfy prerequisites", (t) => {
  const snap = { generated: "2026-11-02T00:00:00Z", frontier: [], tickets: [tk("retired", "cancelled"), tk("child", "open", ["retired"])] };
  const groups = api().planGroups(snap);
  assert.equal(groups.cancelled.length, 1);
  assert.equal(groups.done.length, 0);
  assert.equal(groups.blocked.length, 1);
  const flow = api().ticketFlow(snap);
  assert.deepEqual(Array.from(flow.visible, ticket => ticket.id), ["child"]);
  assert.equal(flow.elsewhere, 0);
  const context = api().ticketFlow(snap, { completed: true });
  assert.equal(context.counts.cancelled, 1);
  assert.equal(context.counts.done, 0);
  assert.equal(context.readiness.cancelled, 1);
  assert.equal(context.edges[0].satisfied, false);
  const file = dashboard(t, [], withTickets(snap));
  assert.deepEqual(check(file.file).errors, []);
});

function entry(n, extra = {}) {
  const day = String(n).padStart(2, "0");
  return { id: `e${n}`, date: `2026-09-${day}`, kind: "shipped", title: `You can do thing ${n}`, summary: `Thing ${n} works.`, ...extra };
}
function dashboard(t, entries, edit = (h) => h) {
  const dir = mkdtempSync(join(tmpdir(), "gm dash "));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const html = edit(TEMPLATE.replace(ENTRIES, `$1${JSON.stringify(entries)}$3`));
  const file = join(dir, "status.html");
  writeFileSync(file, html);
  return { dir, file };
}
function customDashboard(t, contract) {
  const dir = mkdtempSync(join(tmpdir(), "gm custom dashboard "));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, "custom.html");
  writeFileSync(file, `<html><head><style>:root{color-scheme:dark}</style></head><body><main><input id="history-search" type="search"></main><script type="application/json" id="gm-dashboard-contract">${JSON.stringify(contract)}</script></body></html>`);
  return { dir, file };
}
function customContract() {
  const entries = [entry(2, { asks: [{ id: "scope", question: "Choose scope", status: "open", recommendation: "small", options: ["small", "large"] }] }), entry(1)];
  return {
    version: 1,
    viewOrder: ["needs-you", "overview", "history", "plan"],
    needsYouAskIds: ["e2:scope"],
    entries,
    overviewEntryIds: ["e2", "e1"],
    historyEntryIds: ["e2", "e1"],
    historySearchable: true,
    tickets: { generated: "2026-09-03T00:00:00Z", frontier: ["work"], tickets: [tk("work", "open"), tk("work-2", "in_progress"), tk("complete", "done")] },
    plan: { currentIds: ["work-2", "work"], historyIds: ["complete"] },
  };
}
function refreshCustomSnapshot(file, repo, run, now) {
  const html = readFileSync(file, "utf8");
  const block = /(<script type="application\/json" id="gm-dashboard-contract">)([\s\S]*?)(<\/script>)/;
  const match = html.match(block), contract = JSON.parse(match[2]);
  contract.tickets = { generated: now.toISOString(), ...authoritativeProjection(repo, run) };
  const safe = JSON.stringify(contract).replace(/</g, "\\u003c");
  writeFileSync(file, html.replace(block, (whole, open, data, close) => open + safe + close));
  return contract;
}
const run = (file, opts) => check(file, opts);

const decision = { id: "scope", question: "Which scope?", context: "Sets delivery time.", status: "open", options: [{ id: "small", label: "Small", detail: "Ships sooner." }, { id: "large", label: "Large", detail: "More coverage." }], recommended: "small", reason: "Validate early." };
const withDecisions = (decisions) => (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify({ project: "Test", decisions }) + b);
test("decision checker accepts valid choices and rejects malformed decisions", (t) => {
  assert.equal(check(dashboard(t, [], withDecisions([decision])).file).ok, true);
  for (const change of [{ id: "bad id" }, { recommended: "missing" }, { options: [decision.options[0]] }, { status: "answered" }, { context: "" }, { options: [null, null] }]) {
    assert.equal(check(dashboard(t, [], withDecisions([{ ...decision, ...change }])).file).ok, false, JSON.stringify(change));
  }
  assert.equal(check(dashboard(t, [], withDecisions([decision, decision])).file).ok, false);
});
test("export includes pending selections and alternative text while preserving status", () => {
  const decisions = [decision, { ...decision, id: "old", status: "answered", answer: "Confirmed" }];
  const reply = api().decisionReply("Test", decisions, { scope: { choice: "large", notes: "  Another approach\nwith conditions  " } });
  assert.match(reply, /Which scope\?/);
  assert.match(reply, /Choice: Large/);
  assert.match(reply, /Notes: Another approach\nwith conditions/);
  assert.equal(reply.includes("Confirmed"), false);
  assert.equal(decision.status, "open");
});
test("clipboard reports success and falls back on absent or rejected access", async () => {
  let copied;
  assert.equal(await api().copyDecisionText("answers", { writeText: async text => { copied = text; } }), true);
  assert.equal(copied, "answers");
  assert.equal(await api().copyDecisionText("answers", null), false);
  assert.equal(await api().copyDecisionText("answers", { writeText: async () => { throw Error("denied"); } }), false);
});

test("the blank template passes strict mode and shows empty states", () => {
  const f = join(SKILL, "assets/dashboard-template.html");
  const r = run(f, { strict: true });
  assert.equal(r.ok, true, r.errors.concat(r.warnings).join("; "));
  assert.equal(r.stats.entries, 0);
  assert.match(TEMPLATE, /No entries yet/);
});

test("the CLI rejects a dangling --repo operand instead of doing a local-only check", (t) => {
  const file = dashboard(t, []).file;
  const script = join(SKILL, "scripts/check-dashboard.mjs");
  const local = spawnSync(process.execPath, [script, file], { encoding: "utf8" });
  assert.equal(local.status, 0, local.stderr);
  const dangling = spawnSync(process.execPath, [script, file, "--repo"], { encoding: "utf8" });
  assert.notEqual(dangling.status, 0, dangling.stdout);
  assert.match(dangling.stderr, /--repo requires a project root/);
  const missingClaim = spawnSync(process.execPath, [script, file, "--claim"], { encoding: "utf8" });
  assert.equal(missingClaim.status, 2);
  assert.match(missingClaim.stderr, /--claim requires a ticket ID/);
  const orphanOwner = spawnSync(process.execPath, [script, file, "--agent", "worker"], { encoding: "utf8" });
  assert.equal(orphanOwner.status, 2);
  assert.match(orphanOwner.stderr, /--agent requires --claim/);
  const claimWithoutRepo = spawnSync(process.execPath, [script, join(SKILL, "assets/dashboard-template.html"), "--claim", "definitely-missing"], { encoding: "utf8" });
  assert.equal(claimWithoutRepo.status, 1, "claim preflight must not pass when execution policy is off and no repository is checked");
  const claimResult = JSON.parse(claimWithoutRepo.stdout);
  assert.equal(claimResult.ok, false);
  assert.match(claimResult.errors.join("\n"), /--claim requires --repo/);
  assert.match(claimResult.errors.join("\n"), /executionPolicy\.mode serial or parallel/);
});

test("API claim preflight rejects off policy even with an empty full-board snapshot", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard claim policy "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets")); mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n");
  const run = (cmd, args) => args[0] === "sync-plan" ? "Plan is current\n" : "";
  const file = dashboard(t, [], withTickets({ generated: null, frontier: [], executionOrder: [], tickets: [] })).file;
  const result = check(file, { repo: root, claim: "definitely-missing", run });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /executionPolicy\.mode serial or parallel/);
});

test("recentCount cannot raise the overview limit above five", (t) => {
  const config = (recentCount) => (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, (_, open, close) => open + JSON.stringify({ project: "Test", recentCount }) + close);
  const result = check(dashboard(t, Array.from({ length: 6 }, (_, i) => entry(i + 1)), config(6)).file);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /recentCount must be an integer from 1 to 5/);
  const smaller = check(dashboard(t, Array.from({ length: 4 }, (_, i) => entry(i + 1)), config(3)).file);
  assert.equal(smaller.ok, true, smaller.errors.join("; "));
  assert.deepEqual(smaller.stats.logic, { overview: 3, history: 4, total: 4, plan: 0 });
});

test("the worked example passes strict mode and demonstrates every feature", () => {
  const f = join(SKILL, "assets/dashboard-example.html");
  const html = readFileSync(f, "utf8");
  const r = run(f, { strict: true });
  assert.equal(r.ok, true, r.errors.concat(r.warnings).join("; "));
  const entries = JSON.parse(html.match(ENTRIES)[2]);
  assert.ok(entries.length >= 8, "enough entries that some roll into the history");
  assert.ok(r.stats.logic.history > r.stats.logic.overview, "history holds more than the overview");
  assert.ok(r.stats.openAsks >= 2, "open asks collect in Needs you");
  assert.ok(entries.some((e) => (e.asks || []).some((a) => a.status === "answered")), "an answered ask is kept as record");
  assert.deepEqual([...new Set(entries.flatMap((e) => (e.visual ? [e.visual.type] : [])))].sort(), ["compare", "image", "metrics", "progress", "steps"]);
  assert.deepEqual([...new Set(entries.map((e) => e.kind))].sort(), ["blocked", "decision", "learning", "progress", "shipped"]);
  assert.deepEqual([...new Set(entries.map((e) => e.fidelity).filter(Boolean))].sort(), ["live", "mocked", "wireframe"]);
  assert.ok(!entries.some((e) => e.example), "the example is not flagged as template sample data");
  const snap = JSON.parse(html.match(TICKETS)[2]);
  assert.equal(r.stats.logic.plan, snap.tickets.length, "every ticket lands in one plan group");
  assert.deepEqual([...new Set(snap.tickets.map((t) => t.status))].sort(), ["backlog", "done", "in_progress", "open"]);
  assert.ok(entries.filter((e) => e.tickets).length >= 3 && entries.filter((e) => e.tickets).every((e) => e.visual), "ticket entries carry visuals");
  assert.ok(api().planLanes(snap).length >= 3, "the plan shows work in at least three layers");
});

test("a custom renderer exposes the same ordered, complete dashboard contract", (t) => {
  const contract = customContract();
  const authoredOrder = [...contract.plan.currentIds];
  const result = check(customDashboard(t, contract).file);
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.stats.entries, 2);
  assert.equal(result.stats.openAsks, 1);
  assert.deepEqual(result.stats.logic, { overview: 2, history: 2, total: 2, plan: 2 });
  assert.deepEqual(contract.plan.currentIds, authoredOrder);
});

test("a custom ticket adapter refreshes only tracker data before the full comparison", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm custom refreshed board "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  mkdirSync(join(root, "docs")); writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n| work-2 | Work two | in_progress |\n| work | Work | open |\n| complete | Done | done |\n");
  const facts = [
    { id: "work", title: "Fix </script> parsing", status: "open", blocked_by: [], tags: [] },
    { id: "work-2", title: "Work two", status: "in_progress", blocked_by: [], tags: [], assignee: "worker-two" },
    { id: "complete", title: "Completed work", status: "done", blocked_by: [], tags: [] },
  ];
  for (const ticket of facts) {
    writeFileSync(join(root, ".tickets", ticket.id + "-fixture.md"), "---\nid: " + ticket.id + "\nstatus: " + ticket.status + "\n---\nBody\n");
  }
  const run = (cmd, args) => {
    if (cmd === "git") return Array(facts.length).fill(BODY_ID).join("\n") + "\n";
    if (args[0] === "query") return facts.map((ticket) => JSON.stringify(ticket)).join("\n") + "\n";
    if (args[0] === "ready") return JSON.stringify({ id: "work" }) + "\n";
    if (args[0] === "sync-plan") return "Plan is current\n";
    throw Error("unexpected command " + cmd + " " + args.join(" "));
  };
  const contract = customContract(), authoredOrder = [...contract.plan.currentIds];
  contract.tickets.tickets[0].status = "done";
  const file = customDashboard(t, contract).file;
  const refreshed = refreshCustomSnapshot(file, root, run, new Date("2026-09-03T00:00:00Z"));
  assert.deepEqual(refreshed.plan.currentIds, authoredOrder);
  assert.equal(refreshed.tickets.tickets.find((ticket) => ticket.id === "work-2").assignee, "worker-two");
  assert.doesNotMatch(readFileSync(file, "utf8"), /Fix <\/script> parsing/);
  const result = check(file, { repo: root, run });
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("custom contract rejects hidden decisions, oversized overview, incomplete history and terminal-plan leaks", (t) => {
  const cases = [
    ["Needs you ordering", (c) => { c.viewOrder.reverse(); }, /Needs you must be first/],
    ["more than five open entries", (c) => { c.overviewEntryIds = Array(6).fill("e2"); }, /overview may show at most five/],
    ["missing searchable history", (c) => { c.historySearchable = false; }, /searchable history must include every entry/],
    ["history omits overview entries", (c) => { c.historyEntryIds.pop(); }, /searchable history must include every entry/],
    ["missing complete ticket snapshot", (c) => { delete c.tickets; c.plan = { currentIds: [], historyIds: [] }; }, /custom contract needs a complete ticket snapshot/],
    ["completed ticket in current Plan", (c) => { c.plan.currentIds.push("complete"); c.plan.historyIds = []; }, /terminal tickets belong only in Plan history/],
    ["unfinished ticket hidden in Plan", (c) => { c.plan.currentIds = []; c.plan.historyIds.push("work"); }, /unfinished tickets must remain in the current Plan/],
  ];
  for (const [name, change, expected] of cases) {
    const contract = customContract();
    change(contract);
    const result = check(customDashboard(t, contract).file);
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join("\n"), expected, name);
  }
});

test("a repository comparison rejects authored ticket facts that differ from the full board", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard board "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  mkdirSync(join(root, "docs")); writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n| 1 | Work | open |\n");
  writeFileSync(join(root, ".tickets/1-work.md"), "---\nid: 1\ntitle: Work\nstatus: open\n---\nBody\n");
  const authoritative = { id: "1", title: "Work", status: "open", priority: "medium", blocked_by: [], tags: [] };
  const run = (cmd, args) => {
    if (cmd === "git") return BODY_ID + "\n";
    if (cmd !== "tkt") throw Error(`unexpected command ${cmd}`);
    if (args[0] === "query") return `${JSON.stringify(authoritative)}\n`;
    if (args[0] === "ready") return "";
    if (args[0] === "sync-plan") return "Plan is current\n";
    throw Error(`unexpected tkt command ${args[0]}`);
  };
  const file = dashboard(t, [], withTickets({ generated: "2026-09-02T00:00:00Z", frontier: [], executionOrder: ["1"], tickets: [{ ...authoritative, status: "done", body_id: BODY_ID }] })).file;
  const result = check(file, { repo: root, run });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /ticket facts differ from the authoritative board/);
});

test("a refreshed dashboard passes the full-board and maintained-plan comparison", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard current board "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  mkdirSync(join(root, "docs")); writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n| 1 | Work | open |\n");
  const source = "---\nid: 1\ntitle: Work\nstatus: open\n---\nBody\n";
  writeFileSync(join(root, ".tickets/1-work.md"), source);
  const ticket = { id: "1", title: "Work", status: "open", priority: "medium", blocked_by: [], tags: [], body_id: BODY_ID };
  const calls = [];
  const run = (cmd, args) => {
    calls.push([cmd, ...args]);
    if (cmd === "git") return BODY_ID + "\n";
    if (args[0] === "query") return `${JSON.stringify({ ...ticket, body_id: undefined })}\n`;
    if (args[0] === "ready") return `${JSON.stringify({ id: "1" })}\n`;
    if (args[0] === "sync-plan") return "Plan is current\n";
    throw Error(`unexpected command ${cmd} ${args.join(" ")}`);
  };
  const file = dashboard(t, [], withTickets({ generated: "2026-09-02T00:00:00Z", frontier: ["1"], executionOrder: ["1"], tickets: [ticket] })).file;
  const result = check(file, { repo: root, run });
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.ok(calls.some(([cmd, ...args]) => cmd === "tkt" && args.join(" ") === "query --all-context -o json"));
  assert.ok(calls.some(([cmd, ...args]) => cmd === "tkt" && args.join(" ") === "sync-plan --check --strict --brief"));
  assert.equal(calls.filter(([cmd, ...args]) => cmd === "git" && args.includes("hash-object")).length, 1);
  assert.ok(calls.some(([cmd, ...args]) => cmd === "git" && args.includes("--stdin-paths")));
});

test("serial claim preflight checks the full board and accepts its first eligible planned ticket", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard serial claim "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets")); mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n| candidate | Candidate | open |\n| later | Later | open |\n");
  for (const id of ["candidate", "later"]) writeFileSync(join(root, `.tickets/${id}.md`), `---\nid: ${id}\nstatus: open\n---\nBody\n`);
  const facts = [{ ...tk("candidate", "open"), priority: "medium", tags: [] }, { ...tk("later", "open"), priority: "medium", tags: [] }];
  const run = (cmd, args) => cmd === "git" ? [BODY_ID, BODY_ID].join("\n") + "\n" : args[0] === "query" ? facts.map((ticket) => JSON.stringify(ticket)).join("\n") + "\n" : args[0] === "ready" ? facts.map((ticket) => JSON.stringify({ id: ticket.id })).join("\n") + "\n" : "Plan is current\n";
  const config = (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, "$1" + JSON.stringify({ project: "Test", executionPolicy: { mode: "serial" } }) + "$2");
  const snapshotData = { generated: "2026-09-02T00:00:00Z", frontier: ["candidate", "later"], executionOrder: ["candidate", "later"], tickets: facts.map((ticket) => ({ ...ticket, body_id: BODY_ID })) };
  const file = dashboard(t, [], (html) => withTickets(snapshotData)(config(html))).file;
  const result = check(file, { repo: root, claim: "candidate", run });
  assert.equal(result.ok, true, result.errors.join("; "));
  const stale = check(file, { repo: root, claim: "later", run });
  assert.match(stale.errors.join("\n"), /not next; the first eligible planned ticket is candidate/);
});

test("a repository comparison preserves and rejects active tag context", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard context "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  mkdirSync(join(root, "docs")); writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n");
  writeFileSync(join(root, ".tickets/.context"), "build\n");
  const contextPath = join(root, ".tickets/.context");
  const file = dashboard(t, [], withTickets({ generated: null, frontier: [], tickets: [] })).file;
  const result = check(file, { repo: root, run: () => { throw Error("must not invoke tkt under active context"); } });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /tag context "build" is set/);
  assert.equal(readFileSync(contextPath, "utf8"), "build\n");
});

test("a repository comparison rejects stale body identities and missing board rows", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard stale "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  mkdirSync(join(root, "docs")); writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n| 1 | Work | open |\n");
  writeFileSync(join(root, ".tickets/1-work.md"), "---\nid: 1\ntitle: Work\nstatus: open\n---\nBody\n");
  const ticket = { id: "1", title: "Work", status: "open", priority: "medium", blocked_by: [], tags: [] };
  const run = (cmd, args) => {
    if (cmd === "git") return BODY_ID + "\n";
    if (args[0] === "query") return `${JSON.stringify(ticket)}\n`;
    if (args[0] === "ready") return `${JSON.stringify({ id: "1" })}\n`;
    if (args[0] === "sync-plan") return "Plan is current\n";
    throw Error(`unexpected command ${cmd} ${args.join(" ")}`);
  };
  const staleBody = { generated: "2026-09-02T00:00:00Z", frontier: ["1"], executionOrder: ["1"], tickets: [{ ...ticket, body_id: "b".repeat(40) }] };
  const noRows = { generated: "2026-09-02T00:00:00Z", frontier: ["1"], executionOrder: ["1"], tickets: [] };
  for (const [name, projection] of [["stale body", staleBody], ["missing ticket row", noRows]]) {
    const result = check(dashboard(t, [], withTickets(projection)).file, { repo: root, run });
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join("\n"), /ticket facts differ from the authoritative board/, name);
  }
});

test("a failed maintained-plan check makes the full comparison fail", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard plan drift "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  mkdirSync(join(root, "docs")); writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n| 1 | Work | open |\n");
  writeFileSync(join(root, ".tickets/1-work.md"), "---\nid: 1\ntitle: Work\nstatus: open\n---\nBody\n");
  const ticket = { id: "1", title: "Work", status: "open", priority: "medium", blocked_by: [], tags: [] };
  const run = (cmd, args) => {
    if (cmd === "git") return BODY_ID + "\n";
    if (args[0] === "query") return `${JSON.stringify(ticket)}\n`;
    if (args[0] === "ready") return `${JSON.stringify({ id: "1" })}\n`;
    if (args[0] === "sync-plan") throw Error("plan says open, tracker says done");
    throw Error(`unexpected command ${cmd} ${args.join(" ")}`);
  };
  const projection = { generated: "2026-09-02T00:00:00Z", frontier: ["1"], executionOrder: ["1"], tickets: [{ ...ticket, body_id: BODY_ID }] };
  const result = check(dashboard(t, [], withTickets(projection)).file, { repo: root, run });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /plan says open, tracker says done/);
});

test("a requested full comparison requires a valid ticket snapshot", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard no snapshot "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  const file = dashboard(t, [], (html) => html.replace(TICKETS, "")).file;
  const result = check(file, { repo: root, run: () => { throw Error("must not query with no snapshot"); } });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /full-board comparison requires a valid ticket snapshot/);
});

test("a malformed tracker markdown file cannot disappear from a complete-board read", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard malformed ticket "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  writeFileSync(join(root, ".tickets/140-broken.md"), "Ticket body without frontmatter\n");
  const file = dashboard(t, [], withTickets({ generated: null, frontier: [], tickets: [] })).file;
  const run = (cmd, args) => {
    if (args[0] === "query" || args[0] === "ready" || args[0] === "sync-plan") return "";
    throw Error(`unexpected command ${cmd} ${args.join(" ")}`);
  };
  const result = check(file, { repo: root, run });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /ticket file 140-broken\.md is missing YAML frontmatter/);
});

test("a ticket-shaped frontmatter document without an id cannot be treated as non-ticket Markdown", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard ticket missing id "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  writeFileSync(join(root, ".tickets/140-no-id.md"), "---\ntitle: Missing identifier\nstatus: open\n---\nBody\n");
  const file = dashboard(t, [], withTickets({ generated: null, frontier: [], tickets: [] })).file;
  const result = check(file, { repo: root, run: () => { throw Error("must not query after malformed ticket source"); } });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /ticket file 140-no-id\.md has no id in YAML frontmatter/);
});

test("README.md is the supported non-ticket Markdown file in .tickets", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm dashboard ticket readme "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".tickets"));
  mkdirSync(join(root, "docs")); writeFileSync(join(root, "docs/plan.md"), "| ID | Work | Status |\n| --- | --- | --- |\n");
  writeFileSync(join(root, ".tickets/README.md"), "Local tracker notes without a ticket ID.\n");
  const file = dashboard(t, [], withTickets({ generated: null, frontier: [], executionOrder: [], tickets: [] })).file;
  const run = (cmd, args) => {
    if (cmd === "tkt" && args[0] === "sync-plan") return "pass\n";
    if (args[0] === "query" || args[0] === "ready") return "";
    throw Error(`unexpected command ${cmd} ${args.join(" ")}`);
  };
  const result = check(file, { repo: root, run });
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("authored order deduplicates repeated plan rows without status-based renumbering", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gm plan order "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs/plan.md"), "intro\n| ID | Work | Status |\n| --- | --- | --- |\n| 4 | Fourth | open |\n| 2 | Second | done |\n\nMore prose\n| ID | Work | Status |\n| --- | --- | --- |\n| 2 | Repeated | open |\n| 8 | Eighth | backlog |\n");
  assert.deepEqual(authoredExecutionOrder(root), ["4", "2", "8"]);
  const snap = { executionOrder: authoredExecutionOrder(root), tickets: [tk("4", "open"), tk("2", "done"), tk("8", "backlog")] };
  snap.tickets[0].status = "done";
  assert.deepEqual(Array.from(api().executionSummary(snap).order), ["4", "2", "8"]);
});

test("execution projection keeps dependencies separate and chooses the first eligible sequenced ticket", () => {
  const snap = { executionOrder: ["child", "prereq", "later"], tickets: [tk("child", "open", ["prereq"]), tk("prereq", "open"), tk("later", "open")] };
  const flow = api().ticketFlow(snap);
  assert.equal(flow.execution.next, "prereq");
  assert.deepEqual(Array.from(flow.edges, (edge) => [edge.from, edge.to]), [["prereq", "child"]]);
  assert.deepEqual(Array.from(flow.layers[0], (ticket) => ticket.id), ["later", "prereq"]);
  assert.deepEqual(Array.from(flow.execution.route), ["prereq", "child", "later"]);
});

test("opt-in serial policy rejects multiple active tickets and invalid claims", (t) => {
  const config = (mode) => (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, "$1" + JSON.stringify({ project: "Test", executionPolicy: { mode } }) + "$2");
  const snap = { generated: null, frontier: [], executionOrder: ["one", "two", "later"], tickets: [tk("one", "in_progress"), tk("two", "in_progress"), tk("later", "backlog")] };
  const result = check(dashboard(t, [], (html) => withTickets(snap)(config("serial")(html))).file);
  assert.match(result.errors.join("\n"), /serial execution allows one in-progress ticket/);
  const claim = check(dashboard(t, [], (html) => withTickets({ ...snap, frontier: ["one", "two"], tickets: [tk("one", "open"), tk("two", "open", ["one"]), tk("later", "backlog")] })(config("serial")(html))).file, { claim: "two" });
  assert.match(claim.errors.join("\n"), /--claim requires --repo/);
  assert.match(claim.errors.join("\n"), /unfinished or missing prerequisites/);
  assert.match(claim.errors.join("\n"), /not next/);
});

test("execution policy reports malformed snapshots without throwing", (t) => {
  const config = (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, "$1" + JSON.stringify({ project: "Test", executionPolicy: { mode: "serial" } }) + "$2");
  const cases = [
    [{ generated: null, frontier: [], executionOrder: ["one"], tickets: [null] }, /ticket #0: id required/],
    [{ generated: null, frontier: [], executionOrder: ["one"], tickets: [tk("one", "open", "bad")] }, /blocked_by must be a list/],
    [{ generated: null, frontier: [null], executionOrder: ["one"], tickets: [tk("one", "open")] }, /frontier lists null/],
    [{ generated: null, frontier: [], executionOrder: ["one"], tickets: [{ id: "one", status: "unknown", blocked_by: [] }] }, /status must be one of/],
  ];
  for (const [snapshot, expected] of cases) {
    const file = dashboard(t, [], (html) => withTickets(snapshot)(config(html))).file;
    const result = check(file);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), expected);
    assert.match(result.errors.join("\n"), /structurally valid ticket snapshot/);
    assert.doesNotMatch(result.errors.join("\n"), /page script failed to load/);
    const claim = check(file, { claim: "one" });
    assert.equal(claim.ok, false);
    assert.match(claim.errors.join("\n"), /structurally valid ticket snapshot/);
    assert.doesNotMatch(claim.errors.join("\n"), /page script failed to load/);
  }
});

test("opt-in parallel policy requires distinct named active owners", (t) => {
  const config = (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, "$1" + JSON.stringify({ project: "Test", executionPolicy: { mode: "parallel" } }) + "$2");
  for (const [tickets, expected] of [
    [[{ ...tk("one", "in_progress") }, { ...tk("two", "in_progress"), assignee: "worker" }], /distinct nonempty assignee/],
    [[{ ...tk("one", "in_progress"), assignee: "worker" }, { ...tk("two", "in_progress"), assignee: "worker" }], /distinct assignees/],
  ]) {
    const result = check(dashboard(t, [], (html) => withTickets({ generated: null, frontier: [], executionOrder: ["one", "two"], tickets })(config(html))).file);
    assert.match(result.errors.join("\n"), expected);
  }
  const passes = check(dashboard(t, [], (html) => withTickets({ generated: null, frontier: [], executionOrder: ["one", "two"], tickets: [{ ...tk("one", "in_progress"), assignee: "alpha" }, { ...tk("two", "in_progress"), assignee: "beta" }] })(config(html))).file);
  assert.deepEqual(passes.errors, []);
});

test("incomplete dependency graphs are rejected while cycles fail flow projection", (t) => {
  const missing = check(dashboard(t, [], withTickets({ generated: null, frontier: [], tickets: [tk("child", "open", ["missing"])] })).file);
  assert.match(missing.errors.join("\n"), /blocker missing is not in the snapshot/);
  assert.throws(() => api().ticketFlow({ tickets: [tk("a", "open", ["b"]), tk("b", "open", ["a"])] }), /cycle/);
});

test("plan groups put open work first and layer it by unfinished blockers", () => {
  const { planGroups, planLanes, ticketMatches } = api();
  const snap = { frontier: ["4", "2"], tickets: [tk("1", "done"), tk("2", "open", ["1"]), tk("3", "open", ["2"]), tk("4", "open"), tk("5", "in_progress"), tk("6", "backlog"), tk("7", "open", ["6"]), tk("8", "open", ["99"])] };
  const g = planGroups(snap), ids = (l) => Array.from(l, (t) => t.id);
  assert.deepEqual(ids(g.ready), ["4", "2"], "ready follows the frontier order");
  assert.deepEqual(ids(g.blocked), ["3", "7", "8"], "a missing blocker still blocks");
  assert.deepEqual([ids(g.in_progress), ids(g.backlog), ids(g.done)], [["5"], ["6"], ["1"]]);
  assert.deepEqual(Array.from(planLanes(snap), ids), [["5", "4", "2"], ["3", "7", "8"]]);
  assert.deepEqual(snap.tickets.filter((t) => ticketMatches(t, { q: "ticket 4" }, {})).map((t) => t.id), ["4"]);
});

test("snapshot-tickets rewrites only the ticket block, escapes markup and refuses a scoped board", (t) => {
  const { file } = dashboard(t, [entry(1)]);
  const before = readFileSync(file, "utf8");
  const replies = { query: [{ id: "1", title: "Fix </script> parsing", status: "open", blocked_by: [], agents: [], assignee: "worker-one" }], ready: [{ id: "1" }], "sync-plan": [] };
  mkdirSync(join(dirname(file), ".tickets"), { recursive: true });
  writeFileSync(join(dirname(file), ".tickets/1-fixture.md"), "---\nid: 1\ntitle: Fixture\nstatus: open\n---\nBody\n");
  const run = (cmd, args) => cmd === "tkt" ? replies[args[0]].map((x) => JSON.stringify(x)).join("\n") + "\n" : BODY_ID + "\n";
  assert.deepEqual(snapshot(file, { repo: dirname(file), run, now: new Date("2026-09-02T00:00:00Z") }), { tickets: 1, frontier: 1, executionOrder: 0 });
  const after = readFileSync(file, "utf8");
  assert.equal(after.replace(TICKETS, ""), before.replace(TICKETS, ""));
  assert.doesNotMatch(after.match(TICKETS)[2], /<\/script>/);
  const snap = JSON.parse(after.match(TICKETS)[2]);
  assert.deepEqual(snap.tickets, [{ id: "1", title: "Fix </script> parsing", status: "open", blocked_by: [], tags: [], body_id: BODY_ID }]);
  assert.deepEqual(snap.executionOrder, []);
  assert.equal(check(file).ok, true);
  const parallelFile = dashboard(t, [], (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, "$1" + JSON.stringify({ project: "Test", executionPolicy: { mode: "parallel" } }) + "$2"));
  mkdirSync(join(dirname(parallelFile.file), ".tickets"), { recursive: true });
  writeFileSync(join(dirname(parallelFile.file), ".tickets/1-fixture.md"), "---\nid: 1\ntitle: Fixture\nstatus: in_progress\n---\nBody\n");
  snapshot(parallelFile.file, { repo: dirname(parallelFile.file), run });
  const parallel = JSON.parse(readFileSync(parallelFile.file, "utf8").match(TICKETS)[2]);
  assert.equal(parallel.tickets[0].assignee, "worker-one");
  mkdirSync(join(dirname(file), ".tickets"), { recursive: true });
  writeFileSync(join(dirname(file), ".tickets/.context"), "backend\n");
  assert.throws(() => snapshot(file, { repo: dirname(file), run }), /tag context "backend"/);
});

test("the template and the example share the same renderer", () => {
  const code = (h) => h.match(/<script>([\s\S]*?)<\/script>/g).pop();
  const example = readFileSync(join(SKILL, "assets/dashboard-example.html"), "utf8");
  assert.equal(code(example), code(TEMPLATE));
  assert.match(code(TEMPLATE), /text: "Ticket history"/);
  const style = (h) => h.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.equal(style(example), style(TEMPLATE));
});

test("the overview keeps five entries and the history keeps all of them", (t) => {
  const entries = Array.from({ length: 12 }, (_, i) => entry(i + 1)).reverse();
  const { file } = dashboard(t, entries);
  const r = run(file);
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.deepEqual(r.stats.logic, { overview: 5, history: 12, total: 12, plan: 0 });
});

test("search and filters narrow entries; an open ask is findable", (t) => {
  const ctx = { window: {} };
  vm.runInNewContext(TEMPLATE.match(/<script>([\s\S]*?)<\/script>/g).pop().replace(/<\/?script>/g, ""), ctx);
  const api = ctx.window.GMDashboard;
  const list = [
    entry(1, { title: "Saved progress works", workstreams: ["Learning"] }),
    entry(2, { kind: "decision", asks: [{ id: "a", status: "open", question: "Which layout?" }] }),
    entry(3, { workstreams: ["Planning"], details: "mentions Anki export" }),
  ];
  assert.deepEqual(list.filter((e) => api.matches(e, { q: "saved progress" })).map((e) => e.id), ["e1"]);
  assert.deepEqual(list.filter((e) => api.matches(e, { q: "anki" })).map((e) => e.id), ["e3"]);
  assert.deepEqual(list.filter((e) => api.matches(e, { kind: "decision" })).map((e) => e.id), ["e2"]);
  assert.deepEqual(list.filter((e) => api.matches(e, { stream: "Planning" })).map((e) => e.id), ["e3"]);
  assert.deepEqual(list.filter((e) => api.matches(e, { needs: true })).map((e) => e.id), ["e2"]);
  assert.equal(api.openAsks(list).length, 1);
  assert.equal(api.safeHref("javascript:alert(1)"), "#");
  assert.equal(api.safeHref("docs/a.md"), "docs/a.md");
});

const BAD = {
  "duplicate ids": [[entry(1), entry(1)], /duplicate id/],
  "a long headline": [[entry(1, { title: "x".repeat(120) })], /title is 120/],
  "too many changes": [[entry(1, { changes: ["a", "b", "c", "d"] })], /at most 3/],
  "an image without alt text": [[entry(1, { visual: { type: "image", src: "https://example.com/a.png" } })], /alt text/],
  "a missing local image": [[entry(1, { visual: { type: "image", src: "shots/nope.png", alt: "x" } })], /does not resolve/],
  "an open ask without a recommendation": [[entry(1, { asks: [{ id: "a", status: "open", question: "Q?", options: ["A", "B"] }] })], /needs a recommendation/],
  "a recommendation outside the options": [[entry(1, { asks: [{ id: "a", status: "open", question: "Q?", recommendation: "C", options: ["A", "B"] }] })], /must be one of its options/],
  "an unsafe link": [[entry(1, { links: [{ label: "x", href: "javascript:alert(1)" }] })], /unsafe link/],
  "a bad kind": [[entry(1, { kind: "party" })], /kind must be/],
  "a bad date": [[entry(1, { date: "yesterday" })], /date must be/],
  "a ticket entry without a visual": [[entry(1, { tickets: ["7"] })], /ticket entry needs a visual/],
  "a ticket with an unknown status": [[entry(1)], /status must be one of/, { generated: null, frontier: [], tickets: [tk("1", "doing")] }],
  "a frontier naming a closed ticket": [[entry(1)], /frontier lists 1/, { generated: null, frontier: ["1"], tickets: [tk("1", "done")] }],
  "a ticket block missing its arrays": [[entry(1)], /needs generated/, { tickets: [] }],
};
for (const [name, [entries, pattern, snap]] of Object.entries(BAD)) {
  test(`rejects ${name}`, (t) => {
    const r = run(dashboard(t, entries, snap ? withTickets(snap) : undefined).file);
    assert.equal(r.ok, false);
    assert.match(r.errors.join("\n"), pattern);
  });
}

test("rejects remote scripts, remote images and embedded media bloat", (t) => {
  let r = run(dashboard(t, [entry(1)], (h) => h.replace("</head>", '<script src="https://cdn.example.com/x.js"></script></head>')).file);
  assert.match(r.errors.join(), /remote resource/);
  r = run(dashboard(t, [entry(1, { visual: { type: "image", src: "https://example.com/a.png", alt: "x" } })]).file);
  assert.match(r.errors.join(), /remote image/);
  const blob = "data:image/png;base64," + "A".repeat(60 * 1024);
  r = run(dashboard(t, [entry(1)], (h) => h.replace("</style>", `</style><!-- ${blob} -->`)).file);
  assert.match(r.errors.join(), /embedded base64/);
});

test("accepts a relative image that exists and resolves it from the dashboard's folder", (t) => {
  const d = dashboard(t, [entry(1, { visual: { type: "image", src: "shots/a.png", alt: "Home screen" } })]);
  mkdirSync(join(d.dir, "shots"));
  writeFileSync(join(d.dir, "shots/a.png"), "x");
  assert.equal(run(d.file).ok, true);
});

test("warns when a headline carries process detail", (t) => {
  const r = run(dashboard(t, [entry(1, { title: "Closed ticket 88 and refactored web/src/app.ts" })]).file);
  assert.equal(r.ok, true);
  assert.match(r.warnings.join("\n"), /ticket id/);
  assert.match(r.warnings.join("\n"), /file path/);
  assert.match(r.warnings.join("\n"), /internal mechanics/);
  assert.equal(run(dashboard(t, [entry(1, { title: "Closed ticket 88" })]).file, { strict: true }).ok, false);
});

const activeReadinessIdentity = {
  product: "trailhead",
  platform: "ios",
  build: "2.4.0",
  channel: "stable",
  effectiveAudience: "beta20",
};

test("readiness summary identity rejects an old build and accepts repair", () => {
  const oldSummary = { ...activeReadinessIdentity, build: "2.3.0" };
  assert.deepEqual(compareReadinessIdentity(activeReadinessIdentity, oldSummary), {
    ok: false,
    errors: ["current summary build does not match active build"],
  });

  assert.deepEqual(compareReadinessIdentity(activeReadinessIdentity, { ...activeReadinessIdentity }), { ok: true, errors: [] });
});

test("readiness identity fails closed for missing, malformed, extra and different audience IDs", () => {
  const missing = { ...activeReadinessIdentity };
  delete missing.channel;
  assert.equal(compareReadinessIdentity(activeReadinessIdentity, missing).ok, false);
  assert.equal(compareReadinessIdentity(missing, { ...activeReadinessIdentity }).ok, false);

  const malformed = { ...activeReadinessIdentity, platform: "   " };
  assert.equal(compareReadinessIdentity(activeReadinessIdentity, malformed).ok, false);
  assert.equal(compareReadinessIdentity(malformed, { ...activeReadinessIdentity }).ok, false);

  const extra = { ...activeReadinessIdentity, deployment: "green" };
  assert.equal(compareReadinessIdentity(activeReadinessIdentity, extra).ok, false);
  assert.equal(compareReadinessIdentity(extra, { ...activeReadinessIdentity }).ok, false);

  const otherAudience = { ...activeReadinessIdentity, effectiveAudience: "beta21" };
  assert.deepEqual(compareReadinessIdentity(activeReadinessIdentity, otherAudience), {
    ok: false,
    errors: ["current summary effectiveAudience does not match active effectiveAudience"],
  });
});

test("strict rejects a stale ticket snapshot, then accepts its repair and dated history", (t) => {
  const progress = { type: "progress", label: "Route", done: 1, total: 2 };
  const entries = [
    entry(9, { date: "2026-09-09", tickets: ["1"], visual: progress }),
    entry(1, { date: "2026-08-01", kind: "learning" }),
  ];
  const snap = (generated) => withTickets({ generated, frontier: [], tickets: [tk("1", "done")] });
  const stale = run(dashboard(t, entries, snap("2026-09-01T00:00:00Z")).file, { strict: true });
  assert.equal(stale.ok, false);
  assert.match(stale.warnings.join("\n"), /predates the newest entry/);
  const repaired = run(dashboard(t, entries, snap("2026-09-10T00:00:00Z")).file, { strict: true });
  assert.equal(repaired.ok, true, repaired.errors.concat(repaired.warnings).join("; "));
  assert.equal(repaired.stats.entries, 2, "dated history remains valid");
});

test("the checker never modifies the dashboard", (t) => {
  const d = dashboard(t, [entry(1)]);
  const before = readFileSync(d.file, "utf8");
  run(d.file);
  assert.equal(readFileSync(d.file, "utf8"), before);
});

test("malformed data blocks produce errors, not a crash", (t) => {
  const d = dashboard(t, [entry(1)], (h) => h.replace(/(id="gm-entries">)[\s\S]*?(<\/script>)/, '$1[{"id": "a", "title": "tab\there"}$2'));
  const r = run(d.file);
  assert.equal(r.ok, false);
  assert.match(r.errors.join("\n"), /not valid JSON/);
});


test("remaining flow includes deferred work, complete counts and every visible edge", () => {
  const snap = { tickets: [tk("base", "done"), tk("one", "open", ["base"]), tk("two", "in_progress", ["one"]), tk("three", "open", ["two"]), tk("later", "backlog"), tk("other", "open")] };
  const flow = api().ticketFlow(snap), plain = (value) => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(flow.visible.map((ticket) => ticket.id)), ["one", "two", "three", "later", "other"]);
  assert.deepEqual(plain(flow.edges.map((edge) => edge.from + ">" + edge.to)), ["one>two", "two>three"]);
  assert.deepEqual(plain(flow.counts), { ready: 2, in_progress: 1, blocked: 1, backlog: 1, done: 0, cancelled: 0 });
  assert.deepEqual(plain(flow.relations("two")), { before: ["one", "base"], after: ["three"], waiting: ["one"] });
  const completed = api().ticketFlow(snap, { completed: true });
  assert.ok(completed.edges.some((edge) => edge.from === "base" && edge.satisfied));
});

test("a completed configured stream falls back without hiding work elsewhere", () => {
  const snap = { tickets: [{ ...tk("past", "done"), tags: ["archive"] }, { ...tk("next", "open"), tags: ["build"] }, tk("later", "backlog")] };
  const scopes = [{ id: "archive", label: "Archive", tags: ["archive"] }];
  const flow = api().ticketFlow(snap, { scopes, scope: "archive" });
  assert.equal(flow.scope, "all"); assert.equal(flow.fallback, true);
  assert.deepEqual(Array.from(flow.visible, (ticket) => ticket.id), ["next", "later"]);
  const context = api().ticketFlow(snap, { scopes, scope: "archive", completed: true });
  assert.deepEqual(Array.from(context.visible, (ticket) => ticket.id), ["past"]); assert.equal(context.elsewhere, 2);
});

test("flow keeps a missing prerequisite visible as waiting and rejects cycles", () => {
  const flow = api().ticketFlow({ tickets: [tk("visible", "open", ["missing"])] });
  assert.equal(flow.counts.blocked, 1); assert.deepEqual(Array.from(flow.relations("visible").waiting), ["missing"]);
  assert.throws(() => api().ticketFlow({ tickets: [tk("a", "open", ["b"]), tk("b", "done", ["a"])] }), /cycle/);
});

function flowDashboard(t, entries, edit = (html) => html) {
  const parent = resolve(SKILL, "../../..", ".scratch/t50-fixtures"); mkdirSync(parent, { recursive: true });
  const dir = mkdtempSync(join(parent, "fixture-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, "status.html"); writeFileSync(file, edit(TEMPLATE.replace(ENTRIES, `$1${JSON.stringify(entries)}$3`)));
  return { dir, file };
}

test("checker rejects malformed flow configuration and malformed tags", (t) => {
  for (const config of [{ scopes: [{ id: "all", label: "Duplicate", tags: ["x"] }] }, { scopes: [{ id: "build", label: "Build", tags: [] }] }, { defaultScope: "missing" }, { groupBy: "invented" }, { view: "invented" }]) {
    const d = flowDashboard(t, [], (html) => html.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/, "$1" + JSON.stringify({ project: "Fixture", ticketFlow: config }) + "$2"));
    assert.equal(check(d.file).ok, false);
  }
  const d = flowDashboard(t, [], withTickets({ generated: null, frontier: [], tickets: [{ ...tk("bad", "open"), tags: "build" }] }));
  assert.match(check(d.file).errors.join(";"), /tags must be/);
});


test("snapshot retains real ticket tags when the CLI omits them", (t) => {
  const d = flowDashboard(t, []); mkdirSync(join(d.dir, ".tickets"));
  writeFileSync(join(d.dir, ".tickets/one-a.md"), '---\nid: "one"\ntags: ["build", "review"]\n---\n');
  writeFileSync(join(d.dir, ".tickets/two-b.md"), '---\nid: "two"\ntags:\n  - "design"\n  - later\n---\n');
  const run = (cmd, args) => cmd === "git" ? [BODY_ID, BODY_ID].join("\n") + "\n" : args[0] === "query" ? [tk("one", "open"), tk("two", "backlog")].map((ticket) => JSON.stringify(ticket)).join("\n") : JSON.stringify({ id: "one" });
  snapshot(d.file, { repo: d.dir, run }); const snap = JSON.parse(readFileSync(d.file, "utf8").match(TICKETS)[2]);
  assert.deepEqual(snap.tickets.map((ticket) => ticket.tags), [["build", "review"], ["design", "later"]]);
});

test("planning gates stay separate from lifecycle, dependencies and deferred work", () => {
  const gate = { kind: "decision", reason: "Choose computed progress or stored status" };
  const snap = { frontier: ["next", "decide"], tickets: [
    { ...tk("decide", "open"), tags: ["relations"], gate },
    { ...tk("child", "open", ["decide"]), tags: ["docs"] },
    { ...tk("probe", "open"), gate: { kind: "evidence", reason: "Reproduce the cache request" } },
    { ...tk("later", "backlog"), gate },
    { ...tk("past", "done"), gate },
    { ...tk("next", "open"), tags: ["docs", "relations"] }
  ] };
  const flow = api().ticketFlow(snap, { scopes: [{ id: "docs", label: "Guidance", tags: ["docs"] }, { id: "rel", label: "Relations", tags: ["relations"] }] });
  assert.deepEqual(JSON.parse(JSON.stringify(flow.readiness)), { ready: 1, in_progress: 0, blocked: 1, decision: 1, evidence: 1, backlog: 1, done: 0, cancelled: 0 });
  assert.deepEqual(Array.from(flow.groups, (g) => [g.label, Array.from(g.tickets, (t) => t.id)]), [["Guidance", ["next", "child"]], ["Relations", ["decide"]], ["Other work", ["probe", "later"]]]);
  assert.ok(flow.edges.some((edge) => edge.from === "decide" && edge.to === "child"));
  assert.deepEqual(Array.from(flow.relations("child").before), ["decide"]);
  assert.equal(api().flowState(snap.tickets.find((t) => t.id === "past"), flow.index), "done");
  assert.equal(snap.tickets[0].status, "open");
});

test("snapshot derives planning gates from ticket notes and rejects ambiguous gates before writing", (t) => {
  const d = flowDashboard(t, []); mkdirSync(join(d.dir, ".tickets"));
  const ticket = join(d.dir, ".tickets/one-a.md");
  writeFileSync(ticket, '---\nid: "one"\ntags: ["build", "gate:decision"]\n---\n\n## Planning gate\n\nChoose the close policy.\n');
  const run = (cmd, args) => cmd === "git" ? BODY_ID + "\n" : args[0] === "query" ? JSON.stringify(tk("one", "open")) : JSON.stringify({ id: "one" });
  snapshot(d.file, { repo: d.dir, run });
  const snap = JSON.parse(readFileSync(d.file, "utf8").match(TICKETS)[2]);
  assert.deepEqual(snap.tickets[0].gate, { kind: "decision", reason: "Choose the close policy." });
  const before = readFileSync(d.file, "utf8");
  writeFileSync(ticket, '---\nid: "one"\ntags: ["gate:decision", "gate:evidence"]\n---\n');
  assert.throws(() => snapshot(d.file, { repo: d.dir, run }), /conflicting planning gates/);
  assert.equal(readFileSync(d.file, "utf8"), before);
  writeFileSync(ticket, '---\nid: "one"\ntags: ["gate:decision"]\n---\n');
  assert.throws(() => snapshot(d.file, { repo: d.dir, run }), /needs a ## Planning gate/);
  assert.equal(readFileSync(d.file, "utf8"), before);
});

test("checker rejects malformed planning-gate data", (t) => {
  for (const gate of [null, { kind: "decision", reason: "" }, { kind: "unknown", reason: "test" }]) {
    const d = flowDashboard(t, [], withTickets({ generated: null, frontier: [], tickets: [{ ...tk("one", "open"), gate }] }));
    assert.match(check(d.file).errors.join(";"), /gate needs decision or evidence/);
  }
});

// Ticket 134: on Windows the CLI entry guards compared against URL.pathname (/D:/...), never
// matched, and exited 0 with no output, so the skill's own check step passed every dashboard.
test("checker and snapshot CLIs run as commands", (t) => {
  const scripts = join(SKILL, "scripts");
  const d = flowDashboard(t, [], withTickets({ generated: null, frontier: [], tickets: [{ ...tk("bad", "open"), tags: "build" }] }));
  const checked = spawnSync(process.execPath, [join(scripts, "check-dashboard.mjs"), d.file], { cwd: tmpdir(), encoding: "utf8" });
  assert.equal(checked.status, 1, checked.stdout + checked.stderr);
  assert.match(checked.stdout, /tags must be/);
  const usage = spawnSync(process.execPath, [join(scripts, "snapshot-tickets.mjs")], { cwd: tmpdir(), encoding: "utf8" });
  assert.equal(usage.status, 2, usage.stdout + usage.stderr);
  assert.match(usage.stderr, /usage: snapshot-tickets/);
});
