# grill-me

- Bucket: productivity. Invocation: user-invoked.
- Verdict: **keep** (as-is; one-line router into grilling).

## What it is

A router skill. Its entire body is "Call the Skill tool with grilling." It exists
so a human can type `grill-me` and be handed to the model-invoked `grilling`
primitive, giving the interview a clean, memorable user-facing entry point.

## What it does for the user

Gives the human a memorable handle for the interview when there's no working
directory to leave a paper trail in (otherwise `grill-with-docs` is preferred).
It is the user-invoked front door to grilling.

## Decision

**Keep as-is.** It is the router-skill pattern (`writing-for-agents`
SKILL-MECHANICS.md): one user-invoked skill naming a model-invoked one. Nothing to
adapt. It inherits grilling's three adaptations for free (it just invokes it). The
only harness coupling is the literal "Skill tool" dispatch, which maps to whatever
our target harness calls skill invocation.

## Cross-skill dependencies

Depends on: `grilling` (hard; meaningless without it). Keep the pair together.

## Web-app bias

None.
