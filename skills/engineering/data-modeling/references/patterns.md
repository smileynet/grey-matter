# Per-language patterns

The technique is universal; the **enforcement mechanism** and the gotcha that silently
defeats it are not. A review checks that the language's enforcement is actually wired up,
not only that the model looks tidy.

| Language | Sum type | Exhaustiveness | Wrapper type | Gotcha |
| --- | --- | --- | --- | --- |
| **Rust** | `enum` with data-carrying variants | Compiler-enforced on `match`; a missing arm fails to compile | Tuple struct `struct UserId(u64);`, zero-cost and distinct | A `_ =>` arm silently defeats exhaustiveness. A `bool` or `u8` state field bypasses the enum. |
| **TypeScript** | Discriminated union on a literal tag (`{kind:"a"} \| {kind:"b"}`) | `switch` with `default: assertNever(x)` narrowing to `never` | Branded type `type UserId = string & {__brand:"UserId"}` | Erased at runtime, enforced only when `tsc` runs. `any`, casts, and a `default:` without `assertNever` each break it silently. |
| **Python** | `Literal[...]`, `Enum`, or a union of dataclasses | `assert_never(x)` (3.11+ or `typing_extensions`) in the `else`, or `case _ as unreachable:` | `NewType("UserId", int)` (static only) or a frozen dataclass | No compile step: unless mypy or pyright runs in CI, nothing is enforced. A `match` without the unreachable arm has no exhaustiveness. |
| **Go** | No native support: a **sealed interface**, sealed by an unexported marker method `isX()` | Not built in; `//sumtype:decl` with the `go-check-sumtype` linter, run in CI | Named type `type UserId int64` (weak: implicit conversion from constants); prefer a struct wrapper | Interfaces are nilable, so every such sum type has an extra `nil` state to handle in each type switch. Without the linter a missed variant is silent. |

## What a review checks per language

1. **Rust:** no `_ =>` catch-all in a domain match; no `bool` where a variant belongs.
2. **TypeScript and Python:** the type checker runs in CI (otherwise union safety is
   worthless), and the `assertNever` / `assert_never` sentinel sits in the fallthrough.
3. **Go:** `//sumtype:decl` and `go-check-sumtype` are present and run; the `nil` case is
   handled.
4. **Every language:** wrapper types are built only through a validating constructor
   (parse, don't validate).

## Sources

- [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/), Alexis King: boundary parsing, smart constructors.
- [Make illegal states unrepresentable](https://corrode.dev/blog/illegal-state/) and [Using enums to represent state](https://corrode.dev/blog/enums/), corrode.dev.
- [Rust API guidelines: type safety](https://github.com/rust-lang/api-guidelines/blob/master/src/type-safety.md).
- [Python type hints: exhaustiveness checking](https://adamj.eu/tech/2022/10/14/python-type-hints-exhuastiveness-checking/), Adam Johnson.
- [Sum types in Go](https://appliedgo.net/spotlight/sum-types-in-go/), Applied Go: sealed interfaces, `go-check-sumtype`.
