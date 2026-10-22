# Relocating committed knowledge

When an incumbent keeps committed knowledge in a dot-prefixed dir (crew-research's `.memory/`
is the common case), it breaks grey-matter's dot-prefix rule: committed knowledge takes a plain
name. Relocate it in Step 3 under subsume-semantics.

## Map

Default map for the common incumbent layout (the script's `DEFAULT_MAP`):

| From | To |
| --- | --- |
| `.memory/CONTEXT.md` | `GLOSSARY.md` |
| `.memory/adr/` | `docs/adr/` |
| `.memory/specs/` | `docs/agents/specs/` |
| `.memory/research/` | `docs/agents/research/` |
| `.memory/grill/`, `.memory/spikes/` | `docs/agents/grill/`, `docs/agents/spikes/` |

Anything else (loose proposals, PLAN-like files, lessons) goes under `docs/agents/<topic>/` by
judgment, shown at the gate. Pass the full map explicitly with `--map old=new` (repeatable).

## Procedure

1. **Baseline.** Run the repo's test suite and
   `node <skill-dir>/scripts/relocate-knowledge.mjs check-links <repo>` before anything moves.
   Both must pass, or record what was already broken.
2. **Dry-run.** `node <skill-dir>/scripts/relocate-knowledge.mjs <repo> [--map ...]` prints the
   moves, the files it would rewrite, the evidence files it leaves alone, and the leftover
   old-root mentions.
3. **Apply.** Add `--apply`. It rewrites first, then `git mv`s. It refuses to move onto an
   existing destination; merge those by hand (e.g. a `GLOSSARY.md` that already exists).
4. **Leftovers.** Read each one. A path that the map doesn't cover gets added to the map and the
   run repeated. A *convention* mention ("record it in .memory") gets reworded to the new home.
   A mention inside recorded evidence stays as it is.
5. **Verify.** The same tests and `check-links` pass, and no `.memory/` mention is left outside
   evidence files. Remove the now-empty dir.

## Rules the script encodes

- Links are rewritten by **location**: resolve against the old path, map it, re-relativize from
  the new path. This survives depth changes and links between two moved files. A string
  replace does not.
- Repo-rooted mentions (prose, code docstrings, inline code) are prefix-mapped, including inside
  closed tickets, which still need to resolve.
- **Recorded evidence is never rewritten** (`.json`, `.jsonl`, `.ndjson`, `.log` by default;
  `--evidence-ext` overrides). It records what was observed, and rewriting it falsifies the record.
- `check-links` skips fenced code and inline code, where link-shaped text is usually an example.
