# Lenses

Game-native (and future domain) guidance for the adapted skills. See
[`02-game-native-development.md`](../proposals/02-game-native-development.md) for the
model: a neutral core reference plus per-engine appendices, loaded when the
domain/engine is detected.

The game-native guidance is now a **skill**, not a doc in this tree: it is
model-invokable so other skills can reach it. It lives at
[`skills/engineering/game-native-design/`](../../../skills/engineering/game-native-design/SKILL.md):

- `SKILL.md`: build games that feel like games, not web apps. Tenets, the deep-module
  vs data-oriented two-regime rule, the testing split, engine-neutral core.
- `references/godot.md`: Godot 4.x appendix (default engine).
- `references/unreal.md`: Unreal Engine appendix.
- `references/review-rubric.md`: the web-ism smell list.

This directory holds future domain lenses that are reference material rather than
skills. When a lens matures into something an agent should *invoke* (a procedure with a
trigger), promote it to a skill per `curate-docs` and the promotion test in
`doc-conventions.md`.
