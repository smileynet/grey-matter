# Skill relevancy — batch C (writing / scripts / diagrams / winddown)

Sources read: `~/code/crew-research/atomics/skills/{writing-style,prose-check,script-authoring,diagrams,project-winddown}/` (SKILL.md + all references) [L1]; grey-matter `skills/meta/compass`, `readme`, `changelog`, `pr`, `retro`, `wrap-session`, `productivity/writing-for-agents`, `docs/agents/report-format.md`, `skills/engineering/improve-codebase-architecture/HTML-REPORT.md` [L1]; `~/code/decksmith/skills/prose-lint/` (SKILL.md, `references/ai-tells-catalog.md`, `tools/prose-lint.py` exists) [L1].

## writing-style

1. **Does:** A style reference (answer-first, active voice, bare imperatives, proportional depth) plus a kill-on-sight word table (delve, leverage, robust…), structural AI tells (uniform rhythm, "not just X but Y", recap conclusions, em-dash cap), and a markup-format chooser (Markdown/AsciiDoc/RST/Typst).
2. **Model-obsolete?** Mostly. The core rules are default good-writing behavior for current frontier models. The format chooser is general knowledge. The anti-slop list is the only part that still corrects real current-model habits (em dashes, "robust", triples). The "vary sentence length aggressively, ≥1 under 8 words" and "use the less obvious word" rules are over-prescriptive and can produce their own mannerisms.
3. **Harness-native?** No. None of the three harnesses ships a prose-style built-in. Claude Code output styles shape the *agent's* replies, not the documents it writes [L4: https://code.claude.com/docs/en/sub-agents, "Output style" note].
4. **Covered by grey-matter?** In part. `changelog` already encodes house style ("ASCII hyphen bullets, no em-dashes"). `readme` says "match the repo's voice". `writing-for-agents` covers agent-facing docs only. There's no shared user-facing anti-slop note.
5. **Residual unique value:** The *cluster, not isolated tell* judgment rule and a short banned-vocabulary list. The rest is default behavior or general knowledge.
6. **Verdict:** `FOLD`, as a short "prose tells" note in `docs/agents/doc-conventions.md` (or a `references/` file that `readme`, `changelog`, and `pr` point to). Nugget:
   > Flag AI tells in clusters, not singly: one em dash means nothing; em dashes + forced triples + "robust/seamless/leverage/delve" + a recap conclusion means rewrite.
   > House style: no em dashes in shipped prose; name the concrete capability or measurement instead of an adjective; end on the last concrete fact, not a summary.
   **Deck work:** decksmith `prose-lint` fully supersedes this skill. It has the same intent with a 39-pattern catalog, a false-positives list, a mechanical locator (`tools/prose-lint.py`), and project rules (em-dash ban, SA vs AM voice caveat). It should stay `PROJECT`-level in decksmith.
7. **Confidence:** high. All files were read in full, and the overlap with prose-lint and changelog house style is direct.

## prose-check

1. **Does:** Dispatches a fresh-context subagent with an inline checklist (vocabulary, filler, structure, imperatives, hyperbole, voice). The subagent returns a findings table and a CLEAN / MINOR / REWRITE verdict, and then the main agent applies fixes.
2. **Model-obsolete?** The checklist duplicates writing-style. The real idea is "the author is biased, so review from a fresh context". That pattern is now general practice, and grey-matter already encodes it (`retro` step 2). The "don't dispatch for <5 lines" sizing is a workaround from the era of flaky subagents.
3. **Harness-native?** The mechanism is. Claude Code subagents run "in its own context window with a custom system prompt" [L4: https://code.claude.com/docs/en/sub-agents]. kiro-cli has subagents and custom agents [L4: https://kiro.dev/docs/custom-agents/subagents/ (redirect target, not fetched in full)]. Codex can run a fresh `codex exec` session. Any of these does "review this file for AI tells in fresh context" without a skill.
4. **Covered by grey-matter?** The fresh-context review pattern is covered (`retro`, `code-review`). Its checklist is the writing-style content above.
5. **Residual unique value:** None beyond the writing-style nugget. **For decks**, decksmith `prose-lint` supersedes it outright. Its workflow is stronger: a mechanical spotlight, then a cluster judgment, a minimal fix, and a claim re-verification after edits ("a prose edit can flatten a hedge into a false claim"). prose-check has no locator and no false-positive guard.
6. **Verdict:** `DROP`. The one transferable line ("re-verify claims after a prose edit; edits can flatten hedges into false claims") could ride along with the writing-style FOLD if wanted.
7. **Confidence:** high. It's a thin wrapper over a harness-native mechanism plus a duplicated checklist.

## script-authoring

1. **Does:** Script principles (idempotent, resumable, visible progress, `set -euo pipefail`, header usage comment, `--dry-run`, `trap` cleanup, exit codes 0/1/2), hardened remote fetch (temp file + `mv`, sha256 check, curl under proxy), and a cross-platform reference: portability of BSD vs GNU `sed -i`/`realpath`/`timeout`, LF via `.gitattributes`, the IFS tab-collapse bug, uv trampoline `.exe` failing under Git Bash/MSYS, PowerShell CRLF stripping, and `pathlib.as_posix()` vs git paths.
2. **Model-obsolete?** SKILL.md body is yes: frontier models write `set -euo pipefail`, `mkdir -p`, `trap`, and usage headers unprompted. The cross-platform reference is no: it holds incident-derived, non-obvious failures.
3. **Harness-native?** No.
4. **Covered by grey-matter?** In part. `docs/agents/windows-powershell-gotchas.md` covers PowerShell command traps. grey-matter's own scripts are Node (`scripts/*.mjs`), so bash is a secondary surface.
5. **Residual unique value:** The incident-backed gotchas a strong model would miss: (a) whitespace `IFS` collapses empty fields, so use a non-whitespace delimiter (`yq ... join("|")`, not `@tsv`); (b) uv tool shims fail under Git Bash/MSYS, so add `|| true` in `$()` under `set -e` plus a PowerShell fallback; (c) strip `\r` from PowerShell output; (d) compare `Path.as_posix()` against git output.
6. **Verdict:** `FOLD` into `docs/agents/windows-powershell-gotchas.md` (rename its scope to "Windows shell gotchas" or add a bash/MSYS section). Nugget:
   > `IFS=$'\t' read` collapses consecutive tabs, so empty fields vanish. Use `IFS="|"` with `yq ... | join("|")`, not `@tsv`.
   > uv-installed tool `.exe` shims fail under Git Bash/MSYS (venv site-packages unresolved). In `set -e` scripts guard `$(tool ...) || true`, fall back to `powershell.exe -NoProfile -Command`, and pipe through `tr -d '\r'`.
   > Compare Python paths to git output with `Path.as_posix()`, since git always emits `/`.
7. **Confidence:** medium. The gotchas are real (cited incidents) but Windows/uv-specific, and some may belong project-level (crew-research `recall`/`tkt`) rather than in grey-matter.

## diagrams

1. **Does:** A format chooser (ASCII default, Mermaid, D2, C4 PlantUML via Kroki), C4 zoom levels and a checklist, Mermaid node-count limits, D2 sample + Kroki render endpoint, a drawsvg teaching-diagram tool with a color vocabulary, and HTML multi-diagram report delivery (Tailwind + Mermaid CDN, temp dir).
2. **Model-obsolete?** Yes for nearly all of it. Mermaid/D2/C4/ASCII syntax and choice are well within current-model knowledge. It's a reference summary of public docs.
3. **Harness-native?** No diagram built-in, but GitHub/GitLab render Mermaid natively (general knowledge, not re-verified here).
4. **Covered by grey-matter?** Yes, and better. `pr` picks the smallest *grounded* visual ("an agent-drawn call tree or Mermaid that misreads the code is worse than prose"). `docs/agents/report-format.md` sets the markdown vs HTML choice, the **grounded diagrams** rule, and CDN **graceful degradation**. `improve-codebase-architecture/HTML-REPORT.md` gives the full HTML report recipe with Mermaid + hand-built SVG patterns. crew-research's HTML section lacks the grounding and degradation rules grey-matter has.
5. **Residual unique value:** Small: Mermaid size limits (flowchart ~25 comfortable / ~70 max; sequence ≤15 participants) and the teaching color vocabulary (concept=blue, example=green, process=amber, anti-pattern=red, infra=gray). The drawsvg tool is explicitly project-level (teach-me).
6. **Verdict:** `DROP`. If wanted, the color vocabulary belongs to `teach` (project-level teach-me tooling). It isn't a global skill.
7. **Confidence:** high. grey-matter's grounded-diagram rules supersede it, and the remainder is public-doc knowledge.

## project-winddown

1. **Does:** A user-invoked project-end flow. It infers scope, fans out 5 subagents (decisions, code, process, research, tooling) to mine artifacts, synthesizes `summary/{README,decisions,patterns,dead-ends,tools-and-setup,methodology}.md`, runs a portability quality check, and asks which lessons should become skills or steering.
2. **Model-obsolete?** Largely. A current model asked to "write a lessons-learned summary, emphasise dead ends, cite SHAs" does this well. The fixed 5-subagent fan-out and 6-file layout are scaffolding from the weaker-model era (the skill itself says "don't force all projects into the same 6 files").
3. **Harness-native?** No built-in, but parallel subagents are native in all three (see prose-check §3).
4. **Covered by grey-matter?** Partly. `retro` (fresh-context session review, turning findings into environment changes), `wrap-session` (lands those findings), and `handoff` cover the per-session loop. Nothing does a *project-end, portable* summary. That gap is real but rare.
5. **Residual unique value:** The framing "summarize what was LEARNED, not what the project IS; dead ends are the highest-value output; lessons must be portable and traceable (SHA/path/date)". That's a prompt, not a skill.
6. **Verdict:** `DROP`. It's too situational for the global set, and a direct request reproduces it. If a project-end variant is ever wanted, add a "project scope" branch to `retro` rather than a new skill.
7. **Confidence:** medium. The value is real at project end, but usage is rare and the reasoning is default model behavior. It's a judgment call against the DROP bias.

## Summary

| skill | verdict | one-line reason |
|-------|---------|-----------------|
| writing-style | FOLD → `docs/agents/doc-conventions.md` (prose-tells note) | Only the cluster rule + short slop list + no-em-dash house style beat model defaults; decksmith `prose-lint` supersedes it for decks |
| prose-check | DROP | Fresh-context review is harness-native (subagents) and already a grey-matter pattern; decksmith `prose-lint` is strictly stronger for decks |
| script-authoring | FOLD → `docs/agents/windows-powershell-gotchas.md` | Core principles are default behavior; only the IFS / uv-MSYS / CRLF / as_posix gotchas are non-obvious |
| diagrams | DROP | Public-doc knowledge; grey-matter's `pr` + `report-format.md` + `HTML-REPORT.md` already add grounding and degradation rules it lacks |
| project-winddown | DROP | Rare, prompt-reproducible; per-session loop covered by `retro`/`wrap-session`/`handoff` |

Coverage: ✅ all 5 skills fully read (SKILL.md + every reference file). ⚠️ Codex harness claims not web-verified (no claim depends on a Codex built-in). The kiro subagents page was only seen as a redirect.
