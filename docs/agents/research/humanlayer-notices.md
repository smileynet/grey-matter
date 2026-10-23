# HumanLayer show-me notice research

Checked 2026-10-23. This records upstream text and release-packaging evidence;
it does not determine legal authorship or supply legal advice.

## Verified upstream artifacts

[L1:verified] GitHub API `GET /repos/humanlayer/humanlayer/commits/main`
returned **3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb**, committed 2026-10-23T00:04:53Z.
The recursive tree API at that SHA returned truncated=false. Read these pinned files:

- [HumanLayer show-me skill](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/apps/riptide-humanlayer-claude-plugin/skills/show-me/SKILL.md).
- [Same show-me in pi extension](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/apps/riptide-pi-extension/skills/show-me/SKILL.md).
- [Root LICENSE](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/LICENSE).
- [Root NOTICE](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/NOTICE).

[L1:verified] Both inspected show-me files have the same text. Their visuals menu,
examples and placement guidance correspond directly to grey-matter pr's Summary.
The local CREDITS explicitly describes near-verbatim reuse; comparison supports
that narrow description. No file-level license or author notice appears in either
upstream SKILL.md. The recursive tree contains no nearer LICENSE/NOTICE under
apps/riptide-humanlayer-claude-plugin or apps/riptide-pi-extension. Root LICENSE
states Apache License2.0; root NOTICE says the product uses it and explicitly
lists three unrelated MIT subtrees.

[L1:verified] The pinned upstream NOTICE identity is:

> HumanLayer
> Copyright 2025-2026 QueryTale, Inc. d/b/a HumanLayer

The NOTICE also identifies MIT code in vendor/effect-orpc, packages/y-durable-streams
and tools/oxlint/anti-slop. This inspection found no copied material from those
paths in pr; relevance of any other upstream content is outside this narrow audit.

## Redistribution text and release implications

[L2:verified] Root LICENSE section4(a)-(d) requires distributing a license copy,
marking modified files prominently, retaining relevant source notices, and
including readable relevant NOTICE attribution when the original distribution
contains NOTICE. Section4 permits different terms for modifications or a whole
work subject to its conditions. Section6 limits trademark permission. These are
summaries of the upstream terms, not a determination of legal compliance.

[L1:verified] Current pr/CREDITS names Dex Horthy and HumanLayer, links only the
repository root, and says content was aimed at a diff. SKILL.md metadata points
to CREDITS. Those describe attribution and adaptation but neither includes the
upstream copyright identity or full Apache license text. A repository file-name
scan found no tracked root LICENSE/NOTICE; the discovered LICENSE files were in
node_modules or scratch material, which are not release notice artifacts.

[L3:inferred] For preserving this known upstream material in release inputs,
retain the existing credit but add a pinned source path/revision, preserve the
HumanLayer/QueryTale notice identity, include the Apache2.0 license text, and put
a clear adaptation statement in the modified SKILL.md itself. Carry those files
into every distribution path that copies the skill, including bare skill roots
and generated plugin bundles. A root-only notice can be lost by a skill-folder
copy. Do not relabel the original HumanLayer text solely as MIT based on the
pack's manifest, and do not invent a copyright assignment to the named person.
The maintainer should resolve any residual license interpretation before release.

## Provenance limits

The exact revision originally copied is **unknown**: existing CREDITS gives no SHA,
and matching current upstream content establishes an inspectable source baseline,
not historical acquisition. GitHub commits API for the current skill path returns
one available introduction commit **d8197bab07017a2e2bef91bc25b2ebec6a4575b4**,
message “HumanLayer: the desktop app, daemon, CLI, web UI, API, and plugins”,
2026-10-22T21:59:13Z. API history for .claude/skills/show-me/SKILL.md returned no
commits. These observations do not establish who authored the skill, and existing
Dex credit should not be promoted to a verified copyright-ownership claim.

No extra upstream skill-specific license exemption was found. No authors or
maintainers were contacted. Changes to tracked files were outside this task.

## Evidence retained

Historical files under `.scratch/research/` named humanlayer-tree.json, humanlayer-LICENSE,
humanlayer-NOTICE and humanlayer-apps_riptide-humanlayer-claude-plugin_skills_show-me_SKILL.md
held the retrieved tree summary and bytes. The pinned URLs above reproduce those inputs. Requests used official
api.github.com and raw.githubusercontent.com endpoints pinned to the SHA above.
