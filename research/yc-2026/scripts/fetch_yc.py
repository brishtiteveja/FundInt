"""Fetch YC batch data from the yc-oss mirror of the YC company directory.

Source: https://github.com/yc-oss/api (rebuilt daily from ycombinator.com/companies).
Writes a trimmed snapshot to data/yc-2026/companies-raw.json.

Usage: python3 research/yc-2026/scripts/fetch_yc.py
"""
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = ROOT / "data" / "yc-2026"
BASE = "https://raw.githubusercontent.com/yc-oss/api/main"
BATCHES_2026 = ["winter-2026", "spring-2026", "summer-2026", "fall-2026"]
BATCHES_2025 = ["winter-2025", "spring-2025", "summer-2025", "fall-2025"]
KEEP = [
    "name", "slug", "batch", "one_liner", "long_description", "website",
    "all_locations", "regions", "team_size", "industry", "subindustry",
    "industries", "tags", "status", "stage", "isHiring", "url",
]


def get(path):
    with urllib.request.urlopen(f"{BASE}/{path}", timeout=60) as r:
        return json.load(r)


def trim(c):
    return {k: c.get(k) for k in KEEP}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = get("meta.json")
    snap = {"source": "https://github.com/yc-oss/api", "source_last_updated": meta.get("last_updated")}
    for label, batches in (("2026", BATCHES_2026), ("2025", BATCHES_2025)):
        rows = []
        for b in batches:
            rows += [trim(c) for c in get(f"batches/{b}.json")]
        (OUT / f"companies-{label}-raw.json").write_text(
            json.dumps({**snap, "companies": rows}, indent=1, ensure_ascii=False))
        print(label, len(rows))


if __name__ == "__main__":
    main()
