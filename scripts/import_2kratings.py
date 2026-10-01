"""Turn the hand-gathered 2KRatings snapshot into scripts/source/players.csv.

This is the *unofficial* stopgap source. When 2K publishes an official
ratings list, skip this script entirely: write scripts/source/players.csv in
the same column format (see COLUMNS below) from the official data and run
scripts/build_data.py as usual.

Inputs (scripts/source/2kratings/):
  rosters/<TEAM>.txt  One file per team, copied from www.2kratings.com/teams/<team>.
                      Line format: name|/player-page|OVR|positions|height|nationality
  details.txt         One line per player in the pool, from that player's page.
                      Line format: /player-page|OS|IS|ATH|PLY|DEF|REB|OVR|team

Pool: every current-roster player rated 75+ on his team page (277 players).

Usage:
  python3 scripts/import_2kratings.py
"""

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "source" / "2kratings"
OUT = ROOT / "scripts" / "source" / "players.csv"

MIN_OVR = 75
SNAPSHOT = "2026-10-01"
SOURCE = "2KRatings (2kratings.com), gathered " + SNAPSHOT

COLUMNS = ["name", "team", "ovr", "pos", "height_in", "nation",
           "outside_scoring", "inside_scoring", "athleticism", "playmaking",
           "defense", "rebounding", "source", "source_url"]

# 2KRatings spells names without diacritics; use the player's own spelling.
# Search in the game folds accents, so both spellings still match.
DISPLAY_NAMES = {
    "/nikola-jokic": "Nikola Jokić",
    "/luka-doncic": "Luka Dončić",
    "/alperen-sengun": "Alperen Şengün",
    "/kristaps-porzingis": "Kristaps Porziņģis",
    "/nikola-vucevic": "Nikola Vučević",
    "/jusuf-nurkic": "Jusuf Nurkić",
    "/dennis-schroder": "Dennis Schröder",
    "/jakob-poeltl": "Jakob Pöltl",
}

NATION_FIX = {"Bosnia & Herzegovina": "Bosnia and Herzegovina"}


def height_in(h):
    feet, inches = h.replace('"', "").split("'")
    return int(feet) * 12 + int(inches)


def main():
    roster = {}
    for f in sorted((SRC / "rosters").glob("*.txt")):
        for line in f.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            name, path, ovr, pos, h, nat = line.split("|")
            roster[path] = dict(team=f.stem, name=name, team_ovr=int(ovr),
                                pos=pos.split("/")[0].strip(), height=height_in(h),
                                nation=NATION_FIX.get(nat.split("/")[0].strip(), nat.split("/")[0].strip()))

    rows, mismatched, seen = [], [], set()
    for line in (SRC / "details.txt").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        path, os_, is_, ath, ply, dfn, reb, ovr, _team = line.split("|")
        r = roster[path]
        seen.add(path)
        if r["team_ovr"] < MIN_OVR:
            continue
        # The player page and the team page occasionally disagree on OVR. The
        # player page is where the category ratings come from, so it wins.
        if int(ovr) != r["team_ovr"]:
            mismatched.append(f'{r["name"]} {r["team_ovr"]}->{ovr}')
        rows.append({
            "name": DISPLAY_NAMES.get(path, r["name"]), "team": r["team"], "ovr": int(ovr),
            "pos": r["pos"], "height_in": r["height"], "nation": r["nation"],
            "outside_scoring": os_, "inside_scoring": is_, "athleticism": ath,
            "playmaking": ply, "defense": dfn, "rebounding": reb,
            "source": SOURCE, "source_url": "https://www.2kratings.com" + path,
        })

    missing = [r["name"] for p, r in roster.items() if r["team_ovr"] >= MIN_OVR and p not in seen]
    if missing:
        raise SystemExit("No details gathered for: " + ", ".join(missing))

    rows.sort(key=lambda r: (-r["ovr"], r["name"]))
    with open(OUT, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {len(rows)} players to {OUT.relative_to(ROOT)}")
    if mismatched:
        print(f"{len(mismatched)} OVRs differ between team and player pages (player page used): " + ", ".join(mismatched))


if __name__ == "__main__":
    main()
