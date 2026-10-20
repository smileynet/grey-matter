#!/usr/bin/env node
// check-invocation-policy.mjs — mechanical check for the user-invoked skill
// invocation contract (ticket 27).
//
// A skill is "user-invoked" when it sets `disable-model-invocation: true` in
// SKILL.md. Our convention (docs/agents/skill-frontmatter.md) requires that such
// a skill ALSO carries a Codex sidecar `agents/openai.yaml` with
// `policy.allow_implicit_invocation: false`, and that a model-invoked skill does
// NOT carry that restrictive policy. The two sides must agree — user-invoked in
// both or neither.
//
// This catches a one-sided mismatch: the SKILL.md says user-only but no sidecar
// enforces it in Codex (the exact gap ticket 27 fixed), or a sidecar restricts a
// skill the frontmatter leaves model-invokable.
//
// Also checks that each bucket README's "User-invoked" / "Model-invoked" grouping
// agrees with the frontmatter, so a misfiled skill (ticket 27's retro/wizard
// class of bug) is caught deterministically.
//
// Exit 0 = consistent. Exit 1 = at least one mismatch (details on stderr).
// Run:  node scripts/check-invocation-policy.mjs
//
// Scoped to the invocation invariant on purpose. The broader repo-consistency
// harness (indexes, links, installer safety, ticket health) is ticket 31; it can
// call this as one component.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(REPO, "skills");

const problems = [];

function isDir(p) { try { return statSync(p).isDirectory(); } catch { return false; } }

// --- Gather every skill and its invocation facts -------------------------------
const skills = []; // { name, bucket, dir, userInvoked, hasSidecar, policyFalse }
for (const bucket of readdirSync(SKILLS_DIR)) {
  const bucketPath = join(SKILLS_DIR, bucket);
  if (!isDir(bucketPath)) continue;
  for (const name of readdirSync(bucketPath)) {
    const dir = join(bucketPath, name);
    const skillMd = join(dir, "SKILL.md");
    if (!isDir(dir) || !existsSync(skillMd)) continue;

    const md = readFileSync(skillMd, "utf8");
    const userInvoked = /^disable-model-invocation:\s*true\s*$/m.test(md);

    const sidecar = join(dir, "agents", "openai.yaml");
    const hasSidecar = existsSync(sidecar);
    let policyFalse = false;
    if (hasSidecar) {
      const yaml = readFileSync(sidecar, "utf8");
      policyFalse = /allow_implicit_invocation:\s*false/.test(yaml);
    }
    skills.push({ name, bucket, dir, userInvoked, hasSidecar, policyFalse });
  }
}

// --- Check 1: frontmatter <-> sidecar policy agree ----------------------------
for (const s of skills) {
  if (s.userInvoked && !s.policyFalse) {
    problems.push(
      `${s.bucket}/${s.name}: SKILL.md has disable-model-invocation: true but ` +
      `agents/openai.yaml is missing or lacks policy.allow_implicit_invocation: false`,
    );
  }
  if (!s.userInvoked && s.policyFalse) {
    problems.push(
      `${s.bucket}/${s.name}: agents/openai.yaml sets allow_implicit_invocation: false ` +
      `but SKILL.md is model-invoked (no disable-model-invocation: true)`,
    );
  }
}

// --- Check 2: bucket README groupings agree with frontmatter ------------------
// Each bucket README lists skills under "## User-invoked" and "## Model-invoked".
// A skill linked under the wrong heading is a mismatch.
for (const bucket of new Set(skills.map((s) => s.bucket))) {
  const readme = join(SKILLS_DIR, bucket, "README.md");
  if (!existsSync(readme)) continue;
  const text = readFileSync(readme, "utf8");

  // Split into sections by "## <heading>".
  const sections = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { current = h[1].toLowerCase(); sections[current] = []; continue; }
    if (current) sections[current].push(line);
  }
  const linkedUnder = (heading) => {
    const body = (sections[heading] || []).join("\n");
    const names = new Set();
    for (const m of body.matchAll(/\]\(\.\/([a-z0-9-]+)\/SKILL\.md\)/g)) names.add(m[1]);
    return names;
  };
  const underUser = linkedUnder("user-invoked");
  const underModel = linkedUnder("model-invoked");

  for (const s of skills.filter((x) => x.bucket === bucket)) {
    if (s.userInvoked && underModel.has(s.name)) {
      problems.push(`${bucket}/README.md: ${s.name} is user-invoked but listed under "Model-invoked"`);
    }
    if (!s.userInvoked && underUser.has(s.name)) {
      problems.push(`${bucket}/README.md: ${s.name} is model-invoked but listed under "User-invoked"`);
    }
  }
}

// --- Report -------------------------------------------------------------------
if (problems.length) {
  console.error(`invocation-policy check FAILED (${problems.length} mismatch(es)):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
const userCount = skills.filter((s) => s.userInvoked).length;
console.log(
  `invocation-policy check OK: ${skills.length} skills, ${userCount} user-invoked ` +
  `(frontmatter, sidecar policy, and README groupings all agree).`,
);
