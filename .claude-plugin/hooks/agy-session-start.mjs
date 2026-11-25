#!/usr/bin/env node
// Self-contained Antigravity (agy) SessionStart notice hook.
// Reads unseen or error notices from $AGENT_SYNC_STATE_DIR/notices/*.json.
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function resolveStateDir() {
  if (process.env.AGENT_SYNC_STATE_DIR) return process.env.AGENT_SYNC_STATE_DIR;
  const xdg = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(xdg, "agent-sync");
}

function readJsonSafe(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(path, value) {
  mkdirSync(join(path, ".."), { recursive: true });
  const tmp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
  renameSync(tmp, path);
}

function collectNotices(harness) {
  const stateDir = resolveStateDir();
  const noticesDir = join(stateDir, "notices");
  if (!existsSync(noticesDir)) return null;
  let files = [];
  try {
    files = readdirSync(noticesDir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return null;
  }
  if (!files.length) return null;

  const seenPath = join(stateDir, "seen.json");
  const seen = readJsonSafe(seenPath, {});
  const harnessSeen = (seen[harness] && typeof seen[harness] === "object") ? seen[harness] : {};
  const ackedErrors = (seen.ackedErrors && typeof seen.ackedErrors === "object") ? seen.ackedErrors : {};

  const due = [];
  for (const file of files) {
    const notice = readJsonSafe(join(noticesDir, file), null);
    if (!notice || typeof notice.pack !== "string" || typeof notice.id !== "string" || typeof notice.summary !== "string") continue;
    const isError = notice.severity === "error" && ackedErrors[notice.pack] !== notice.id;
    if (harnessSeen[notice.pack] !== notice.id || isError) {
      due.push(notice);
    }
  }
  if (!due.length) return null;

  const lines = ["[agent-sync] Updates & notices:"];
  let reload = false;
  for (const n of due) {
    const sev = String(n.severity || "info").toUpperCase();
    lines.push(`- ${n.pack} (${sev}): ${n.summary}`);
    if (n.shelvedBranch) lines.push(`  shelved branch: ${n.shelvedBranch} (inspect/merge with git)`);
    if (n.reloadRecommended) reload = true;
    harnessSeen[n.pack] = n.id;
  }
  if (reload) {
    lines.push("  Note: restart session or run /reload-plugins if this session predates the update.");
  }

  seen[harness] = harnessSeen;
  try {
    writeJsonAtomic(seenPath, seen);
  } catch {
    // Non-fatal
  }
  return lines.join("\n");
}

try {
  // Drain stdin if present without failing when empty.
  try { readFileSync(0, "utf8"); } catch {}
  const text = collectNotices("agy");
  if (!text) process.exit(0);
  console.log(JSON.stringify({ injectSteps: [{ systemMessage: { systemMessage: text } }] }));
} catch {
  process.exit(0);
}
