# Document format: markdown for light, HTML for full-bodied

A repo-wide convention for choosing the format of a **document, report, or dashboard** an
agent produces for a human. Markdown and HTML are **two kinds of deliverable for two
purposes**, not source-and-render of one thing. Pick by purpose.

## The two formats, two jobs

- **Markdown is the light, skimmable document.** The fast look: notes, quick summaries,
  short analyses, a terse artifact a reader (or the agent itself) scans in seconds.
  Diffable, version-controlled, easy to re-read. Reach for it when a light document is
  the right tool, and when the agent needs an artifact it can reason over later.
- **HTML is the full-bodied document.** The end work: the considered, visual,
  communicative artifact that represents our output and conveys ideas to users, diagrams,
  before/after visuals, badges, layout, editorial structure. It is a deliverable in its
  own right, not a rendering of the markdown. Reach for it when the job is to *communicate
  a finished idea* to a user, not just record one.

They are **siblings selected by purpose**, not a pipeline. A light skim is a markdown
document; a full-bodied communicative document is HTML. Neither is "the source" of the
other: if a report warrants the full HTML treatment, author it as HTML; if it only needs
a quick skim, a markdown doc is the whole deliverable. (Hand-edited prose, conventions,
ADRs, glossaries, and tkt tickets stay plain markdown regardless, this convention is about
generated reports/dashboards, not the repo's working docs.)

## HTML rules

- **Self-contained single file.** Everything inline; opening the file is all it takes.
- **Graceful degradation, no hard network dependency.** An agent may run offline,
  sandboxed, or in CI. If the HTML pulls styling or diagram libs from a CDN (e.g.
  Tailwind, Mermaid), it must degrade legibly when the network is absent: readable
  content and visible diagram source, never a blank or broken page. Prefer inlined assets
  where practical; when a CDN is used, say so.
- **Diagrams are grounded.** Any diagram claiming to depict real code/structure must be
  derived from and cite the actual files/symbols it shows; mark inferred or hypothetical
  edges as such. A polished diagram is trusted more than prose, so it must not
  misrepresent reality.
- **Where it lands.** A durable report goes in a committed `docs/` path; a throwaway or
  per-run report goes in `.scratch/` (gitignored). Avoid writing reports outside the repo
  (OS temp dirs) unless there's a specific reason, in-repo keeps them diffable and
  findable.

## Why

Markdown and HTML serve different readers and moments: a skim versus a studied read of
finished work. Treating HTML as a first-class full-bodied deliverable (not a CDN-only
temp-dir afterthought) gives users a genuinely good artifact to inspect; keeping markdown
as the light, skimmable form keeps the fast look fast. Choose the format the job calls
for.
