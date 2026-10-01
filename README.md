# 2Kdle

A daily Wordle-style basketball game: guess the mystery **NBA 2K27** player in five tries.

Every guess is compared against the mystery player:

| Clue | Green | Yellow | Grey |
| --- | --- | --- | --- |
| OVR, Outside Scoring, Inside Scoring, Athleticism, Playmaking, Defense, Rebounding | Exact | Within ±3 | Off by more than 3 |
| Height | Exact | Within ±2 inches | Off by more than 2 inches |
| Position (PG / SG / SF / PF / C) | Exact | Same group (guards PG/SG, forwards SF/PF, center C) | Different group |
| Team | Exact | Same conference | Other conference |
| Nation | Exact | Same continent | Different continent |

Numbers and height that aren't exact show ▲ or ▼ to say whether the mystery player is higher or lower. The card on the left reveals each attribute once you guess it exactly.

## Features

- **Daily** puzzle, the same player for everyone each day (seeded by your local date), drawn from 80+ OVR players
- **Unlimited** mode with three pools: 85+, 80+ and 75+
- **Hard mode**: search results show names only, with no rating, flag, position group or team
- Search by first or last name, with or without accents (`jokic` finds Nikola Jokić)
- **Forfeit** to reveal the answer (counts as a loss), with an in-page confirm
- Shareable emoji result grid, plus win %, streak and best streak saved in the browser
- A freely licensed photo of the answer on the end screen, from Wikimedia Commons via Wikidata, credited to the photographer
- Light and dark themes, and works on phones

## Player pool

Every current-roster NBA player rated 75 or higher on 2KRatings, 277 players in total. Ratings are frozen at a snapshot taken 1 October 2026, so in-season rating updates and trades don't change the game.

For players with more than one listed position or nationality, the game uses the first one 2KRatings lists.

## Running locally

It's a static site with no build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project structure

```
index.html                     Page markup
css/style.css                  Styles and light/dark theme tokens
js/game.js                     Game logic: comparison, daily seed, search, saving stats, answer photo
data/players.js                Player data (generated)
scripts/build_data.py          Builds data/players.js from scripts/source/players.csv
scripts/import_2kratings.py    Builds scripts/source/players.csv from the 2KRatings snapshot
scripts/source/players.csv     One row per player, with the source and source URL of each row
scripts/source/2kratings/      The raw 2KRatings snapshot (team rosters, player pages, birthdate fixes)
```

## Rebuilding the data

```sh
python3 scripts/import_2kratings.py   # 2KRatings snapshot -> scripts/source/players.csv
python3 scripts/build_data.py         # players.csv -> data/players.js
```

### Swapping in an official 2K list

There's no official NBA 2K27 ratings file yet, so the data comes from 2KRatings. When 2K publishes one, skip `import_2kratings.py`: write `scripts/source/players.csv` from the official data with these columns, then run `build_data.py`.

| Column | Example | Notes |
| --- | --- | --- |
| `name` | Nikola Jokić | Display name |
| `team` | DEN | Three-letter abbreviation |
| `ovr` | 97 | |
| `pos` | C | PG, SG, SF, PF or C |
| `height_in` | 83 | Total inches |
| `nation` | Serbia | Must be in `CONTINENT` in `build_data.py` |
| `birthdate` | 1995-02-19 | Optional. Only used to match the answer photo, never shown |
| `outside_scoring` … `rebounding` | 91 | The six 2K category ratings |
| `source`, `source_url` | | Where the row came from |

The build script stops with a clear message if it meets a team, position or country it doesn't know. The daily puzzle picks a player by row position, so changing the data changes which player each day uses. After rebuilding, bump the `?v=` number on the script and stylesheet links in `index.html` so browsers pick up the new files.

## Data notes

- 2KRatings' own "age" field is out of date, and a number of birth years read from its pages were garbled; the corrections are in `scripts/source/2kratings/overrides.txt`. Age isn't a clue in the game, so this only affects photo matching.
- 14 players show a different OVR on their team page and their player page; the player-page value is used, since the category ratings come from there too.
- Continents for countries between two continents follow their FIBA zone (Turkey, Georgia and Israel count as Europe).

## Credits

- Player ratings: [2KRatings](https://www.2kratings.com), snapshot of 1 October 2026. Not an official 2K data release.
- Answer photos: freely licensed images from [Wikimedia Commons](https://commons.wikimedia.org), found through Wikidata at the end of each game and credited under the photo
- Built on the engine of [FCdle](https://github.com/nashwanwahid672-commits/fcdle)

2Kdle is a fan-made project and is not affiliated with or endorsed by 2K, Take-Two Interactive, the NBA or its teams. NBA 2K is a trademark of Take-Two Interactive Software, Inc.
