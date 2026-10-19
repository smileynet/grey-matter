# Godot appendix

The game-native tenets ([SKILL.md](../SKILL.md)) in Godot 4.x terms. The core is the
authority; this names the primitive, it does not re-teach the principle. Community
idiom (not official API) is marked *(idiom)*.

## The one that bites: the loop is handed to you

Godot gives you the fixed/variable split for free. `_physics_process(delta)` is a
first-class **fixed** gameplay step (rate = `Engine.physics_ticks_per_second`, default
60); `_process(delta)` is the **variable** render step. Put simulation and anything
touching a physics body in `_physics_process`; put presentation and smoothing in
`_process`. Visual smoothing at a low tick rate: the `physics_interpolation` project
setting (4.3+). This is the opposite problem from Unreal: here the fixed loop exists by
default, so the risk is putting sim logic in `_process` by habit.

Processing is opt-in per node (`set_physics_process`), so tenet 8 (tick selectively) is
native: nodes that don't simulate simply don't process.

## Mapping

| Tenet | Godot primitive |
| --- | --- |
| Fixed sim step | `_physics_process(delta)`, `Engine.physics_ticks_per_second` |
| Variable render | `_process(delta)`, `physics_interpolation` (4.3+) |
| Unit of behaviour / module | **scene** (`.tscn`) = reusable module; `Node` = behaviour; `Resource` = data; autoload = global service |
| Decouple | **signals** ("signal up, call down"), groups, autoload event bus, `call_deferred` |
| Data-oriented (large-N) | no native ECS; drop to the **Servers** (`RenderingServer`/`PhysicsServer`) + `MultiMesh` + packed arrays |
| Determinism | fixed `_physics_process` + per-system seeded `RandomNumberGenerator` |
| Frame budget | ref-counting (no tracing GC) but node churn costs; object pooling *(idiom)*; static-typed GDScript; escalate to C#/GDExtension |
| Feel | `create_tween()` easing, `AnimationPlayer`, `GPUParticles2D/3D`, camera `offset` shake *(idiom)*, hit-stop via `Engine.time_scale` *(idiom)* |
| Testing | GUT / GdUnit4; pure logic + `Resource` + seeded sim test off-tree; nodes/physics need a running scene (GdUnit4 Scene Runner) |

## Notes

- **Module seam.** A scene "should keep everything it needs within itself" (scene
  organization). That self-contained scene is the deep-module seam for sim services;
  the Servers/`MultiMesh` path is the data-oriented regime for large-N.
- **No native ECS.** Third-party ECS addons exist but are non-idiomatic; prefer
  Servers + Resources + packed arrays before importing one.
- **Determinism.** Give each system its own seeded `RandomNumberGenerator` rather than
  global `randi()`. Godot gives no cross-platform float-determinism guarantee, so
  lockstep/replay is community practice (often fixed-point for the authoritative sim).
