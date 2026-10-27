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
import { check } from "../skills/productivity/delivery-dashboard/scripts/check-dashboard.mjs";

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "../skills/productivity/delivery-dashboard");
const TEMPLATE = readFileSync(join(SKILL, "assets/dashboard-template.html"), "utf8");
const ENTRIES = /(<script type="application\/json" id="gm-entries">)([\s\S]*?)(<\/script>)/;

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
const run = (file, opts) => check(file, opts);

test("the shipped template passes, and strict mode flags its example entries", (t) => {
  const f = join(SKILL, "assets/dashboard-template.html");
  const r = run(f);
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.match(r.warnings.join(), /template example/);
  assert.equal(run(f, { strict: true }).ok, false);
});

test("the overview keeps five entries and the history keeps all of them", (t) => {
  const entries = Array.from({ length: 12 }, (_, i) => entry(i + 1)).reverse();
  const { file } = dashboard(t, entries);
  const r = run(file);
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.deepEqual(r.stats.logic, { overview: 5, history: 12, total: 12 });
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
};
for (const [name, [entries, pattern]] of Object.entries(BAD)) {
  test(`rejects ${name}`, (t) => {
    const r = run(dashboard(t, entries).file);
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

test("the checker never modifies the dashboard", (t) => {
  const d = dashboard(t, [entry(1)]);
  const before = readFileSync(d.file, "utf8");
  run(d.file);
  assert.equal(readFileSync(d.file, "utf8"), before);
});
