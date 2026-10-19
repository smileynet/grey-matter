# Game Prototype

A throwaway **Godot scene** you run and *play* to feel whether a mechanic or loop works. Use this when the question is about **feel**: is the jump satisfying, is the core loop fun, does the combat read, does the pacing hold. Feel can't be clicked through on paper or inspected in a state diagram; it has to be played.

If the question is about business logic/state, use [LOGIC.md](LOGIC.md); if it's about what a 2D/UI screen should look like, use [UI.md](UI.md). The tell is the verb: you **play/feel** a game prototype, you don't click or inspect it.

Default engine is **Godot**; for the determinism and feel philosophy behind this branch, call the Skill tool with "game-native-design". The substrate maps to other engines (an Unreal prototype level + Blueprint/C++), but the shape below is written Godot-first.

## When this is the right shape

- "Is this jump / dash / grapple satisfying?"
- "Does the core loop actually feel fun, or just look good on paper?"
- "What gravity / acceleration / damage values feel right?"
- "Does this enemy behaviour read clearly to the player?"
- Anything where someone needs to **play it and feel it**, not reason about it.

## Process

### 1. State the question

Write down the one feel-question this prototype answers, in a visible place (a label in the scene, a comment at the top of the script). "Does the double-jump feel floaty or crisp at these values?" A game prototype that answers the wrong question wastes the build.

### 2. Isolate the loop as a pure simulation step

The bit that answers the question, the mechanic's update, is written as a **pure simulation step** decoupled from Godot's nodes and rendering: `step(state, input, dt) -> state`, no `Node` references, no drawing, no input polling reaching inside it. The scene around it is the throwaway driver; this step is the liftable core (SKILL rule 6).

Keeping it pure buys three things that matter for games specifically:

- it **lifts** straight into the real project once the feel is validated;
- it runs **headless** for a test later;
- it is **deterministic**, which makes scenario replay and tuning comparisons trustworthy (step 5).

The Godot scene calls `step()` each physics tick with the gathered input and `dt`; nothing flows the other way.

### 3. Greybox the scene

Build the smallest scene that lets the mechanic be felt, with **primitive/greybox art**: boxes, capsules, flat colours, no models, no textures, no audio beyond what the question needs. Greyboxing is deliberate lo-fi: ugly so nobody anchors on the look or mistakes it for production, and cheap so it's genuinely throwaway. Name the scene so it's obviously a prototype (e.g. `proto_doublejump.tscn`), and make it directly runnable (set as the scene you launch with F6), SKILL rule 2.

### 4. Expose the feel parameters as tuning controls

Feel prototyping is fundamentally **parameter tuning**, so make the constants tweakable *while playing*, this is the game analog of the logic branch's "a non-developer drives it":

- Mark gameplay constants `@export` so they're editable in the inspector and the remote scene tree at runtime (jump height, gravity, acceleration, friction, damage, cooldowns).
- For the values the question is really about, add an on-screen debug panel (a `Control` overlay with sliders/labels) so a teammate can feel the difference live without opening the editor.
- **Surface the state** (SKILL rule 5): show the relevant live values (velocity, state, timers) on screen so what changed is visible as it's played.

### 5. Determinism and scenario replay (when comparing)

When the question is "which of these tunings feels better", make the comparison apples-to-apples: a **fixed timestep**, a **seeded RNG**, and **recorded input** let you replay the same scenario against different parameter sets. This is the game version of a reproducible test case, and it falls out of the pure `step()` from step 2. Not every feel prototype needs it (free-play is often enough), but reach for it the moment you're comparing variants. See "game-native-design" for why determinism is the spine.

### 6. Hand it over: a playable build

The deliverable is something a teammate **plays**, not reads. Either they run the scene in Godot (F6), or, when they need to play without installing the editor, export an **HTML5/WASM build** and send the link. (This is the only place HTML belongs in a game prototype: as an export *target* for sharing, never as the authoring substrate.) The interesting feedback is "the dash feels like it cuts out too early" or "landing has no weight", those are bugs in the *feel*, which is the whole point. If they want a new value to try or a new scenario, add it.

### 7. Capture the answer and the prototype

Once the prototype has answered its question, capture the answer (the validated values / the feel verdict and the question it settled), then capture the prototype the way the [SKILL](SKILL.md) describes (throwaway branch + a context pointer on the tkt ticket). The game-specific mapping: the validated pure `step()` and the tuned constants lift into the real project (the decision, absorbed); the greybox scene and debug panel ride along to the throwaway branch as a primary source.

## Anti-patterns

- **Don't build art or audio.** Greybox only. Polish anchors judgement and wastes the throwaway.
- **Don't blur the sim into the nodes.** If the mechanic's update reaches into `Node`s, rendering, or raw input, it's no longer liftable, headless-testable, or deterministic. Keep the scene a thin driver over a pure `step()`.
- **Don't ship the greybox scene or debug panel to production.** They were built under prototype constraints. The tuned values and the pure sim step are the parts worth keeping.
- **Don't generalise the mechanic.** No "what if we also wanted X". One feel-question at a time.
- **Don't tune without determinism when comparing.** Eyeballing two runs with different RNG and frame timing isn't a comparison; seed and fix the timestep first.
