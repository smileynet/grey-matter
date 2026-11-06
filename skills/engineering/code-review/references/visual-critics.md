# Browser and visual evidence for critics

Use this reference when reviewing UX, layout, typography, style, responsive
behavior, or visual state changes. Bind the review to the candidate and the
actual build, page, or file. Inspect the required views and states at the
project's supported widths. Pair a screenshot with a concrete interaction or
measurement when the finding is about behavior, clipping, hierarchy, or focus.

## Choose and preflight the evidence lane

Prefer the harness's authorized browser when reviewing its live tab, signed-in
context, or native surface. Use the project's existing Playwright suite, or an
already configured Playwright MCP tool, for repeatable independent browser
checks. Verify access to the target URL or file, the exact browser and viewport,
keyboard or pointer actions, and a readable screenshot before assigning visual
acceptance. Use an owned browser context and close it after the review. A refusal
stays in force across tool choices. If the lane is unavailable, report the
missing coverage and continue the independent checks that can run.

In Playwright, drive controls by role or label, wait for the observed state,
and capture the relevant viewport or element at readable scale. Check keyboard
focus, overflow and clipping, before/after layout, labels and color hierarchy,
and representative empty, busy, and error states where applicable. Record the
viewport, URL, build identity, steps, and capture. Inspect the pixels using an
image-capable reader. A screenshot filename or accessibility tree establishes
neither legibility nor visual acceptance. Use DOM and accessibility observations
to support interaction claims. A simulated viewport does not qualify a physical
device. [Screenshots](https://playwright.dev/mcp/tools/screenshots) ·
[Emulation](https://playwright.dev/docs/emulation) ·
[Locators](https://playwright.dev/docs/api/class-locator)

## Harness routes checked on 2026-11-05

The table records documented routes and separately identifies local observations.
Check the current session's actual tools, grants, model image input, and browser
reachability. An attachment option alone does not prove pixels reach the critic.

| Harness | Browser and image routes | Local evidence and limits |
| --- | --- | --- |
| Codex | Desktop built-in browser and browser extension are separate surfaces. Use the exposed browser tool for the authorized tab and the image viewer for local captures. CLI accepts initial prompt images via `--image`. [Browser](https://learn.chatgpt.com/docs/browser) · [Local CLI surface](../../../../docs/agents/harness-surfaces/codex.md) | `codex --help` showed `--image`. The desktop session exposed browser control and read actual local PNG captures with its image viewer. The local Playwright result below is a separate lane. |
| Claude Code | Chrome integration can inspect and capture a live browser when connected. Desktop also documents a preview pane. Image analysis accepts pasted images or a local image path. [Chrome](https://code.claude.com/docs/en/chrome) · [Desktop](https://code.claude.com/docs/en/desktop) · [Images](https://code.claude.com/docs/en/common-workflows#work-with-images) | `claude --help` showed `--chrome`. Extension connectivity and image delivery to a Claude critic remain untested here. |
| Kiro CLI and IDE | CLI V3 documents image paths and clipboard images. IDE documents image inputs. CLI MCP can supply an authorized browser tool. [CLI V3](https://kiro.dev/docs/cli/v3/) · [IDE](https://kiro.dev/ide/) · [CLI MCP](https://kiro.dev/docs/cli/mcp/) | No new Kiro session run. Check the installed CLI generation and agent grants before using these routes. |
| Kiro Web | The Web sandbox documents headless Chrome and preinstalled browser tools including Playwright MCP. [Sandbox](https://kiro.dev/docs/web/sandbox/#browser-automation) | Documentation only. Confirm image delivery and target reachability in the selected sandbox. |
| Kiro Crew | The dashboard agent browser documents screenshot capture. Playwright is a separate optional MCP integration. [Agent browser](https://kiro.dev/changelog/crew/0-3/) · [MCP](https://kiro.dev/docs/crew/capabilities/mcp-tools/) | Documentation only. Confirm the actual worker's browser and image permissions. Existing trust restrictions apply. |
| Antigravity | `/browser` delegates to the Chrome browser subagent for interaction and capture. The vendor documents screenshot artifacts and image inputs. [Browser](https://antigravity.google/docs/commands/browser/) · [Screenshots](https://antigravity.google/docs/ide/screenshots) · [Image handling](https://antigravity.google/docs/changelog) | Documentation only. Execution remains held under the [harness policy](../../../../docs/agents/harness-surfaces/models-and-usage.md). |
| OpenCode | Configured MCP servers can provide browser automation. The v1.2.15 `read` implementation returns raster images as attachments. [MCP](https://opencode.ai/docs/mcp-servers/) · [Read tool](https://github.com/anomalyco/opencode/blob/v1.2.15/packages/opencode/src/tool/read.ts#L979) | Upstream source is not a qualification of the installed build or its selected model. |
| Crush | The project documents configurable MCP tools. Its upstream issue tracker records a clipboard image attachment path with a Windows failure case. [MCP](https://github.com/charmbracelet/crush#mcps) · [Image attachment issue](https://github.com/charmbracelet/crush/issues/2535) | Native browser control and end-to-end image input remain unqualified here. Verify the exact route before assigning visual review. |

Local reproducible lane: installed `playwright-core` 1.64.1 and Chrome, with
`PLAYWRIGHT_MODULE` and `CHROME_BIN` set for
`node --test --test-timeout=20000 scripts/delivery-dashboard-browser.test.mjs`.
Six of six cases passed, including keyboard interactions and narrow/wide
viewports. This qualifies the existing local fixture route, not a browser MCP
server or another harness. Earlier local dashboard captures were opened and
read in the desktop viewer.
