# YC 2026: what ideas got funded

Snapshot: **YC directory as of 2026-11-07** (via the open [yc-oss](https://github.com/yc-oss/api) mirror of ycombinator.com/companies)
Scope: **all 832 companies** in Winter (197), Spring (192), Summer (227) and Fall (216) 2026, compared with the 620 companies of the four 2025 batches.

- Full list, labelled: [`data/yc-2026/companies-2026-classified.csv`](../../data/yc-2026/companies-2026-classified.csv) (JSON version includes long descriptions)
- Hand labels: [`labels-2026.txt`](labels-2026.txt) · Pipeline: [`scripts/`](scripts/)
- Interactive dashboard: https://claude.ai/artifact/TNu1uVULmF6tjfEQNTp4tx (private until shared)

## The short version

1. **AI is the default. The question now is which layer you bet on.** 84% of 2026 companies are AI-core (81%) or build AI's supply chain such as chips, compute markets and data-center power (2%). The share of descriptions that mention AI at all was flat from 2025 (78%) to 2026 (76%). AI stopped being a category and became the medium, much like "internet company" did around 2000.
2. **The biggest bucket is still "an agent that does one job in one industry."** Vertical and functional AI software is 28% of the year (231 companies). Most of it goes to sales/GTM, finance and accounting, healthcare admin, manufacturing ops, local services, construction and legal.
3. **A full quarter of YC sells to other AI builders.** 27.5% (229) sell picks and shovels: models, inference and compute (54), agent infrastructure (60), training data and RL environments (45), coding-agent tooling (42), and the agent trust layer of evals, observability and security (28).
4. **The atoms are back.** YC's own "Industrials" tag went from 10% of 2025 companies to 19.5% in 2026. Robotics and physical-AI mentions more than doubled (4.8% → 10.8%), defense doubled (2.4% → 5.0%), and inference, GPU and data-center mentions more than doubled (3.7% → 8.4%).
5. **"AI-native firm" is the new business model to watch.** Companies calling themselves "AI-native" doubled (6.5% → 12.7%). Full-stack firms that sell the outcome (a law firm, accounting firm, brokerage or insurer run by agents) rose from under 1% of 2025 descriptions to 4%; by hand count there are 57 of them in 2026 (6.9%).
6. **An "agent economy" stack is forming in real time.** 88 companies (10.6%) build infrastructure or a trust layer for agents as customers: computers and sandboxes for agents, wallets and payments for agents, phone numbers and identity for agents, ways to get your product picked by coding agents, and markets where agents hire humans.

An analogy for the whole year: **2023–24 was building the engine (models). 2025 was putting the engine in cars (copilots). 2026 is building the road network around self-driving cars**: fuel stations (compute), driving schools (RL environments), traffic police (evals and security), toll booths and wallets (agent payments), and taxi companies that sell the ride instead of the car (AI-native services firms).

## How the ideas were classified

Each company was read and given three labels by hand (one-liner first, long description when the one-liner was vague):

- **Archetype**: the shape of the idea (what is built and how it is sold). 16 archetypes grouped into four layers.
- **Customer sector**: who pays.
- **AI depth**: AI-core, AI supply chain, AI-enabled, non-AI.

Cross-cutting **themes** (agents, voice, computer use, company brain, RL/simulation, reindustrialization, and so on) are detected with regular expressions so they are reproducible. The 2025 comparison uses the **same regexes on both years**, because only 2026 was hand-labelled.

## Layers and archetypes

| Layer | Companies | Share |
|---|---:|---:|
| AI applications (selling to businesses) | 331 | 39.8% |
| AI stack (selling to AI builders) | 229 | 27.5% |
| Atoms (physical world) | 154 | 18.5% |
| Other (consumer, fintech, security, misc.) | 118 | 14.2% |

| Archetype | Companies | Share | Winter | Spring | Summer | Fall |
|---|---:|---:|---:|---:|---:|---:|
| Vertical & functional AI software | 231 | 27.8% | 65 | 60 | 56 | 50 |
| Physical AI & robotics | 62 | 7.5% | 10 | 12 | 23 | 17 |
| Agent & AI-app infrastructure | 60 | 7.2% | 9 | 14 | 16 | 21 |
| AI-native services firm | 57 | 6.9% | 8 | 14 | 23 | 12 |
| Consumer apps & devices | 54 | 6.5% | 13 | 12 | 8 | 21 |
| Models, inference & compute | 54 | 6.5% | 13 | 10 | 16 | 15 |
| Training data, RL environments & benchmarks | 45 | 5.4% | 10 | 7 | 18 | 10 |
| Horizontal enterprise AI | 43 | 5.2% | 9 | 15 | 9 | 10 |
| AI for software engineering | 42 | 5.0% | 10 | 10 | 10 | 12 |
| AI for science, bio & materials | 37 | 4.4% | 10 | 7 | 10 | 10 |
| Hard tech (space, energy, manufacturing, semis) | 35 | 4.2% | 7 | 7 | 10 | 11 |
| Fintech & markets | 32 | 3.8% | 9 | 7 | 9 | 7 |
| Agent reliability, evals & AI security | 28 | 3.4% | 10 | 5 | 5 | 8 |
| Defense & national security | 20 | 2.4% | 2 | 5 | 8 | 5 |
| Cybersecurity | 18 | 2.2% | 5 | 4 | 5 | 4 |
| Other software | 14 | 1.7% | 7 | 3 | 1 | 3 |

Momentum within the year: vertical AI is **declining as a share** (33% of Winter to 23% of Fall), while **agent infrastructure more than doubled** (9 → 21), physical AI peaked in Summer (23), and AI-native services firms peaked in Summer (23). Consumer jumped in Fall (21), mostly AI-first devices and personal agents. Fall 2026 is still filling in on YC's site.

## Who the customer is

| Customer sector | Companies | Share | Top archetypes |
|---|---:|---:|---|
| AI builders & software teams | 263 | 31.6% | Agent infra (58), Models & compute (49), Training data & RL (42) |
| Healthcare & life sciences | 72 | 8.7% | Vertical AI (28), Science & bio (18), Consumer (9) |
| Financial services & accounting | 71 | 8.5% | Vertical AI (33), Fintech & markets (17), AI-native firms (13) |
| Manufacturing, industrial & semis | 58 | 7.0% | Vertical AI (26), Physical AI (16), Hard tech (10) |
| Horizontal / any business | 53 | 6.4% | Horizontal enterprise AI (41) |
| Consumer, media & creators | 50 | 6.0% | Consumer apps & devices (37) |
| Defense, aerospace & space | 42 | 5.0% | Defense (20), Hard tech (11) |
| Sales, marketing & CX | 40 | 4.8% | Vertical AI (36) |
| Energy, climate, ag & data-center infra | 34 | 4.1% | Hard tech (10), Physical AI (9) |
| Retail, hospitality & local services | 31 | 3.7% | Vertical AI (23) |
| Logistics, supply chain & distribution | 30 | 3.6% | Vertical AI (12), Physical AI (9), AI-native firms (6) |
| Legal, compliance & government | 25 | 3.0% | Vertical AI (18), AI-native firms (7) |
| Construction & real estate | 24 | 2.9% | Vertical AI (18) |
| Insurance | 20 | 2.4% | Vertical AI (8), AI-native firms (8) |
| HR, recruiting & workforce | 14 | 1.7% | Vertical AI (9) |
| Education | 5 | 0.6% | — |

Where verticals choose **software vs. services**: in insurance, AI-native firms already match software 8 to 8; finance and accounting is 13 firms to 33 software companies; legal is 7 to 18. The more a market buys an outcome (a closed book, a bound policy, a filed case), the more founders choose to *be* the firm rather than sell to it.

## What changed since 2025 (same regex, both years)

| Signal | 2025 | 2026 | Δ pts |
|---|---:|---:|---:|
| Mentions AI / ML / LLM / agents | 77.6% | 75.6% | −2.0 |
| Mentions agents / agentic | 39.2% | 40.7% | +1.5 |
| Self-described "AI-native" | 6.5% | 12.7% | **+6.2** |
| Robots / humanoids / physical AI | 4.8% | 10.8% | **+6.0** |
| Inference / GPUs / data centers | 3.7% | 8.4% | **+4.7** |
| AI-native firm (law/accounting/brokerage/agency) | 0.8% | 4.1% | **+3.3** |
| Defense / drones / counter-UAS | 2.4% | 5.0% | **+2.6** |
| Coding agents / AI dev tools | 4.0% | 6.5% | +2.5 |
| RL environments / evals / benchmarks | 4.5% | 5.8% | +1.3 |
| Training data for frontier labs / robotics | 2.1% | 3.4% | +1.3 |
| AI employee / AI workforce framing | 2.3% | 2.8% | +0.5 |
| Healthcare | 10.2% | 10.5% | +0.3 |
| Prediction markets | 0.5% | 0.8% | +0.3 |
| Computer-use / browser agents | 1.5% | 1.2% | −0.3 |
| Stablecoins / crypto | 1.8% | 1.3% | −0.5 |
| Voice AI | 4.2% | 2.2% | **−2.0** |

YC's own industry tags tell the same story: **Industrials 64 → 162 companies (10.3% → 19.5%)**, Fintech 35 → 71 (5.6% → 8.5%), while B2B fell from 65% to 56% of the batch and Education nearly vanished (11 → 2).

Voice AI cooled as a *headline*: it was a 2025 category, and in 2026 it is a feature inside vertical agents (dental front desks, home-services dispatch, debt collection) rather than the pitch.

## Twelve idea patterns (with examples)

1. **An agent that does one job in one industry.** Prior auths (ClaimGlide, Janeen), construction takeoffs (Bidflow, Rudus), mortgage origination (Copperlane), freight brokerage ops (Burt), hotel ops (Lance, Zaplar), home services (Robby, Fleety, Bernard), factory ops (Walter, Sidekick, horizontal.), distributors (Ventura, Lark, Whitespace, Asakana).
2. **AI-native services firms: sell the outcome, not the software.** Law (Vector Legal, LegalOS, Moritz, General Legal, Wingman Law), accounting and tax (Balance, Bear, Rational, Billow AI Labs, ClaimKit), insurance carriers and brokers (Hedge, Florin, Kinro, Panta, Prescience), customs and freight brokers (Alchemize, Peer, TrueMile), medical groups (Radley, Allia Health, Sunflower), plus "AI-native McKinsey" (Foaster) and AI hedge funds (Standard Signal, Spectre Intelligence).
3. **Picks and shovels for the agent economy.** Computers and sandboxes for agents (Orgo, Boat, InstaBox, Agent 37, Superserve, machine0, Ardent, Archal), payments and spending controls (Orthogonal, Sponge, Maven, Agentcard, Versine, Allowance, o11), identity and comms (AgentPhone, Inkbox, Clawvisor, primitive), getting found by agents, i.e. SEO for agents (Scope, Armature, Manicule, Rainbrand, Sitefire), and humans as an API for agents (Humwork, RentAHuman).
4. **The agent trust layer.** Agent observability and evals from production runs (Sentrial "Datadog for agent reliability", Moda, Papaya, Stacktrace, Mirrors, BentoLabs AI), agent security (Traceforce "CrowdStrike for AI agents", Silmaril, Fabraix, Armorer Labs, Salus), AI spend control (Carrot Labs, Caveman, Codag), even liability insurance for agents (Klaimee).
5. **Selling to frontier labs.** RL environments (Fern, Twolabs, Reific, Epsilab, Enact, ORO AI, Rystic, Olam Labs), human and robot data (Asimov, Human Archive, Hub, Markov, Perit.AI, Hemlock, Preload), benchmarks (ARC Prize Foundation, CoArena, MusicArena, Robocurve). Think of these as **the textbook publishers and exam boards** for models.
6. **Tooling around coding agents.** The coding agent itself is assumed; new companies orchestrate many of them (Emdash, Linzumi, Vespin, Agent Relay, Replicas, Boxes.dev), verify their output (e2e, Plover Labs, Composal, Aucert, Simulithic), or run production for them (IncidentFox, Mendral, HyperProbe, Corelayer). Several pitch as "Claude Code for X" (REV1 and Aurorin CAD for mechanical engineering).
7. **Company brain and forward-deployed engineering.** Capture tribal knowledge as context for agents (Savant, Hyper, Memory Store, Almanac, GodHands, Ontora, Sona8), or send engineers on site to rebuild operations agent-first (Marker, Khotan, Hessian, Trope, Lab0, flowscope).
8. **Physical AI.** Humanoids (OS3, Nori at $1,688, Theseus Robotics), manipulation (Origami Robotics, Axonnic, Shiraz AI), AI-run factories (Tenet Industries, Antropi Robotics, Prototyping.io, ProvenMetal, Tensr), robots that build and maintain data centers (Proprio Robotics, Pacific, Shepherd Robotics, Libra Robotics).
9. **Cheap, mass-produced defense.** Counter-drone (9 Mothers, Surtr Defense Systems, IMPACT Drones, Caladh, Keres), AI-guided munitions built for volume (Polemos Industries, Isengard Industries), passive sensing (Arlo Industries, Vernius Systems, Milliray).
10. **Compute as an asset class, and the power behind it.** GPU and inference markets, credit and insurance (Stoa, Touchmark, Computable, ernd, Masterpiece, PRINCEPS), plus data-center power and cooling (Voxel Energy, Madrone, Atomarine, Aikido Technologies, Liquid Energy, Viraj Aero).
11. **Hardware built around an agent.** Phones, wearables and input devices where the agent replaces the app grid (Raven, Cyclon, Vexo, Pocket, Button Computer, antimattr, The Subvocal Company, Sentient OS).
12. **Autonomous scientists.** Drug discovery (CellType, WonderTx, Atlas Discovery), materials (Discovered Materials, 83 Sciences), research agents and labs (rekursiv.ai, Antinuous, Aster, Autoresearch, Primordiant).

## Reading the map backwards: what this implies if you are pitching

Working back from "what does a fundable 2026 idea look like":

- **"AI for X" alone no longer differentiates.** The differentiator is the **layer** (stack, application, atoms) and the **business model** (software seat, usage, or the full outcome as a services firm).
- **Crowded:** sales/GTM agents (36 vertical companies plus horizontal ones), coding-agent tooling (42), agent sandboxes/computers (a dozen-plus near-identical pitches), RL environments (more than ten). New entrants here need a sharp wedge.
- **Rising and still thin:** AI-native firms in insurance, tax, customs, trucking and medicine; agent payments and identity; robotics for data-center build-out; compute financialization; defense manufacturing at volume.
- **Thin in 2026, possibly white space or possibly out of favor:** education (5 companies), HR and recruiting (14), government (a handful), climate outside of powering data centers, consumer social. Treat these as places where you need a stronger "why now".

## Caveats

- Labels are analyst judgment; boundary cases exist (for example, "AI agents for banks" vs. "AI-native back office for banks"). The label file is versioned so it can be reviewed and corrected.
- YC lists companies after launch, so a few per batch may be missing. **Fall 2026 is still being added** and will grow.
- YC's directory does not publish funding amounts or valuations, so this measures **count of companies funded**, not dollars.
- The 2025 comparison is keyword-based, not hand-labelled, so it understates shifts that do not change vocabulary.

## Reproduce

```bash
python3 research/yc-2026/scripts/fetch_yc.py    # download 2025 + 2026 batches
python3 research/yc-2026/scripts/classify.py    # join hand labels, detect themes; fails on unlabelled companies
python3 research/yc-2026/scripts/analyze.py     # tables + data/yc-2026/summary.json + dashboard CSVs
```

When new Fall companies appear, `classify.py` lists them as unlabelled; add a line for each to `labels-2026.txt` and re-run.
