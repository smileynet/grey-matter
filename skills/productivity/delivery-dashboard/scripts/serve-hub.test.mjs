#!/usr/bin/env node
// Tests for serve-hub.mjs: multi-project discovery, sorting, strict allowlist security,
// zero-restart live updates, and method/traversal rejection.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHubServer } from "./serve-hub.mjs";

function makeDashboard({ project, decisions = [], entries = [], tickets = [] }) {
  return `<!doctype html><html><body>
<script type="application/json" id="gm-config">${JSON.stringify({ project, decisions })}</script>
<script type="application/json" id="gm-entries">${JSON.stringify(entries)}</script>
<script type="application/json" id="gm-tickets">${JSON.stringify({ tickets })}</script>
</body></html>`;
}

async function withHub(setup, fn) {
  const root = mkdtempSync(join(tmpdir(), "gm-hub-"));
  const outside = mkdtempSync(join(tmpdir(), "gm-hub-outside-"));
  try {
    setup({ root, outside });
    const server = createHubServer({ roots: [root] });
    await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;
    try { await fn({ root, outside, base }); }
    finally { await new Promise((ok) => server.close(ok)); }
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
}

test("serve-hub discovers projects, sorts open decisions first, and serves allowlisted assets only", async () => {
  await withHub(({ root, outside }) => {
    mkdirSync(join(root, "alpha", "docs", "shots"), { recursive: true });
    mkdirSync(join(root, "alpha", ".git"), { recursive: true });
    writeFileSync(join(root, "alpha", ".git", "config"), "[core]\n");
    writeFileSync(join(root, "alpha", ".env"), "SECRET=1\n");
    writeFileSync(join(root, "alpha", "README.md"), "unlinked\n");
    writeFileSync(join(root, "alpha", "docs", "shots", "demo.svg"), "<svg/>");
    writeFileSync(join(outside, "secret.txt"), "top-secret");
    symlinkSync(join(outside, "secret.txt"), join(root, "alpha", "docs", "escape.txt"));
    writeFileSync(join(root, "alpha", "docs", "status.html"), makeDashboard({
      project: "Alpha",
      entries: [{ id: "1", date: "2026-11-25", title: "Shipped A", visual: { type: "image", src: "shots/demo.svg" }, links: [{ href: "escape.txt" }] }],
      tickets: [{ id: "1", status: "open", blocked_by: [] }],
    }));

    mkdirSync(join(root, "beta", "docs"), { recursive: true });
    writeFileSync(join(root, "beta", "docs", "status.html"), makeDashboard({
      project: "Beta",
      decisions: [{ id: "d1", question: "Pick architecture?", status: "open" }],
      tickets: [{ id: "2", status: "in_progress", blocked_by: [] }],
    }));
  }, async ({ root, base }) => {
    const idx = await fetch(`${base}/`);
    assert.equal(idx.status, 200);
    assert.equal(idx.headers.get("cache-control"), "no-store");
    const html = await idx.text();
    assert.ok(html.indexOf("Beta") < html.indexOf("Alpha"), "project with open decision sorts first");
    assert.match(html, /Pick architecture\?/);

    const api = await (await fetch(`${base}/api/projects.json`)).json();
    assert.deepEqual(api.projects.map((p) => [p.slug, p.openDecisions, p.ready, p.inProgress]), [
      ["beta", 1, 0, 1],
      ["alpha", 0, 1, 0],
    ]);
    assert.ok(api.projects.every((p) => !("root" in p) && p.url === `/${p.slug}/docs/status.html`), "API exposes route URL without leaking host filesystem paths");

    // Allowlisted dashboard and linked asset succeed; redirect works.
    const redir = await fetch(`${base}/alpha`, { redirect: "manual" });
    assert.equal(redir.status, 302);
    assert.equal(redir.headers.get("location"), "/alpha/docs/status.html");
    assert.equal((await fetch(`${base}/alpha/docs/status.html`)).status, 200);
    assert.equal((await fetch(`${base}/alpha/docs/shots/demo.svg`)).status, 200);

    // Security blocks: .git, .env, unlinked files, traversal, symlink escape, mutations.
    for (const bad of [
      "/alpha/.git/config",
      "/alpha/.env",
      "/alpha/README.md",
      "/alpha/docs/escape.txt",
      "/alpha/docs/../../alpha/.env",
      "/missing/docs/status.html",
    ]) {
      assert.equal((await fetch(`${base}${bad}`)).status, 404, `expected 404 for ${bad}`);
    }
    for (const method of ["POST", "PUT", "DELETE"]) {
      assert.equal((await fetch(`${base}/alpha/docs/status.html`, { method })).status, 405);
    }

    // Zero-restart live discovery when a new repo adds docs/status.html.
    mkdirSync(join(root, "gamma", "docs"), { recursive: true });
    writeFileSync(join(root, "gamma", "docs", "status.html"), makeDashboard({ project: "Gamma" }));
    const refreshed = await (await fetch(`${base}/api/projects.json`)).json();
    assert.ok(refreshed.projects.some((p) => p.slug === "gamma"), "new project appears without restart");
  });
});
