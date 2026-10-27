#!/usr/bin/env node
// probe-critic-model.mjs: check, per installed harness, that a critic's model can be pinned and
// proven, and report whether it runs at, below or off the ceiling. Evidence comes from each
// harness's own record (Claude Code `modelUsage`, a Codex rollout's turn_context, an opencode
// export), never from the model describing itself. Kiro CLI keeps no record, so its result is
// "requested, unverified".
//
// Usage: node scripts/probe-critic-model.mjs [--harness claude,codex,kiro,opencode] [--json]
//          [--timeout <seconds>] [--ceiling harness=model ...]
// Each harness costs one tiny model call plus one rejected-model call. Exit 0 when every probed
// harness is `ok`, 1 when any is below ceiling, unverified, unavailable or not authenticated.
// Proposal 14 (spike) and docs/agents/harnesses.md#critic-model hold the reasoning and recipes.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

export const CEILINGS = {
  claude: "opus",
  codex: "gpt-6.1-sol",
  kiro: "claude-opus-5-5",
  opencode: "zai-coding-plan/glm-5.3",
};
// Kiro offers no alias, so the probe picks the strongest Claude it lists, in this order.
const KIRO_ORDER = ["claude-opus-5-5", "claude-opus-5", "claude-opus-4.8", "claude-opus-4.7", "claude-opus-4.6", "claude-opus-4.5"];
const PROMPT = "Reply with exactly: OK";
const AUTH = /authenticat|oauth|refresh token|sign in again|log ?in|log out and sign|401|expired|unauthori[sz]ed/i;

const run = (cmd, args, { cwd, timeout, env } = {}) => {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: (timeout ?? 60) * 1000, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  return { code: r.error ? 127 : r.status ?? 1, out: r.stdout ?? "", err: r.stderr ?? "", missing: r.error?.code === "ENOENT", timedOut: r.error?.code === "ETIMEDOUT" };
};
const lines = (s) => s.split(/\r?\n/).filter((l) => l.trim().startsWith("{")).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const version = (cmd) => { const r = run(cmd, ["--version"], { timeout: 10 }); return r.missing ? null : (r.out.trim().split("\n")[0] || null).replace(/\s*\(.*$/, ""); };
const classify = (r) => (AUTH.test(r.out + r.err) ? "not-authenticated" : r.timedOut ? "timed-out" : "failed");

// Each adapter returns { status, recorded, effort, evidence, note } for the pinned call.
const adapters = {
  claude(model, ctx) {
    const r = run("claude", ["-p", PROMPT, "--model", model, "--effort", "high", "--output-format", "json", "--no-session-persistence"], ctx);
    let d; try { d = JSON.parse(r.out); } catch { return { status: classify(r), note: (r.err || r.out).slice(0, 160) }; }
    if (d.is_error) return { status: AUTH.test(String(d.result)) ? "not-authenticated" : "failed", note: String(d.result).slice(0, 160) };
    const ran = Object.keys(d.modelUsage ?? {});
    return ran.length ? { status: "ran", recorded: ran.join(","), effort: "high (requested)", evidence: "modelUsage" } : { status: "unverified", note: "no modelUsage in the result" };
  },
  codex(model, ctx) {
    const r = run("codex", ["exec", "-m", model, "-c", "model_reasoning_effort=high", "--json", "--skip-git-repo-check", "-s", "read-only", PROMPT], ctx);
    const ev = lines(r.out);
    const failed = ev.find((e) => e.type === "turn.failed" || (e.type === "error" && e.message));
    if (r.code !== 0 || failed) return { status: classify({ ...r, out: r.out + JSON.stringify(failed ?? "") }), note: JSON.stringify(failed ?? r.err).slice(0, 160) };
    const tid = ev.find((e) => e.type === "thread.started")?.thread_id;
    const home = ctx.env?.CODEX_HOME || process.env.CODEX_HOME || join(homedir(), ".codex");
    const file = tid && findRollout(join(home, "sessions"), tid);
    if (!file) return { status: "unverified", note: "no rollout file for the thread" };
    const tc = readFileSync(file, "utf8").split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((e) => e?.type === "turn_context").pop();
    return tc?.payload?.model ? { status: "ran", recorded: tc.payload.model, effort: tc.payload.effort, evidence: "rollout turn_context" } : { status: "unverified", note: "rollout has no turn_context" };
  },
  opencode(model, ctx) {
    const r = run("opencode", ["run", "-m", model, "--variant", "high", "--format", "json", PROMPT], ctx);
    const ev = lines(r.out);
    const err = ev.find((e) => e.type === "error");
    if (r.code !== 0 || err) return { status: classify({ ...r, out: r.out }), note: JSON.stringify(err?.error ?? r.err).slice(0, 160) };
    const sid = ev.find((e) => e.sessionID)?.sessionID;
    const x = sid && run("opencode", ["export", sid], ctx);
    let msg; try { msg = JSON.parse(x.out).messages.map((m) => m.info).filter((i) => i.role === "assistant").pop(); } catch { /* fall through */ }
    return msg?.modelID ? { status: "ran", recorded: `${msg.providerID}/${msg.modelID}`, effort: msg.variant, evidence: "opencode export" } : { status: "unverified", note: "export has no assistant message" };
  },
  kiro(model, ctx) {
    const r = run("kiro-cli", ["chat", "--no-interactive", "--model", model, "--effort", "high", "--trust-tools=fs_read", PROMPT], ctx);
    if (r.code !== 0) return { status: classify(r), note: (r.err || r.out).replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").trim().slice(0, 160) };
    return { status: "unverified", recorded: model, effort: "high (requested)", evidence: "none: Kiro keeps no model record", note: "requested, unverified" };
  },
};

function findRollout(dir, tid) {
  if (!existsSync(dir)) return null;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { const f = findRollout(p, tid); if (f) return f; }
    else if (e.name.includes(tid) && e.name.endsWith(".jsonl")) return p;
  }
  return null;
}

// Does the harness refuse a model it does not have, instead of substituting one?
function refuses(h, ctx) {
  const bogus = "gpt-9-no-such-model";
  const args = { claude: ["-p", PROMPT, "--model", "claude-no-such-model-9", "--output-format", "json", "--no-session-persistence"],
    codex: ["exec", "-m", bogus, "--json", "--skip-git-repo-check", "--ephemeral", "-s", "read-only", PROMPT],
    opencode: ["run", "-m", "zai-coding-plan/no-such-model-9", "--format", "json", PROMPT],
    kiro: ["chat", "--no-interactive", "--model", "no-such-model-9", PROMPT] }[h];
  const cmd = h === "kiro" ? "kiro-cli" : h;
  const r = run(cmd, args, ctx);
  if (AUTH.test(r.out + r.err) && r.code !== 0) return "not-tested: not authenticated";
  if (h === "claude") { try { if (JSON.parse(r.out).is_error) return "pass"; } catch { /* below */ } }
  return r.code !== 0 ? "pass" : "FAIL: the harness accepted a model that does not exist";
}

function kiroPick(ctx) {
  const r = run("kiro-cli", ["chat", "--list-models"], ctx);
  const have = new Set([...r.out.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").matchAll(/^\s*\*?\s*(claude-[\w.-]+)/gm)].map((m) => m[1]));
  return { chosen: KIRO_ORDER.find((m) => have.has(m)) ?? [...have].sort().pop() ?? null, have: [...have] };
}

export function probe(harness, { ceilings = CEILINGS, timeout = 60 } = {}) {
  const cmd = harness === "kiro" ? "kiro-cli" : harness;
  const v = version(cmd);
  if (!v) return { harness, status: "unavailable", note: `${cmd} is not on PATH` };
  const dir = mkdtempSync(join(tmpdir(), `gm-critic-${harness}-`));
  const ctx = { cwd: dir, timeout };
  try {
    let requested = ceilings[harness];
    let picked = null;
    if (harness === "kiro") { picked = kiroPick(ctx); if (!picked.chosen) return { harness, version: v, status: "unavailable", note: "no Claude model in `kiro-cli chat --list-models`" }; requested = picked.chosen; }
    const res = adapters[harness](requested, ctx);
    const rec = { harness, version: v, ceiling: ceilings[harness], requested, ...res };
    if (res.status === "ran") {
      const wanted = harness === "kiro" ? ceilings.kiro : ceilings[harness];
      const atCeiling = harness === "claude" ? /^claude-opus-5-5/.test(res.recorded) : harness === "kiro" ? requested === wanted : res.recorded.endsWith(wanted);
      rec.level = atCeiling ? "at ceiling" : "below ceiling";
      rec.status = atCeiling ? "ok" : "below-ceiling";
    } else if (res.status === "unverified") {
      const wanted = ceilings[harness];
      rec.level = (res.recorded && (res.recorded === wanted || res.recorded.endsWith(wanted)) ? "at ceiling" : res.recorded ? "below ceiling" : "level unknown") + " (model unverified)";
    }
    rec.refusesMissingModel = refuses(harness, ctx);
    return rec;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const a = process.argv.slice(2);
  const opt = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; };
  const ceilings = { ...CEILINGS };
  a.forEach((x, i) => { if (x === "--ceiling") { const [h, m] = a[i + 1].split("="); ceilings[h] = m; } });
  const harnesses = (opt("--harness") ?? "claude,codex,kiro,opencode").split(",");
  const results = harnesses.map((h) => probe(h, { ceilings, timeout: Number(opt("--timeout") ?? 60) }));
  if (a.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else for (const r of results) console.log(`${r.harness.padEnd(9)} ${r.status.padEnd(18)} ${[r.version, r.recorded && `ran on ${r.recorded}`, r.effort && `effort ${r.effort}`, r.level, r.refusesMissingModel && `missing-model: ${r.refusesMissingModel}`, r.note].filter(Boolean).join(" · ")}`);
  process.exit(results.every((r) => r.status === "ok") ? 0 : 1);
}
