# domain-modeling

- Bucket: engineering. Invocation: model-invoked.
- Verdict: **keep**.

## What it is

The active discipline of building and sharpening a project's domain model:
challenge terms against `GLOSSARY.md`, resolve overloaded words, stress-test with
concrete scenarios, cross-check against code, and record hard-to-reverse decisions
as ADRs, keeping the glossary implementation-free.

## What it does for the user

Builds a shared language between human and agent, which reduces verbosity, keeps
naming consistent, and makes the codebase navigable. The crisp "write an ADR only
when a decision is hard-to-reverse AND surprising-without-context AND has a real
trade-off" rule keeps the ADR log from bloating.

## Decision

**Keep.** Fully portable, no tracker or harness coupling. It is a keystone: the
GLOSSARY/ADR layout it produces is assumed by many other skills, and grey-matter
already dogfoods it (`GLOSSARY.md` with the tkt/skills crosswalk is exactly this
skill's output). Keep its ADR test and the "glossary is a glossary, nothing else"
rule verbatim.

## Cross-skill dependencies

The engine behind grill-with-docs (paired with grilling). Consulted by triage,
wayfinder, improve-codebase-architecture. Produces `GLOSSARY.md` + ADRs that tdd,
diagnosing-bugs, and others read passively.

## Web-app bias

None in the discipline itself. One note for the game lens: a game's domain model
includes mechanics, systems, and feel vocabulary, so the glossary this builds for a
game project should capture those terms. The skill needs no change; the game lens
simply benefits from it being run.
