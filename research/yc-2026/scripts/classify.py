"""Join YC company data with hand-reviewed labels and derive cross-cutting themes.

Domain model
------------
Company
  archetype : the *shape* of the idea (what is built and how it is sold)
  sector    : who the customer / market is
  ai_depth  : N AI-core | S AI supply chain | E AI-enabled | X non-AI
  themes    : cross-cutting signals detected from the text (multi-label)

Archetype/sector/ai_depth come from research/yc-2026/labels-2026.txt, which was
labelled by reading each company's one-liner and, where vague, its long
description. Themes are regex-detected so they are reproducible and auditable.

Usage: python3 research/yc-2026/scripts/classify.py
"""
import csv
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
DATA = ROOT / "data" / "yc-2026"
LABELS = ROOT / "research" / "yc-2026" / "labels-2026.txt"

ARCHETYPES = {
    "INF": "Agent & AI-app infrastructure",
    "TRU": "Agent reliability, evals & AI security",
    "DEV": "AI for software engineering",
    "MOD": "Models, inference & compute",
    "DAT": "Training data, RL environments & benchmarks",
    "VRT": "Vertical & functional AI software",
    "SVC": "AI-native services firm",
    "HOR": "Horizontal enterprise AI",
    "PHY": "Physical AI & robotics",
    "DEF": "Defense & national security",
    "SCI": "AI for science, bio & materials",
    "HRD": "Hard tech (space, energy, manufacturing, semis)",
    "CON": "Consumer apps & devices",
    "FIN": "Fintech & markets",
    "SEC": "Cybersecurity",
    "OTH": "Other software",
}
# Grouping of archetypes into the four "layers" used in the report.
LAYERS = {
    "AI stack (selling to AI builders)": ["MOD", "DAT", "INF", "TRU", "DEV"],
    "AI applications (selling to businesses)": ["VRT", "HOR", "SVC"],
    "Atoms (physical world)": ["PHY", "DEF", "HRD", "SCI"],
    "Other (consumer, fintech, security, misc.)": ["CON", "FIN", "SEC", "OTH"],
}
SECTORS = {
    "tech": "AI builders & software teams",
    "ent": "Horizontal / any business",
    "health": "Healthcare & life sciences",
    "fin": "Financial services & accounting",
    "ins": "Insurance",
    "legal": "Legal, compliance & government",
    "gtm": "Sales, marketing & customer experience",
    "hr": "HR, recruiting & workforce",
    "mfg": "Manufacturing, industrial & semis",
    "log": "Logistics, supply chain & distribution",
    "build": "Construction & real estate",
    "energy": "Energy, climate, ag & data-center infra",
    "def": "Defense, aerospace & space",
    "smb": "Retail, hospitality & local services",
    "cons": "Consumer, media & creators",
    "edu": "Education",
}
AI_DEPTH = {
    "N": "AI-core",
    "S": "AI supply chain (compute, chips, data-center power)",
    "E": "AI-enabled",
    "X": "Non-AI",
}

THEMES = {
    "agents": r"\bagents?\b|agentic|multi-agent|agent swarms?",
    "ai_employee_framing": r"\bai (employees?|workforce|teammates?|coworkers?|workers?|recruiters?|accountant|analyst|sdr|engineer|operator|actuary|dispatcher|doctor|scientists?|coach|founder|growth hire|quant|wealth manager|claims investigator|recruiting coordinator|event manager|career agent|interns?)\b|digital workers?|zero-human|robot workforce",
    "ai_native_rebuild": r"ai[- ]native|ai-first|agent[- ]first|agent-native|rebuilt? (the|around)|rebuild (the |how )",
    "runs_end_to_end": r"end[- ]to[- ]end|runs? (itself|themselves|autonomously|the entire|your business|businesses|factor)|that run |fully autonomous|full[- ]stack",
    "operating_system_framing": r"operating system|\bOS\b|operating layer|operating platform",
    "voice": r"\bvoice|speech|phone calls?|calls?\b|audio",
    "computer_use": r"computer[- ]use|desktop automation|computers? for agents|browser|interact with software|control (your|the) phone|screen",
    "forward_deployed": r"forward[- ]deployed|\bFDEs?\b",
    "context_memory": r"company brain|context\b|memory|knowledge graph|institutional (learning|knowledge)|tribal knowledge",
    "rl_simulation_world_models": r"\bRL\b|reinforcement learning|simulat|world models?|digital twins?",
    "humanoids_manipulation": r"humanoid|dexter|manipulat|robot arms?|pick and pack",
    "drones_autonomy": r"\bdrones?\b|\bUAVs?\b|unmanned|autonomous (vehicles?|trucks?|fleets?)|self-driving|counter-uas",
    "ai_compute_buildout": r"data cent(er|re)s?|\bGPUs?\b|inference|\bcompute\b|chips?\b|neocloud|AI clusters?",
    "reindustrialization": r"american|usa-made|us-made|\bU\.?S\.?-?(made|based)\b|reindustrial|domestic|sovereign|onshor|made in the usa|🇺🇸",
    "regulated_industries": r"regulated|complian|hipaa|fda|sec\b|finra|audit",
    "x_for_y_analogy": r"\b(vanta|datadog|stripe|crowdstrike|cursor|figma|legora|databricks|aws|openrouter|linkedin|venmo|patreon|whoop|oura|duolingo|mckinsey|deloitte|sentry|crosby|monsanto|shopify|starlink|s&p|google maps)\b",
    "claude_code_openclaw_refs": r"claude code|claude cowork|openclaw|codex|grok ?bot",
    "prediction_markets": r"prediction market",
    "stablecoins_crypto": r"stablecoin|crypto|onchain|on-chain|multi-chain|tokenized",
}
THEME_RX = {k: re.compile(p, re.I) for k, p in THEMES.items()}


def norm(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def load_labels():
    labels = {}
    for line in LABELS.read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        name, arch, sect, depth = [p.strip() for p in line.split("|")]
        assert arch in ARCHETYPES, line
        assert sect in SECTORS, line
        assert depth in AI_DEPTH, line
        labels[norm(name)] = (arch, sect, depth)
    return labels


def main():
    raw = json.loads((DATA / "companies-2026-raw.json").read_text())
    labels = load_labels()
    out, missing, used = [], [], set()
    for c in raw["companies"]:
        key = norm(c["slug"]) if norm(c["slug"]) in labels else norm(c["name"])
        if key not in labels:
            missing.append(f'{c["name"]} ({c["slug"]}): {c.get("one_liner")}')
            continue
        used.add(key)
        arch, sect, depth = labels[key]
        one = (c.get("one_liner") or "").strip()
        longd = (c.get("long_description") or "").strip()
        text = f"{one}\n{longd}"
        out.append({
            "name": c["name"], "slug": c["slug"], "batch": c["batch"], "one_liner": one,
            "archetype": arch, "archetype_label": ARCHETYPES[arch],
            "layer": next(l for l, codes in LAYERS.items() if arch in codes),
            "sector": sect, "sector_label": SECTORS[sect],
            "ai_depth": depth, "ai_depth_label": AI_DEPTH[depth],
            "themes": [k for k, r in THEME_RX.items() if r.search(text)],
            "yc_subindustry": c.get("subindustry"), "yc_tags": c.get("tags") or [],
            "location": c.get("all_locations"), "regions": c.get("regions") or [],
            "team_size": c.get("team_size"), "status": c.get("status"),
            "website": c.get("website"), "yc_url": c.get("url"), "long_description": longd,
        })
    unused = sorted(set(labels) - used)
    if missing or unused:
        print("UNLABELLED:", *missing, sep="\n  ")
        print("UNUSED LABELS:", *unused, sep="\n  ")
        sys.exit(1)
    meta = {"source": raw["source"], "source_last_updated": raw["source_last_updated"],
            "archetypes": ARCHETYPES, "layers": LAYERS, "sectors": SECTORS,
            "ai_depth": AI_DEPTH, "themes": list(THEMES)}
    (DATA / "companies-2026-classified.json").write_text(
        json.dumps({**meta, "companies": out}, indent=1, ensure_ascii=False))
    cols = ["name", "batch", "one_liner", "layer", "archetype_label", "sector_label", "ai_depth_label",
            "themes", "yc_subindustry", "location", "team_size", "status", "website", "yc_url"]
    with open(DATA / "companies-2026-classified.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for o in out:
            w.writerow({**o, "themes": ";".join(o["themes"])})
    print(f"classified {len(out)} companies")


if __name__ == "__main__":
    main()
