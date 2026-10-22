# How steering files and AGENTS.md actually load in kiro-cli (empirical)

**Evidence class: L1 (observed artifact).** Every claim below traces to a file read or
command run on this machine on the current date. Where a claim rests on another project's
documentation it is labeled L4 and called out as such.

Machine: `acp-client` (sandbox). kiro-cli **2.33.1**, `chat.agentEngine: v3`.

---

## Summary / Verdict

Current kiro-cli (2.33.1, agent-engine v3) does **not** treat steering as a
frontmatter-driven inclusion mechanism, and does **not** have a separate "steering vs
AGENTS.md" loading distinction baked into the engine. Both are just **file resources
globbed into the agent's context** by the agent config's `resources` array:

```json
"resources": [
  "file://README.md",
  "file://AGENTS.md",
  "file://.kiro/steering/**/*.md",
  ...
]
```

- Steering `.md` files are **bare markdown with no `inclusion:` frontmatter** — I found
  zero `inclusion:` declarations across the entire global steering tree.
- The `**/*.md` glob means **every** steering file loads on **every** turn, unconditionally.
  There is no `inclusion: always | fileMatch | manual` gate being read; the gate that
  governs loading is the glob in `resources`, not frontmatter in the file.
- AGENTS.md loads the same way — as `file://AGENTS.md` in the same `resources` array — so it
  is auto-loaded for the workspace exactly like steering, not through a distinct mechanism.
- This matches what I observe in this very session: the injected "Included Rules" are the
  global steering files verbatim, and the workspace `AGENTS.md` and `.tickets/`-related
  steering were injected as rules alongside them — one flat set, no inclusion-mode
  differentiation.

**Bottom line:** "steering" and "AGENTS.md" are, mechanically, the same thing in this
kiro-cli — context files enumerated by the active agent's `resources` globs and loaded
always-on. The old Kiro IDE notion of per-file `inclusion:` modes is **not** the mechanism
here; if `inclusion:` markers are present they are ignored (confirmed by crew-research's own
docs, see Task 5).

---

## Task 1 — kiro-cli version & doctor

```
$ kiro-cli --version
kiro-cli 2.33.1
```

`kiro-cli doctor` reports only an unrelated sshd_config read failure (a known
permissions false-negative on this host — sshd_config is root-only mode 600). No
steering/context diagnostics are emitted. Exit code 0.

`~/.kiro/settings/cli.json` confirms the engine:
```json
{ "chat.agentEngine": "v3", "chat.defaultModel": "auto", "mcp.loadedBefore": true, ... }
```
`~/.kiro/settings/amazon-internal.json`: `{"sandbox": true}`.

---

## Task 2 — global steering dir frontmatter shape

`~/.kiro/steering/` contents:
```
ai-generation-hygiene.md        context-budget-awareness.md   image-handling.md
project-conventions.md          recall-check.md               recall-session-start.md
research-dispatch-mandate.md    source-authority.md           subagent-reliability.md
verification-protocol.md
archwright-conventions.md -> /home/sabiggin/code/archwright/steering/archwright-conventions.md   (symlink)
frontier-work.md         -> /local/home/sabiggin/code/tkt/steering/frontier-work.md              (symlink)
amazon-builder/   (5 files: brazil, inclusivity-scanner, internal-systems, production-safety, security)
references/       (environment-gotchas.md — 57 KB)
```

**Exact frontmatter shape: there is none.** Every file begins directly with an H1
markdown heading. Representative first lines:

- `ai-generation-hygiene.md` → `` (blank) then `# AI Generation Hygiene`
- `verification-protocol.md` → `# Verification Protocol`
- `source-authority.md` → `# Source Authority`
- `project-conventions.md` → `# Project Conventions (Always Enforce)`
- `context-budget-awareness.md` → `# Context Budget Awareness`
- symlinked `frontier-work.md` / `archwright-conventions.md` → also bare H1, no frontmatter

No `---` YAML fences, no `inclusion:` key. A grep for `inclusion` across the whole
steering tree returns exactly **one** hit, and it is prose content inside the
inclusivity-scanner table ("inclusion list"), not a frontmatter directive:

```
$ grep -rn "inclusion" ~/.kiro/steering/
amazon-builder/amazon-builder-inclusivity-scanner.md:9:| whitelist | allowlist, approved list, inclusion list |
```

So: **bare markdown, no inclusion mode declared anywhere.**

---

## Task 3 — config that controls auto-loading

The loader is the **agent config `resources` array**, found in `~/.kiro/agents/*.json`.
There is no `~/.kiro/cli-agents/` dir and no `~/.aws/amazonq/` config on this host.

Settings dir `~/.kiro/settings/` holds `cli.json`, `mcp.json`, `amazon-internal.json`,
theme/feed/survey state — none of these reference steering or AGENTS.md. The wiring lives
entirely in the agent JSONs:

Agents that load steering + AGENTS.md (exact `resources` entries):

- **`AmazonBuilderCoreAIAgents-amzn-builder.json`**:
  `["file://README.md", "file://AGENTS.md", "file://.kiro/steering/**/*.md", <AIM context .md>, <AIM skill SKILL.md ...>]`
- **`AtlasAICapabilities-atlas.json`**:
  `["file://README.md", "file://AGENTS.md", "file://.kiro/steering/**/*.md", "file://...atlas-*.md"]`
- **`kirocrew.json`** (the crew default) and every crew sub-agent
  (`kirocrew-conductor`, `-research`, `-worker`, `-ledger-conductor`,
  `-pipeline-conductor`, `-security-conductor`):
  `["file://.kiro/steering/**/*.md"]`
- `kirocrew-lite`, `-heartbeat`, `-knowledge`, and the `sa-*` agents have
  `resources: None` — they load **no** steering at all.

Key facts about the mechanism:
- Loading is by **glob over files** (`.kiro/steering/**/*.md`), applied relative to the
  workspace root. It is unconditional — no per-file predicate is consulted.
- `AGENTS.md` and `README.md` are enumerated as peer `file://` resources — same list, same
  always-on treatment.
- No agent uses a `contextFiles` key (all `contextFiles: None`); the current schema key is
  `resources`. `skill://` URIs in the same array load SKILL.md files (progressive/skill
  mechanism, separate from always-on file resources).
- `~/.kiro/permissions.yaml` grants a `context` capability (v3 capability model) but does
  not enumerate or gate individual steering files.

Note on path scope: the globs are workspace-relative (`.kiro/steering/`), yet the
**global** `~/.kiro/steering/` files are the ones injected this session — so kiro-cli
merges the user-global steering tree into the same always-on context set regardless of the
workspace-relative glob. (Observed: this session's injected rules are the global files.)

---

## Task 4 — are steering & AGENTS.md always-on, auto-loaded?

**Yes to both, by direct observation of this session + the config above.**

- This session's "Included Rules" block contains the global steering files **verbatim and
  in full** — `verification-protocol`, `source-authority`, `subagent-reliability`,
  `research-dispatch-mandate`, `project-conventions`, `context-budget-awareness`,
  `image-handling`, `archwright-conventions`, `ai-generation-hygiene`, the recall pair,
  the five `amazon-builder/*`, and the 57 KB `references/environment-gotchas.md`. All of
  them, not a filtered subset — consistent with an unconditional `**/*.md` glob, not an
  `inclusion: fileMatch` filter.
- The workspace **`AGENTS.md`** (grey-matter) and the tkt workspace-rule block were injected
  as rules in the same set, flagged `[Workspace]` vs `[Global]`. That Global/Workspace split
  is a **path-origin** label (home steering vs workspace file), **not** an inclusion-mode
  distinction — there is no `always/fileMatch/manual` tier being honored.
- Therefore steering frontmatter inclusion modes are **not** the control surface. A file
  present under a globbed steering dir loads always-on no matter what (if anything) its
  frontmatter says.

---

## Task 5 — does crew-research document its steering-vs-AGENTS.md model?

Yes, and its documentation **confirms** the empirical finding above (this is L4 — another
project's docs — but it corroborates the L1 observation):

`/home/sabiggin/code/crew-research/.kiro/steering/user-setup-guide.md`:
- line 32: "`.kiro/steering/` — always-on rules (code hygiene, verification)"
- line 48: "Files added directly to `~/.kiro/steering/` that aren't in the deployed tier get
  **PRUNED on the next deploy**. To add personal always-on steering that survives
  redeploys, symlink it…" (explains the two symlinks observed in Task 2)
- **line 67 (decisive):** "Do NOT place detail files under `.kiro/steering/` — **everything
  there loads on every turn regardless of `inclusion:` markers (ADR 0009)**;
  `steering/references/` is reserved for user-owned always-on files"

`crew-research/AGENTS.md` treats steering as always-on rules and points to specific
steering files for detail (e.g. `user-setup-guide.md`), and `README.md` counts steering as
a deployed tier ("✅ 6 steering, 18 skills") and says "A rule feels too strict | Remove the
file from `.kiro/steering/`" — i.e. the unit of control is *file presence*, not a
frontmatter mode.

So crew-research's model is explicit: **steering = always-on, loaded every turn, inclusion
markers ignored**; AGENTS.md is the terse always-on project-rules file loaded the same way.
That is exactly what the kiro-cli agent `resources` globs implement.

---

## Caveats on scope

- Evidence is from one host (`acp-client`, sandbox) and the installed AIM + crew agent
  configs. The loading *mechanism* (resources glob, no frontmatter gate) is stable across
  every agent JSON inspected; the specific *file set* is machine/deploy-specific.
- I did not find kiro.dev documentation locally; the mechanism claims rest on the config
  files and this session's injected context (L1), corroborated by crew-research docs (L4).
  If a definitive spec is needed, confirm against kiro.dev's agent `resources` docs — but
  the on-disk reality here is unambiguous.
