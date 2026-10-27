# Document format: markdown for light, HTML for full-bodied

A repo-wide convention for choosing the format of a **document, report, or dashboard** an
agent produces for a human. Markdown and HTML are **two kinds of deliverable for two
purposes**, not source-and-render of one thing. Pick by purpose. For wording, follow the
[human-facing writing guidance](./doc-conventions.md#human-facing-writing).

## The two formats, two jobs

- **Markdown is the light, skimmable document.** The fast look: notes, quick summaries,
  short analyses, a terse artifact a reader (or the agent itself) scans in seconds.
  Diffable, version-controlled, easy to re-read. Reach for it when a light document is
  the right tool, and when the agent needs an artifact it can reason over later.
- **HTML is the visual or interactive document.** Choose it when the reader needs
  a visual explanation, browsable comparison, interactive demonstration, or feedback
  page. Open questions and unfinished proposals are valid content. It is a deliverable
  in its own right, not a rendering of the markdown.

They are **siblings selected by purpose**, not a pipeline. A light skim is a markdown
document; a full-bodied communicative document is HTML. Neither is "the source" of the
other: if a report warrants the full HTML treatment, author it as HTML; if it only needs
a quick skim, a markdown doc is the whole deliverable. (Hand-edited prose, conventions,
ADRs, glossaries, and tkt tickets stay plain markdown regardless, this convention is about
generated reports/dashboards, not the repo's working docs.)

A status dashboard that is updated after each task follows the
[delivery-dashboard](../../skills/productivity/delivery-dashboard/SKILL.md) contract: a shipped
template, a short overview over a searchable history, and a checker.

## HTML rules

- **Open the relevant view.** When the current environment supports it, open the
  page, tab, or view relevant to the user's review. After revisions, refresh or
  reopen it. Include a direct link for return visits. If opening is unavailable,
  state that limitation and provide a link or absolute path as a fallback. Use the
  available viewer or application; the contract is tool-independent and does not
  bypass access controls or change permissions.

- **Offline opening contract.** A portable deliverable may remain one self-contained
  file. An evolving dashboard can ship with separately versioned local assets to
  avoid repeating large payloads on every update. Opening the file or documented
  extracted bundle must work offline; pin bundle version/hash and retrieval where
  needed. Inspect that route from a fresh copy, not only from a populated cache.
- **Choose a retention role.** Use
  [repository-artifact-hygiene](../../skills/meta/repository-artifact-hygiene/SKILL.md)
  before adding substantial media or generated evidence. Preserve intentional
  standalone deliverables; embedding alone is not a defect. Keep per-run evidence
  separate from source originals and the small evolving dashboard. Promote selected
  proof or a pinned frozen bundle when it must survive a fresh clone.
- **Graceful degradation, no hard network dependency.** An agent may run offline,
  sandboxed, or in CI. If the HTML pulls styling or diagram libs from a CDN (e.g.
  Tailwind, Mermaid), it must degrade legibly when the network is absent: readable
  content and visible diagram source, never a blank or broken page. Bundle essential
  assets locally or inline them deliberately; when a CDN is used, say so.
- **Diagrams are grounded.** Any diagram claiming to depict real code/structure must be
  derived from and cite the actual files/symbols it shows; mark inferred or hypothetical
  edges as such. A polished diagram is trusted more than prose, so it must not
  misrepresent reality.
- **Where it lands.** A durable report goes in a committed `docs/` path; a throwaway or
  per-run report goes in `.scratch/` (gitignored). Avoid writing reports outside the repo
  (OS temp dirs) unless there's a specific reason, in-repo keeps them diffable and
  findable.

## Why

Markdown and HTML serve different tasks: a quick skim, a visual explanation, or
an interactive review. Choose the format that lets the reader inspect the work,
compare options, or respond without unnecessary navigation.
