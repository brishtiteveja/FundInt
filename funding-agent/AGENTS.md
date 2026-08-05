# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Selected product direction

- The selected source visual is the most recent ideation Option 3, "Deal Graph Workbench".
- Preserve the dense dark table, interactive deal graph, source-verification rail, and three-firm comparison tray.
- Deadline provenance is a hard product constraint: show rolling, confirmed, predicted, stale, or relationship-driven states honestly instead of inventing dates.
- Austin is the default geography, with San Francisco available as a first-class switch.
- Keep the agent layer visible at the top: terminal-style research, analysis, planning, saved artifacts, persistent memory, and explicit skill controls.
- Investor discovery must support synchronized map, list/card, and table views over the same filters and source data.
- Application tracking is a core workspace: saved applications, deadlines, timeline/calendar views, and a future Google Calendar connection point.
- Authentication should start with email; Claude, Hermes, ChatGPT, and Google connections must be represented honestly and require real backend OAuth before production use.
- Web-terminal tasks execute through the installed Hermes CLI in `--safe-mode` using OpenAI Codex and the non-destructive `todo` toolset only. Never expose terminal, file, browser, or code-execution toolsets through the web endpoint.
- Email codes are hashed, sessions use HttpOnly SameSite cookies, and memories, reports, and applications are scoped by user in the server-side local store. Development may reveal a code; production must deliver it through the configured email provider.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
