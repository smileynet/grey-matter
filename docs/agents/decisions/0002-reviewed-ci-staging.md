# ADR-0002: Build CI artifacts before the publication review

**Status:** accepted for staging implementation; publication integration pending
**Date:** 2026-10-23
**Deciders:** maintainer authorized release tooling and staging; agent selected this implementation

## Context

Publication needs a review of exact built files. That review commit R necessarily
comes after candidate C and its build. A tag-triggered publisher cannot obtain R
from C without a cycle. cargo-dist 0.32.0's custom publish hooks also run after its
built-in host has uploaded and undrafted the GitHub release.

## Decision

Generate manual build-only CI from pinned cargo-dist output, then supply R to a
separate authorized publication dispatch. Retain cargo-dist's platform build jobs;
a versioned wrapper removes its host/announce jobs, replaces the mutating plan
command and grants only contents:read. Every job checks the checkout/run SHA
against explicit C. A final job seals the exact built archives, installers and crate.

The later publisher must verify R, staging run/attempt, artifact IDs and digests,
then compare every file with the reviewed seal. It must download those bytes,
never rebuild or reseal them during publication. Expired or missing artifacts
require new staging and review. Publication capability remains ticket 68 work;
this decision authorizes no release or registry mutation.

## Consequences

Staging can run without tags or write credentials. The generator is pinned to
0.32.0 and rejects a changed job topology; its real output is checked by the
maintainer gate. Tool upgrades require reviewing the wrapper and generated diff.
Hosted platform builds replace the old manually edited self-hosted workflow.

Actions retention limits how long a staged candidate can be published. A separate
durable record must preserve whether a registry upload was attempted, including
when its outcome is unknown after runner loss. The proposed draft receipt still
needs transport, ownership and recovery tests before use.

## Alternatives considered

- Add a cargo-dist publish hook: preserves stock generation but runs after the
  built-in publisher. The observed ordering violates the review gate.
- Embed R in C or its release tag: creates a temporal cycle because R seals the
  outputs built from C.
- Rebuild on publication: avoids artifact retention but changes the reviewed bytes.
- Hand-edit generated YAML: hides drift. Use the checked generator wrapper instead.

## Evidence

[CI staging and registry intent research](../research/ci-staging-and-registry-intent.md)
records primary GitHub/Cargo sources, retention limits and the real generation
probe. [Pinned cargo-dist tasks](https://github.com/axodotdev/cargo-dist/blob/6886366640dd4da83d33ba55cc04aa58423cbad2/cargo-dist/src/tasks.rs#L1755)
set the source archive's committish to HEAD;
[its archive command](https://github.com/axodotdev/cargo-dist/blob/6886366640dd4da83d33ba55cc04aa58423cbad2/cargo-dist/src/lib.rs#L603)
uses that committish with git archive. Candidate SHA checks remain necessary.
The [release contract](../release-contract.md) retains one CI publisher for tkt.
