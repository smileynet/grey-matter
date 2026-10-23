# Plugin notice inventory

Verified 2026-10-23, ticket 74. This inventory preserves upstream redistribution
artifacts and records the limits of attribution evidence.

| Material | Pinned source / terms | Distribution artifacts |
| --- | --- | --- |
| Adapted mattpocock/skills material in grey-matter | [LICENSE at 5beb35b](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/LICENSE), MIT, Copyright (c) 2026 Matt Pocock | Root LICENSE, NOTICE, and a retained MIT license in each standalone skill directory |
| PR Summary visual menu and placement guidance | [HumanLayer source](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/apps/riptide-humanlayer-claude-plugin/skills/show-me/SKILL.md), [LICENSE](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/LICENSE), [NOTICE](https://github.com/humanlayer/humanlayer/blob/3a8dd2d3c1ed01d4fd2282b6dee2075199dffffb/NOTICE), Apache-2.0 | Root LICENSES/Apache-2.0.txt and NOTICE; pr LICENSE-APACHE.txt, NOTICE, CREDITS.md, and a modification statement in SKILL.md |
| tkt source and skills | Existing repository MIT declaration and LICENSE | Root LICENSE and a copy in each standalone skill directory |
| grey-matter deployer vendored by tkt | Canonical scripts/deploy.mjs and grey-matter MIT declaration | tkt tools/LICENSE-grey-matter.txt and root NOTICE |

The retained HumanLayer notice identifies **HumanLayer, Copyright 2025-2026
QueryTale, Inc. d/b/a HumanLayer**. Unrelated MIT subtree notices in its root
NOTICE are outside the copied PR material. [The narrow source inspection](humanlayer-notices.md)
records that scope. The pack metadata uses `MIT AND Apache-2.0` because recipients
receive material under both licenses; this does not relicense the HumanLayer text.

The originally copied revisions are unknown. The pinned revisions above are
inspectable license/source baselines, not claims about historical acquisition.
The existing Dex Horthy credit is retained as attribution, without assigning
copyright ownership. A retained Matt Pocock notice does not claim he authored
every local file. No new copyright identities, assignments or permissions are
invented. The existing MIT intent is retained for local material.

## Distribution contract

The canonical deployer reads required root notice paths from
`metadata.deploy.legalFiles` and per-skill filenames from `skillLicenseFiles` in
the pack manifest. Missing, empty, escaping or non-file artifacts fail lint
before copying or replacing a package. Generated agy packages include these
files; source-based Codex/Claude packages retain the tracked files. Bare installs
copy the complete skill folder, including its license and PR-specific notices.

These are deploy-only fields in Claude's inert metadata; other host manifests
carry the resulting license expression, not the deployment configuration.
Engine 1.3.2 is vendored byte-for-byte by tkt. Candidate preparation must retain
these files and rerun these checks on extracted bundles (ticket 67); this source
change is not evidence that a future candidate archive has been prepared.

The fixtures deliberately remove and empty root LICENSE/NOTICE and a standalone
skill license, reject the package build, and prove the previous package survives.
They also assert retained bytes in a complete generated package and bare install.
