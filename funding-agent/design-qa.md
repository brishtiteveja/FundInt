# Design QA — Funding Agent Workspace

## Evidence

- Live investor source: `https://eddyhdzg.com/vcs`, Map and Cards states captured August 4, 2026.
- Source map: `qa-eddy-map-1280x720.png` — 1280 × 720 CSS viewport and screenshot pixels.
- Source cards: `qa-eddy-cards-1280x720.png` — 1280 × 720 CSS viewport and screenshot pixels.
- Implemented map: `qa-funding-map-1280x720.png` — 1280 × 720 CSS viewport and screenshot pixels.
- Implemented list: `qa-funding-list-1280x720.png` — 1280 × 720 CSS viewport and screenshot pixels.
- Implemented calendar: `qa-application-calendar-1280x720.png` — 1280 × 720 CSS viewport and screenshot pixels.
- Mobile evidence: `qa-mobile-390x844-v2.png` — 390 × 844 CSS viewport and screenshot pixels.
- Earlier selected visual direction: `/Users/andy/.codex/generated_images/019fcd3d-1a84-7182-85ed-02838dacaa24/exec-24110170-7669-43b8-bd7d-4ecfb4a7da5d.png` — 1487 × 1058.
- State: Investors / Austin / Map, Investors / Austin / List, Applications / Calendar, and the persistent agent terminal.

## Findings

No unresolved P0, P1, or P2 findings.

- Typography: passed. The compact Inter and IBM Plex Mono hierarchy remains readable across the agent terminal, map/list/table controls, firm cards, graph labels, and application calendar.
- Spacing and layout: passed. The implementation preserves Eddy's search/filter/view anatomy while adding a bounded terminal above a synchronized research workspace. At 1280 × 720, the map remains 383 px tall and visible rather than being pushed below the viewport.
- Colors and tokens: passed. Eddy's near-black visual language is translated into Funding Agent's established charcoal, cyan, lime, amber, and green semantic tokens.
- Map quality: passed. The map uses real Carto/OpenStreetMap tiles and Leaflet markers. Austin shows 86 firms with source coordinates; the 41 records without coordinates remain available in List and Table instead of receiving invented locations.
- Copy and provenance: passed. The UI separates confirmed deadlines, rolling opportunities, unconfirmed dates, and user-entered milestones. It does not present unknown dates as facts.
- Agent boundary: passed. Persistent local memory, reports, plans, email identity, skills, and terminal flows are functional; Claude and Google OAuth are explicitly labeled as future secure integrations rather than simulated connections.
- Data parity: passed. A fresh import produced 127 unique records from the live Eddy page payload. Table and List expose all 127 through pagination, and Map exposes the 86 records with coordinates.

## Interaction and accessibility checks

- Map: 86 rendered Leaflet markers, a synchronized 86-firm side list, source-provenance label, and no document-level horizontal overflow.
- List: 12 cards on the first page; Table: 12 rows and `Showing 1–12 of 127`; pagination exposes subsequent pages.
- Applications: four tracked records, one confirmed dated milestone, three intentionally undated records, a 35-cell September 2026 calendar, and one agenda entry for Central Texas Angel Network.
- Calendar export: dated milestones produce a Google Calendar event URL; the global Google connection action accurately reports that OAuth is still required.
- Agent terminal: Analyze, Search, and Plan modes produce saveable artifacts; saved memory and reports survive reload; New session clears conversation history without deleting memory.
- Email: device-local email sign-in and sign-out work; Google sign-in remains disabled and labeled as the next integration.
- Responsive: the verified 390 × 844 state has no document-level horizontal overflow and keeps both the terminal and Funding Agent workspace reachable.
- Focus visibility covers buttons, inputs, selects, and links. View-mode buttons expose accessible names; controls use native links, buttons, and selects.
- Final build and browser reload complete without app errors.

## Comparison and fix history

- Pass 1 — [P1] Map rendered zero markers because Eddy stores longitude as `long`, not `lng`. The ingestion mapping was corrected; the post-fix audit renders 86 source-coordinate markers.
- Pass 2 — [P2] The short desktop map inherited the full 86-row side-list height, creating a 4174 px surface and placing useful markers off-screen. A bounded 520 px workspace was added for short desktops; the final map surface is 383 px high at 1280 × 720.
- Pass 3 — [P2] The first mobile terminal consumed 744 px before the product workspace. The skill strip and task rail were compressed to a 509 px terminal state while preserving every control.
- Pass 4 — [P2] The provider label implied an unverified ChatGPT model bridge. It now says `local workspace ready`; real model execution remains an explicit backend step.

## Follow-up polish

- [P3] The 870 kB production chunk should be split by lazy-loading Leaflet, React Flow, and the applications workspace when a backend is introduced.
- [P3] Firm logos are not present in every source record, so the implementation uses consistent initials rather than mixed placeholders and low-quality scraped imagery.

final result: passed
