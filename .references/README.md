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

### kirocrew

Kiro Crew (AWS, Apache-2.0): a persistent multi-agent workspace on kiro-cli, where
conductor agents dispatch crewmate sessions and track goals in a work ledger. Prior art for
the orchestration skill and for Kiro Crew-specific steps (`chat_tag`, `session_ledger`).
The checkout is about 900 MB, so clone it shallow.

```
git clone --depth 1 https://github.com/kirodotdev/KiroCrew.git .references/kirocrew
```

Pinned reference point when last used: commit `cbf3ecce` (2026-10-31).

## Adding a reference

Clone it under `.references/<name>`, then add a section here: what it is, why it's a
reference for this project, and the exact clone command. Keep clones shallow and
throwaway; nothing here is a dependency, only material agents read.

### Evaluation prior art (model and harness comparison)

Shallow clones read for the model-tier, effort, fast-mode and harness spikes (tickets 154-162, 167-173). What each teaches is in [eval prior art](../docs/agents/research/eval-prior-art-20261101.md). Prior art, not authority. Pinned commits are from 2026-11-01. Together they take about 165 MB, most of it harbor.

```
git clone --depth 1 https://github.com/harbor-framework/harbor.git .references/harbor                    # ac533ec, Apache-2.0, 144 MB; adapters in src/harbor/agents/installed/
git clone --depth 1 https://github.com/harbor-framework/harbor-cookbook.git .references/harbor-cookbook  # 2700bb2, Apache-2.0; task recipes
git clone --depth 1 https://github.com/meridianlabs-ai/inspect_swe.git .references/inspect_swe            # 7804cf7, MIT; harness CLIs as Inspect agents
git clone --depth 1 https://github.com/review-bench/ReviewBench.git .references/reviewbench              # 228f2a8, MIT; golden findings + judge
git clone --depth 1 https://github.com/SWE-agent/mini-swe-agent.git .references/mini-swe-agent           # 04d809c, MIT; bash-only control agent
git clone --depth 1 https://github.com/Dubibubii/tokenmeter.git .references/tokenmeter                   # a9531c0, MIT; cost from session logs
git clone --depth 1 --filter=blob:none --sparse https://github.com/Aider-AI/aider.git .references/aider  # 5dc9490, Apache-2.0
git -C .references/aider sparse-checkout set benchmark
```
