# Web-ism smells

The game-architecture counterpart to the Fowler smell baseline in `code-review`: the
ways a game drifts into feeling like a web app. Each is a judgement-call smell, not a
hard rule. Flag it, name the fix. Engine-neutral; the appendix names the primitive.

- **No loop**: simulation logic only in event handlers, no per-frame update. -> move
  continuous logic into the fixed update step.
- **Re-render drives the sim**: a UI framework's state change steps the game. -> drive
  the sim from the loop; the UI observes it.
- **Store-as-game-state**: live sim state held in a view store as source of truth. ->
  mutable sim state in the loop; the store is for meta/UI.
- **Frame-tied simulation**: physics/gameplay scaled by render frame rate, no fixed
  step. -> fixed-timestep update, interpolate on render.
- **Per-frame allocation**: heap churn in the hot loop. -> pool and reuse.
- **Blocking in the loop**: synchronous I/O or `await` inside the frame. -> move off
  the loop; stream or defer.
- **Deep inheritance for large-N**: an `Enemy -> FlyingEnemy -> ...` chain where many
  entities share behaviour. -> composition / data-oriented systems.
- **Over-ticking**: everything ticks regardless of whether it participates. -> tick
  what simulates, event-drive the rest.
- **Non-deterministic by default**: unseeded RNG, frame-rate-dependent logic. -> seed
  RNG, fix the timestep.
