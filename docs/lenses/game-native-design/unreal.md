# Unreal appendix

The game-native tenets ([SKILL.md](SKILL.md)) in Unreal Engine terms. The core is the
authority; this names the primitive, it does not re-teach the principle. Community
idiom (not official API) is marked *(idiom)*.

## The one that bites: there is no free fixed gameplay step

Unlike Godot's `_physics_process`, Unreal's gameplay `Tick(DeltaTime)` is **variable**
and **disabled by default** on new actors. A true fixed step exists only at the physics
layer (physics substepping). So tenet 2 takes real work: for most gameplay, accept
`DeltaTime`-scaled variable tick and reserve substepping for physics, or build an
explicit fixed-step accumulator for the authoritative sim. Do not assume a Godot-shaped
fixed loop exists.

Because `Tick` is opt-in and costly, Unreal culture **warns against over-ticking**,
which is tenet 8 stated from the other side: enable tick only on what simulates,
event-drive the rest.

## Mapping

| Tenet | Unreal primitive |
| --- | --- |
| Fixed sim step | physics **substepping**; else an explicit accumulator over `Tick` |
| Variable render / tick | `AActor::Tick` / `TickComponent`, tick groups |
| Unit of behaviour / module | `AActor` + `UActorComponent`; service = a `USubsystem` (world/game-instance) |
| Decouple | dynamic multicast **delegates** / Blueprint event dispatchers; `UInterface`; Subsystems as service locators |
| Data-oriented (large-N) | **Mass Entity** (Fragments + `UMassProcessor`); else Actors/Components |
| Determinism | `FRandomStream` seeded RNG; authoritative-server replication (Chaos physics is not bit-deterministic) |
| Frame budget | UObject **GC** pressure; avoid per-frame `SpawnActor`; object pooling *(idiom)*; C++ over Blueprint in hot paths; `stat unit`/Unreal Insights |
| Feel | Timelines / `UCurveFloat`, Niagara, `UCameraShakeBase`, hit-stop via `SetGlobalTimeDilation` |
| Testing | Automation (low-level, no world) / Functional (needs a PIE level) / Gauntlet (session) |

## Notes

- **Module seam.** The real reusable unit is a `UActorComponent` or a `USubsystem`
  (a typed, decoupled service), not the `AActor` subclass tree. Deep-module thinking
  belongs on Subsystems/services; Mass is the data-oriented regime for crowds/large-N.
- **Mass Entity** is Unreal's native ECS for large-N; reach for it for crowds, not for
  a handful of actors. (Godot has no first-party equivalent.)
- **Determinism.** Chaos is not bit-deterministic, so lockstep is not the idiom;
  Unreal games use authoritative-server replication with prediction. Seed gameplay RNG
  with `FRandomStream`.
