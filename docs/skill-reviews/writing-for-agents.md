# writing-for-agents

- Bucket: productivity. Invocation: model-invoked.
- Verdict: **keep** (and treat as the authoring standard for grey-matter's own docs).

## What it is

The reference for writing any document an agent consumes: skills, AGENTS.md/CLAUDE.md,
and pointer-reached docs. Its concepts: context pointers (wording, not target,
decides when material is reached), the two loads (context load on the window vs
cognitive load on the human), the information hierarchy (in-file step -> in-file
reference -> disclosed reference), completion criteria, when to split, leading words,
and pruning. Its sibling `SKILL-MECHANICS.md` covers model- vs user-invocation and
the router-skill pattern.

## What it does for the user

It is the intellectual backbone of the whole set: the reason every other skill is
shaped the way it is (why grilling is model-invoked but grill-me isn't, why handoff
uses a "suggested skills" pointer). For us it is doubly useful because we are
*authoring and adapting* skills, so it is our style guide, we already applied its
progressive-disclosure and depth discipline to the game-native-design artifact.

## Decision

**Keep.** It is reference, not a daily workflow tool, so its cost is near zero and
its value as the authoring standard is high. The concrete frontmatter mechanics
(`disable-model-invocation`, descriptions) are Claude-Code/Codex specific; we read
those as "the invocation taxonomy," mapping to whatever harness we target. Keep the
principles; treat the harness-specific syntax as translatable.

## Cross-skill dependencies

Consulted by retro (for style) and by anyone editing a skill. Its SKILL-MECHANICS.md
explains the invocation model that `invocation.md` enforces across the repo.

## Web-app bias

None. It is about writing for agents, domain-agnostic. No lens needed. (It is the
doc that tells us *how* to write the game lens well, not something the lens modifies.)
