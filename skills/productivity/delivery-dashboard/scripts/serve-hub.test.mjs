#!/usr/bin/env node
// Tests for serve-hub.mjs: multi-project discovery, sorting, strict allowlist security,
// zero-restart live updates, and method/traversal rejection.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHubServer, evaluateTailscaleAuth, resolveProjectUrls } from "./serve-hub.mjs";

const SERVE_HUB = fileURLToPath(new URL("./serve-hub.mjs", import.meta.url));

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

test("serve-hub resolves project URLs from hub.json and degrades cleanly when missing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "gm-hub-cfg-"));
  try {
    const repo = join(dir, "my-app");
    mkdirSync(repo, { recursive: true });
    const cfgPath = join(dir, "hub.json");
    writeFileSync(cfgPath, JSON.stringify({
      baseUrl: "https://box.tailnet.ts.net/",
      lanUrl: "http://192.168.0.10:8765/",
      mdnsUrl: "http://box.local:8765",
    }));

    const resolved = await resolveProjectUrls(repo, { hash: "#decisions", configPath: cfgPath });
    assert.deepEqual(resolved, {
      configured: true,
      slug: "my-app",
      hub: {
        baseUrl: "https://box.tailnet.ts.net/",
        lanUrl: "http://192.168.0.10:8765/",
        mdnsUrl: "http://box.local:8765/",
      },
      urls: {
        baseUrl: "https://box.tailnet.ts.net/my-app/docs/status.html#decisions",
        lanUrl: "http://192.168.0.10:8765/my-app/docs/status.html#decisions",
        mdnsUrl: "http://box.local:8765/my-app/docs/status.html#decisions",
      },
    });

    const cliOut = JSON.parse(execFileSync(process.execPath, [SERVE_HUB, "--url", repo, "--hash", "overview", "--config", cfgPath], { encoding: "utf8" }));
    assert.equal(cliOut.urls.baseUrl, "https://box.tailnet.ts.net/my-app/docs/status.html#overview");

    const missing = await resolveProjectUrls("my-app", { configPath: join(dir, "nope.json") });
    assert.equal(missing, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("serve-hub Tailscale inbox enforces loopback, identity, origin, size, and writes outside repo", async () => {
  // Non-loopback LAN socket cannot spoof Tailscale-User-Login.
  const spoofedLan = evaluateTailscaleAuth(
    { socket: { remoteAddress: "192.168.0.50" }, headers: { "tailscale-user-login": "owner@example.com" } },
    { allowedUsers: ["owner@example.com"] },
  );
  assert.equal(spoofedLan.viaTailscale, false);
  assert.equal(spoofedLan.userAllowed, false);

  const root = mkdtempSync(join(tmpdir(), "gm-hub-inbox-root-"));
  const inboxDir = mkdtempSync(join(tmpdir(), "gm-hub-inbox-state-"));
  const cfgPath = join(inboxDir, "hub.json");
  try {
    mkdirSync(join(root, "beta", "docs"), { recursive: true });
    const originalHtml = makeDashboard({
      project: "Beta",
      decisions: [{ id: "d1", question: "Ship mobile inbox?", status: "open" }],
    });
    writeFileSync(join(root, "beta", "docs", "status.html"), originalHtml);
    writeFileSync(cfgPath, JSON.stringify({
      baseUrl: "https://box.tailnet.ts.net",
      inbox: { enabled: true, dir: inboxDir, allowedUsers: ["owner@example.com"] },
    }));

    const server = createHubServer({
      roots: [root],
      baseUrl: "https://box.tailnet.ts.net",
      inbox: { enabled: true, dir: inboxDir, allowedUsers: ["owner@example.com"] },
    });
    await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;
    try {
      // Without Tailscale identity header: status says not writable, HTML not injected, POST rejected 403.
      const stPlain = await (await fetch(`${base}/api/inbox/status`)).json();
      assert.equal(stPlain.enabled, true);
      assert.equal(stPlain.writable, false);
      const htmlPlain = await (await fetch(`${base}/beta/docs/status.html`)).text();
      assert.doesNotMatch(htmlPlain, /\/_hub\/inbox\.js/);
      assert.equal((await fetch(`${base}/api/inbox/beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://box.tailnet.ts.net" },
        body: JSON.stringify({ text: "Decisions for Beta" }),
      })).status, 403);

      // Disallowed Tailscale login -> 403.
      assert.equal((await fetch(`${base}/api/inbox/beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://box.tailnet.ts.net", "Tailscale-User-Login": "other@example.com" },
        body: JSON.stringify({ text: "Decisions for Beta" }),
      })).status, 403);

      // Cross-origin CSRF attempt -> 403.
      assert.equal((await fetch(`${base}/api/inbox/beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example", "Tailscale-User-Login": "owner@example.com" },
        body: JSON.stringify({ text: "Decisions for Beta" }),
      })).status, 403);

      // Non-JSON content-type -> 415; unknown slug -> 404; oversized body -> 413.
      assert.equal((await fetch(`${base}/api/inbox/beta`, {
        method: "POST",
        headers: { "Content-Type": "text/plain", Origin: "https://box.tailnet.ts.net", "Tailscale-User-Login": "owner@example.com" },
        body: "plain",
      })).status, 415);
      assert.equal((await fetch(`${base}/api/inbox/unknown`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://box.tailnet.ts.net", "Tailscale-User-Login": "owner@example.com" },
        body: JSON.stringify({ text: "Decisions" }),
      })).status, 404);
      assert.equal((await fetch(`${base}/api/inbox/beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://box.tailnet.ts.net", "Tailscale-User-Login": "owner@example.com" },
        body: JSON.stringify({ text: "x".repeat(40000) }),
      })).status, 413);

      // Authenticated Tailscale GET injects progressive client script (without touching disk).
      const htmlTs = await (await fetch(`${base}/beta/docs/status.html`, {
        headers: { "Tailscale-User-Login": "owner@example.com" },
      })).text();
      assert.match(htmlTs, /<script src="\/_hub\/inbox\.js" defer><\/script><\/body>/);
      assert.equal((await fetch(`${base}/_hub/inbox.js`)).status, 200);

      // Valid Tailscale POST succeeds -> 201 and CLI reads & archives it.
      const okRes = await fetch(`${base}/api/inbox/beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://box.tailnet.ts.net", "Tailscale-User-Login": "owner@example.com" },
        body: JSON.stringify({ project: "Beta", text: "Decisions for Beta\n\n1. Ship mobile inbox?\nChoice: Yes" }),
      });
      assert.equal(okRes.status, 201);
      const okBody = await okRes.json();
      assert.equal(okBody.ok, true);
      assert.equal(okBody.slug, "beta");

      const inboxRead = JSON.parse(execFileSync(process.execPath, [SERVE_HUB, "--inbox", "beta", "--config", cfgPath], { encoding: "utf8" }));
      assert.equal(inboxRead.projects[0].pendingCount, 1);
      assert.match(inboxRead.projects[0].items[0].content, /submitted_by: "owner@example\.com"/);
      assert.match(inboxRead.projects[0].items[0].content, /Ship mobile inbox\?/);

      const cleared = JSON.parse(execFileSync(process.execPath, [SERVE_HUB, "--inbox", join(root, "beta"), "--clear", "--config", cfgPath], { encoding: "utf8" }));
      assert.equal(cleared.cleared, 1);
      const afterClear = JSON.parse(execFileSync(process.execPath, [SERVE_HUB, "--inbox", join(root, "beta"), "--config", cfgPath], { encoding: "utf8" }));
      assert.equal(afterClear.projects[0].pendingCount, 0);

      // --wait times out cleanly with exit 124 when nothing arrives.
      const timeoutExit = await new Promise((resolveDone) => {
        const child = spawn(process.execPath, [SERVE_HUB, "--wait", join(root, "beta"), "--timeout", "0.2", "--config", cfgPath], { stdio: ["ignore", "pipe", "pipe"] });
        let out = "";
        child.stdout.on("data", (d) => { out += d; });
        child.on("close", (code) => resolveDone({ code, out }));
      });
      assert.equal(timeoutExit.code, 124);
      assert.equal(JSON.parse(timeoutExit.out).timedOut, true);

      // --wait wakes up immediately when a live Tailscale POST arrives.
      const waitChild = spawn(process.execPath, [SERVE_HUB, "--wait", join(root, "beta"), "--timeout", "5", "--config", cfgPath], { stdio: ["ignore", "pipe", "pipe"] });
      let waitOut = "";
      waitChild.stdout.on("data", (d) => { waitOut += d; });
      const waitDone = new Promise((resolveDone) => waitChild.on("close", (code) => resolveDone(code)));
      await new Promise((r) => setTimeout(r, 120));
      const livePost = await fetch(`${base}/api/inbox/beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://box.tailnet.ts.net", "Tailscale-User-Login": "owner@example.com" },
        body: JSON.stringify({ project: "Beta", text: "Decisions for Beta\n\n1. Wake test?\nChoice: Yes" }),
      });
      assert.equal(livePost.status, 201);
      assert.equal(await waitDone, 0);
      const waitJson = JSON.parse(waitOut);
      assert.equal(waitJson.ok, true);
      assert.equal(waitJson.timedOut, false);
      assert.match(waitJson.items[0].content, /Wake test\?/);

      // --wait also returns immediately if an unread submission is already waiting.
      const immediateOut = JSON.parse(execFileSync(process.execPath, [SERVE_HUB, "--wait", "beta", "--timeout", "1", "--config", cfgPath], { encoding: "utf8" }));
      assert.equal(immediateOut.ok, true);
      assert.equal(immediateOut.items.length, 1);
    } finally {
      await new Promise((ok) => server.close(ok));
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(inboxDir, { recursive: true, force: true });
  }
});
