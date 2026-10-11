# setup-matt-pocock-skills

- Bucket: engineering. Invocation: user-invoked.
- Verdict: **adapt** (rename, repoint to tkt, strip what we don't use).

## What it is

The one-time per-repo configuration hub. Prompt-driven (not a script): it explores
the repo, then asks about the issue tracker (GitHub / GitLab / local-markdown /
other), triage label vocabulary, and domain-doc layout, and writes
`docs/agents/{issue-tracker,domain,triage-labels}.md` plus an `## Agent skills`
block into CLAUDE.md/AGENTS.md. Every other engineering skill reads tracker
behaviour from the doc this produces.

## What it does for the user

Decouples the skills from any one tracker: skills say "publish to the tracker" and
resolve the actual command through the generated `issue-tracker.md`. It is the
indirection layer that makes the set portable across trackers.

## Decision

**Adapt, significantly.** We have already made most of its decisions in grey-matter:
tkt is the tracker (proposals 01/01c), and `docs/tkt-conventions.md` + `GLOSSARY.md`
are the config this skill would otherwise generate. Concrete changes:

- **Rename.** The Matt-Pocock branding is baked into the skill name and the
  `## Agent skills` block. Our analog is a `setup` skill (or just the committed
  conventions docs we already have).
- **Repoint to tkt.** Replace the GitHub/GitLab/local-markdown tracker templates with
  a single tkt-flavoured `issue-tracker.md` (the proposal 01c follow-up), since tkt
  *is* our tracker.
- **Strip.** Drop the triage-label section unless we adopt the triage skill (open
  question from ticket 01); keep the domain-doc layout step (it writes GLOSSARY/ADR
  config we do use).

Alternative worth weighing: for a solo repo we may not need a setup *skill* at all,
the committed `tkt-conventions.md` + `CLAUDE.md` pointer already do its job. Keep the
skill only if we expect to stamp this setup onto many repos.

## Cross-skill dependencies

The hard precondition for to-tickets, to-spec, triage, implement-spec, code-review,
wayfinder (each says "tell the user to run /setup-..." if the tracker config is
absent). Whatever we rename it to, those references must be repointed.

## Web-app bias

None. Tracker/config setup is domain-agnostic. No lens needed.
