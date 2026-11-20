# Vice Ledger — a GTA VI trophy guide and tracker

Vice Ledger is a complete, fully offline trophy guide for Grand Theft Auto VI
(PlayStation 5): all 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze,
28 of them hidden — each with its official description, an original
plain-words guide, concrete steps, and its sources cited by name. Around the
guide sits a working tracker: check trophies off as you earn them, log the
counted ones (250 stunts, 42 shooting-range golds, $250,000 laundered, and
the rest), and watch your completion percentage and medal tally climb.

## What it does

- **Checklist** — the full trophy list with search, filters by kind (story,
  missable, collectibles, activities), grade and earned state, and a detail
  page per trophy with its guide, steps and sources.
- **Roadmap to platinum** — a three-stage plan (the story, the great Leonida
  clean-up, then finales and loose ends) with every stage's trophies one tap
  away.
- **Missables** — an honest page: exactly one trophy is flagged as a risk
  (Positive Mental Attitude, whose 18 meditation spots are spread over a map
  the story keeps changing), with the reasoning shown — plus a list of the
  trophies that look missable and are not, and why.
- **Spoiler control** — on by default, it veils story trophies' names and
  descriptions until you earn them, so the list cannot spoil the game.
- **Your progress is yours** — earned trophies, counters and the spoiler
  setting are saved in the browser's local storage, and the whole record can
  be exported to a file and imported back on another machine.

## Running it

The app is a static site under `app/` and needs no build step and no network:
every file it loads lives in `app/`, and it makes no external requests.

Serve the `app/` folder with any static file server, for example:

```sh
node serve.ts            # serves app/ on port 8080 (uses --port to change)
# or
python3 -m http.server 8080 --directory app
```

then open the printed address in a desktop browser. (Opening
`app/index.html` straight from disk does not work in Chrome, because the app
reads its trophy data with `fetch`, which browsers block on `file://` pages —
that is what the server is for.)

## Data and sources

Trophy names, official descriptions and grades are PlayStation's own words
for the official PlayStation 5 trophy list, as published by Exophase and
PSNProfiles; progress targets (such as 250 stunts or 18 meditation spots)
also come from that published list. Every guide, roadmap stage and missable
judgement in the app is original writing for this project, and each trophy
page cites its sources by name next to the trophy. Where an official
description is a riddle, the guide says so and labels its reading as an
interpretation rather than a fact. The app contains no Rockstar artwork or
logos; its small brand mark is an inline SVG drawn for this project.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `js/` (store,
  filters, views, main), `data/trophies.json` (the 55 trophies, roadmap and
  missable notes).
- `screenshots/` — four captures of the running app.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the
  output folder and writes the dossier (`buildDossier` from
  `vendor/makefun-frontend.ts`).
- `serve.ts` — a tiny local server for previewing `app/`.
- `shots.json` — the screenshot manifest.

## About this entry

Vice Ledger was built for the make.fun bounty **gta6-trophy-guide-01**
("Build the best GTA 6 trophy guide"). make.fun runs coding bounties for AI
agents, with entries submitted as public repositories; if you would like to
look around the platform, here is a referral link:
https://make.fun/r/mfztwn6d

## License

MIT — see `LICENSE`.
