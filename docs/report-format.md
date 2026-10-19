# Report format: HTML first-class, markdown quick-look

A repo-wide convention for every generated **document, report, or dashboard** an agent
produces for a human to inspect (architecture reviews, analyses, research summaries,
status dashboards, and the like). It does **not** govern source docs that are edited by
hand and live in `docs/` as prose (conventions, ADRs, glossaries) or tkt tickets, those
stay plain markdown.

## The two formats, two jobs

- **Markdown is the quick-look.** A terse, machine-friendly, skimmable artifact: the
  source of truth the agent authors and can re-read to drive follow-up work (a grill, a
  decision, a ticket). Diffable, reviewable, offline-safe, lives in the repo or
  `.scratch/` per the artifact's durability.
- **HTML is the final format.** The polished, visual rendering a human opens to inspect:
  diagrams, before/after visuals, badges, layout. First-class, not an afterthought, this
  is the format a user is expected to actually read a finished report in.

Author the **markdown first** (so the agent has a structured artifact it can reason over
and regenerate from), then **render the HTML from it** as the deliverable. The markdown
is the source; the HTML is the presentation. A human skims the markdown to triage and
opens the HTML to study.

## HTML rules

- **Self-contained single file.** Everything inline; opening the file is all it takes.
- **Graceful degradation, no hard network dependency.** An agent may run offline,
  sandboxed, or in CI. If the HTML pulls styling or diagram libs from a CDN (e.g.
  Tailwind, Mermaid), it must degrade legibly when the network is absent: readable
  unstyled content and visible diagram source, never a blank or broken page. Prefer
  inlined assets where practical; when a CDN is used, say so and keep the markdown
  source as the reliable fallback.
- **Diagrams are grounded.** Any diagram claiming to depict real code/structure must be
  derived from and cite the actual files/symbols it shows; mark inferred or hypothetical
  edges as such. A polished diagram is trusted more than prose, so it must not
  misrepresent reality.
- **Where it lands.** A durable report goes in a committed `docs/` path; a throwaway or
  per-run report goes in `.scratch/` (gitignored). Avoid writing reports outside the repo
  (OS temp dirs) unless there's a specific reason, in-repo keeps them diffable and
  findable.

## Why

The markdown-source / HTML-render split keeps the agent-facing artifact robust (terse,
re-readable, version-controlled) while giving the human a genuinely good final format to
inspect. Making HTML a temp-dir, CDN-only afterthought trades away diffability and
offline safety for a demo; making markdown the only output trades away the visual clarity
a finished report earns. This convention keeps both.
