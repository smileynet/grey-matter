# .references

Cloned prior-art and reference material. **Everything here except this README is
gitignored**, so a fresh checkout of grey-matter has an empty `.references/`. This file
is the committed index: it tells an agent on another machine what to re-clone and how,
so references rehydrate without being committed into our repo.

Rehydrate by running the clones below from the repo root.

## References

### agentskills

The Agent Skills open standard (the `SKILL.md` format + authoring/spec docs behind
agentskills.io). The authority our skills follow for structure, progressive disclosure,
and frontmatter.

```
git clone https://github.com/agentskills/agentskills.git .references/agentskills
```

Pinned reference point when last used: commit `69ef37e` (2026-10). Pull latest unless a
specific pin matters.

## Adding a reference

Clone it under `.references/<name>`, then add a section here: what it is, why it's a
reference for this project, and the exact clone command. Keep clones shallow and
throwaway; nothing here is a dependency, only material agents read.
