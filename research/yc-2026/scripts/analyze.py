"""Aggregate the classified 2026 dataset and compare keyword signals with 2025.

Writes data/yc-2026/summary.json (used by the dashboard) and prints markdown
tables used in the report.

Usage: python3 research/yc-2026/scripts/analyze.py
"""
import collections
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[3]
DATA = ROOT / "data" / "yc-2026"
BATCHES = ["Winter", "Spring", "Summer", "Fall"]
CODE = {"Winter": "W", "Spring": "X", "Summer": "S", "Fall": "F"}  # YC's own batch codes

# Same regexes applied to both years' text (one-liner + long description).
SIGNALS = {
    "Mentions AI / ML / LLM / agents": r"\b(AI|A\.I\.|LLMs?|GPT|machine learning|agents?|agentic|foundation models?|generative)\b",
    "Mentions agents / agentic": r"\bagents?\b|agentic",
    "Self-described 'AI-native'": r"ai[- ]native",
    "AI employee / AI workforce framing": r"\bai (employees?|workforce|teammates?|coworkers?|workers?)\b",
    "AI-native firm (law/accounting/brokerage/agency)": r"ai[- ]native (law|legal|accounting|tax|insurance|brokerage|customs|recruiting|growth|engineering|med|cro|freight|trucking|debt|property|procurement|immigration|personal injury|investor|radiology|benefits)|(ai|autonomous)[- ]?(native )?(law|accounting) firm|zero-human",
    "RL environments / evals / benchmarks": r"\bRL environments?|reinforcement learning|\bevals?\b|benchmarks?",
    "Training data for frontier labs / robotics": r"training data|frontier (ai )?labs?|data for (robots|robotics|physical ai)|egocentric",
    "Robots / humanoids / physical AI": r"robot|humanoid|physical ai",
    "Defense / drones / counter-UAS": r"\bdefen[cs]e\b|military|counter[- ]?(drone|uas)|\bdrones?\b|missile|warfighter",
    "Voice AI": r"\bvoice (ai|agents?|models?)|speech models?",
    "Computer-use / browser agents": r"computer[- ]use|browser (infra|agents?)|computers? for agents",
    "Inference / GPUs / data centers": r"inference|\bGPUs?\b|data cent(er|re)s?|neocloud",
    "Coding agents / AI dev tools": r"coding agents?|claude code|cursor|\bcodex\b|ai (software|devops|sre) engineer|vibe[- ]?cod",
    "Healthcare": r"health|medical|patient|clinic|pharma|drug",
    "Prediction markets": r"prediction markets?",
    "Stablecoins / crypto": r"stablecoin|crypto|onchain|blockchain",
}
SIG_RX = {k: re.compile(v, re.I) for k, v in SIGNALS.items()}


def text(c):
    return f'{c.get("one_liner") or ""}\n{c.get("long_description") or ""}'


def pct(n, d):
    return round(100 * n / d, 1) if d else 0.0


def signal_table(rows):
    n = len(rows)
    return {k: pct(sum(bool(r.search(text(c))) for c in rows), n) for k, r in SIG_RX.items()}


def main():
    d26 = json.loads((DATA / "companies-2026-classified.json").read_text())
    c26 = d26["companies"]
    c25 = json.loads((DATA / "companies-2025-raw.json").read_text())["companies"]
    raw26 = json.loads((DATA / "companies-2026-raw.json").read_text())["companies"]
    C = collections.Counter
    n = len(c26)

    batch_counts = {f"{b} 2026": sum(c["batch"] == f"{b} 2026" for c in c26) for b in BATCHES}
    batch_counts_25 = {f"{b} 2025": sum(c["batch"] == f"{b} 2025" for c in c25) for b in BATCHES}

    arch = C(c["archetype"] for c in c26)
    layer = C(c["layer"] for c in c26)
    sect = C(c["sector"] for c in c26)
    depth = C(c["ai_depth"] for c in c26)
    themes = C(t for c in c26 for t in c["themes"])

    by_batch_arch = {b: dict(C(c["archetype"] for c in c26 if c["batch"] == f"{b} 2026")) for b in BATCHES}
    by_batch_depth = {b: dict(C(c["ai_depth"] for c in c26 if c["batch"] == f"{b} 2026")) for b in BATCHES}
    matrix = C((c["sector"], c["archetype"]) for c in c26)

    sig26, sig25 = signal_table(raw26), signal_table(c25)
    sig_by_batch = {}
    for y, rows in (("2025", c25), ("2026", raw26)):
        for b in BATCHES:
            sub = [c for c in rows if c["batch"] == f"{b} {y}"]
            sig_by_batch[f"{CODE[b]}{y[2:]}"] = signal_table(sub)

    yc_ind = {"2025": dict(C(c["industry"] for c in c25)), "2026": dict(C(c["industry"] for c in raw26))}
    regions = C()
    for c in c26:
        r = c["regions"]
        regions["US/Canada" if "America / Canada" in r else "Europe" if "Europe" in r else "Asia" if any(x in r for x in ("South Asia", "East Asia", "Southeast Asia")) else "Other/unspecified"] += 1
    team = [c["team_size"] for c in c26 if c["team_size"]]
    team.sort()

    summary = {
        "source": d26["source"], "source_last_updated": d26["source_last_updated"], "total": n,
        "batch_counts": batch_counts, "batch_counts_2025": batch_counts_25,
        "archetypes": d26["archetypes"], "layers": d26["layers"], "sectors": d26["sectors"], "ai_depth_labels": d26["ai_depth"],
        "archetype_counts": dict(arch), "layer_counts": dict(layer), "sector_counts": dict(sect),
        "ai_depth_counts": dict(depth), "theme_counts": dict(themes),
        "by_batch_archetype": by_batch_arch, "by_batch_ai_depth": by_batch_depth,
        "sector_archetype_matrix": [{"sector": s, "archetype": a, "n": k} for (s, a), k in matrix.items()],
        "signals_2025": sig25, "signals_2026": sig26, "signals_by_batch": sig_by_batch,
        "yc_industry": yc_ind, "regions": dict(regions),
        "median_team_size": team[len(team) // 2] if team else None,
    }
    (DATA / "summary.json").write_text(json.dumps(summary, indent=1))

    # ---- markdown tables for the report ----
    print(f"Total 2026: {n}  {batch_counts}  | 2025: {len(c25)} {batch_counts_25}")
    print(f"AI depth: " + ", ".join(f"{d26['ai_depth'][k]} {v} ({pct(v, n)}%)" for k, v in depth.most_common()))
    print("\n| Layer | Companies | Share |\n|---|---:|---:|")
    for k, v in layer.most_common():
        print(f"| {k} | {v} | {pct(v, n)}% |")
    print("\n| Archetype | Companies | Share | W | X | S | F |\n|---|---:|---:|---:|---:|---:|---:|")
    for k, v in arch.most_common():
        cells = " | ".join(str(by_batch_arch[b].get(k, 0)) for b in BATCHES)
        print(f"| {d26['archetypes'][k]} | {v} | {pct(v, n)}% | {cells} |")
    print("\n| Sector | Companies | Share | Top archetypes |\n|---|---:|---:|---|")
    for k, v in sect.most_common():
        top = C({a: m for (s, a), m in matrix.items() if s == k}).most_common(3)
        print(f"| {d26['sectors'][k]} | {v} | {pct(v, n)}% | " + ", ".join(f"{d26['archetypes'][a]} ({m})" for a, m in top) + " |")
    keys = [f"{CODE[b]}{y}" for y in ("25", "26") for b in BATCHES]
    print("\n| Signal (same regex both years) | 2025 | 2026 | Δ pts | " + " | ".join(keys) + " |")
    print("|---|---:|---:|---:|" + "---:|" * len(keys))
    for k in SIGNALS:
        cells = " | ".join(str(sig_by_batch[x][k]) for x in keys)
        print(f"| {k} | {sig25[k]}% | {sig26[k]}% | {sig26[k] - sig25[k]:+.1f} | {cells} |")
    print("\n| Theme (multi-label) | Companies | Share |\n|---|---:|---:|")
    for k, v in themes.most_common():
        print(f"| {k} | {v} | {pct(v, n)}% |")
    print("\nRegions:", dict(regions), " median team:", summary["median_team_size"])
    print("YC industry 2025:", yc_ind["2025"])
    print("YC industry 2026:", yc_ind["2026"])


def export_dashboard_csvs():
    """Lean CSVs that the published dashboard attaches as its datasets."""
    import csv
    out = DATA / "dashboard"
    out.mkdir(exist_ok=True)
    d26 = json.loads((DATA / "companies-2026-classified.json").read_text())
    s = json.loads((DATA / "summary.json").read_text())
    with open(out / "companies.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["company", "batch", "one_liner", "layer", "archetype", "sector", "ai_depth", "website", "yc_url"])
        for c in d26["companies"]:
            w.writerow([c["name"], c["batch"].replace(" 2026", ""), c["one_liner"], c["layer"], c["archetype_label"],
                        c["sector_label"], c["ai_depth_label"].split(" (")[0], c["website"] or "", c["yc_url"] or ""])
    with open(out / "signals.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["signal", "share_2025", "share_2026"])
        for k in s["signals_2025"]:
            w.writerow([k, round(s["signals_2025"][k] / 100, 4), round(s["signals_2026"][k] / 100, 4)])
    with open(out / "yc_industry.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["industry", "companies_2025", "companies_2026", "share_2025", "share_2026"])
        t25, t26 = sum(s["yc_industry"]["2025"].values()), sum(s["yc_industry"]["2026"].values())
        for k in sorted(set(s["yc_industry"]["2025"]) | set(s["yc_industry"]["2026"]), key=lambda k: -s["yc_industry"]["2026"].get(k, 0)):
            a, b = s["yc_industry"]["2025"].get(k, 0), s["yc_industry"]["2026"].get(k, 0)
            w.writerow([k, a, b, round(a / t25, 4), round(b / t26, 4)])


if __name__ == "__main__":
    main()
    export_dashboard_csvs()
