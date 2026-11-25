# Standards rubric: apps

The smell baseline for the Standards axis on an app/general codebase: a fixed set of
Fowler code smells (_Refactoring_, ch.3). Applies on top of whatever the repo
documents, even when it documents nothing.

- **The repo overrides.** A documented repo standard always wins; where it endorses
  something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature
  Envy"), never a hard violation. Skip anything tooling already enforces.

Each smell reads *what it is* -> *how to fix*; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. -> rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. -> extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. -> move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). -> bundle them into one type, pass that.
- **Representable Invalid State**: the type admits a combination the domain forbids (dependent flags like `held` + `sold`, fields valid only in some states, a stored count beside the collection it counts). -> a variant type carrying its data; derive what can be derived instead of storing it. Skip a lone genuine boolean, a private type with three or fewer use sites, and prototypes. When a diff changes types or schemas, the data-modeling review lens carries the full gates and the per-language exhaustiveness checks.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. -> give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. -> replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. -> gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. -> split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. -> delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. -> hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. -> cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. -> drop the inheritance, use composition.

## Iterative erosion and verbosity smells

Prior art: `SprocketLab/slop-code-bench` (`configs/rubrics/llm_judge.jsonl` and `criteria_with_pn.j2`). Across multi-step changes, code tends to erode through silent masking and accumulate LLM verbosity. Same rules apply (judgement calls only; skip what tooling enforces):

- **Silent Fallbacks & Error Destruction**: multi-source fallback chains (`a or b or c`) that hide which path succeeded, or catching a specific error and raising a generic string that strips root cause. -> log or propagate the chosen source; wrap errors with context while preserving cause. *Flag:* `catch ValidationError -> raise Error("Invalid input")`. *Skip:* fallbacks that log which branch ran, or safe user messages that preserve internal detail in structured logs.
- **Lenient Parsing & Silent Auto-Correction**: guessing/defaulting malformed input (`int(x) if x.isdigit() else 0`), silently clamping/truncating data, or auto-creating missing directories/files/tables in core logic instead of failing fast. -> validate strictly and fail or warn explicitly. *Flag:* `name = name[:50]` or `makedirs(..., exist_ok=True)` inside business logic without warning. *Skip:* documented boundary normalization or explicit setup/init steps.
- **Validation Theater**: validation checks that run, collect errors, or log warnings yet allow execution to proceed on invalid state. -> return/raise on failure so invalid state cannot continue. *Flag:* ignored `validate()` return values or log-and-proceed guards. *Skip:* explicit advisory warnings where the spec permits proceeding.
- **Sentinel Values & Boolean Success Flags**: magic `-1`/`""`/`0` or bare `(val, ok)` / `bool` returns where callers need failure reasons. -> return rich typed variants (`Result`/`Option` or structured error). *Flag:* `return -1` for both "missing" and "error". *Skip:* pure membership predicates (`contains()`) or documented boundary conventions.
- **Narration Comments & Echo Docstrings**: `# Step 1: init list` comments restating the next line, docstrings that only repeat the function name, or entry/exit debug logs in short (<20-line) pure helpers. -> delete noise; reserve comments for *why*, invariants, and non-obvious ordering. *Flag:* `# Loop through items` above `for item in items:`. *Skip:* comments explaining workarounds, concurrency/order constraints, or public contracts.
- **Redundant Boundary Guards**: checking the same unchanged variable for null/empty twice in close proximity, `??`/`or default` on required constructor/validated fields, or handling cases the spec explicitly excludes. -> trust internal invariants validated at the seam. *Flag:* `self.name or "unknown"` when `name` is required by construction. *Skip:* checks after reassignment or at real external/IO boundaries.
- **Single-Entry Registry / Constant Factory**: a dispatch map with one entry, a factory always returning one concrete type, or a strategy field never varied or injected. -> instantiate or call the concrete implementation directly until a second variant arrives. *Flag:* `HANDLERS = {"default": DefaultHandler()}` with one key. *Skip:* registries populated dynamically or framework extension points.
