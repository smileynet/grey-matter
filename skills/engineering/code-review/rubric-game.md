# Standards rubric: games

The smell baseline for the Standards axis on game code. Use this instead of the app
rubric when the project is a game (engine markers: `project.godot`, `*.uproject`).
Applies on top of whatever the repo documents.

Same binding rules as the app rubric: a documented repo standard overrides; every item
is a labelled judgement call, never a hard violation; skip anything tooling enforces.

## OO-abuser smells misfire on data-oriented code

The app rubric's **Feature Envy**, **Message Chains**, **Middle Man**, and **Refused
Bequest** assume objects that own both data and behaviour. ECS / data-oriented design
deliberately separates plain-data components from the systems that transform them, so a
system reaching into component data is the intended design, not Feature Envy, and
composition over inheritance makes Refused Bequest largely moot. On data-oriented /
frame-loop code, **suppress those four**; the rest of the app smells (Mysterious Name,
Duplicated Code, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery,
Divergent Change, Speculative Generality) still apply.

## Web-ism smells

Apply the game-architecture smell list: the ways a game drifts into feeling like a web
app. Call the Skill tool with `game-native-design` and apply its `review-rubric.md`
(no loop, re-render drives the sim, store-as-game-state, frame-tied simulation,
per-frame allocation, blocking in the loop, deep inheritance for large-N, over-ticking,
non-deterministic by default). Each is a judgement call with its fix.
