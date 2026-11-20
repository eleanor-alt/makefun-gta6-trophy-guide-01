# Leonida Ledger — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft
Auto VI: 1 platinum, 2 gold, 6 silver, 46 bronze. Every trophy carries its
official name, description and grade, a guide in this entry's own words with
its sources cited, a roadmap to the platinum, and a missable flag built from
the official descriptions.

## What it does

- **Checklist** — tick trophies off; progress is saved in the browser
  (localStorage) and can be exported to a file and imported back.
- **Filters** — by kind (story, missable, collectibles, activities, online),
  by grade, and by search; a "hide earned" toggle.
- **Spoiler setting** — hides the names and descriptions of story trophies
  until they are earned.
- **Roadmap** — three stages to the platinum (story, 100% checklist,
  Strangers & Freaks and cleanup), with save advice.
- **Missables** — the one trophy PowerPyx flags as possibly missable
  (Positive Mental Attitude, Chapter 1), and what looks missable but is not.
- **Sources** — every guide names where its facts come from
  (Exophase, PSNProfiles, PowerPyx, GTABase, Sixshore), with links. Where a
  method is not yet confirmed by the guide writers, the guide says so.

## Run it

```sh
node serve.ts   # serves app/ on http://localhost:8080
```

The app is static files under `app/` and works with the network off: it
fetches only its own data files (`app/data/trophies.json`,
`app/data/sources.json`) and sends nothing anywhere.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## Notes

- No Rockstar Games logo, artwork, box art or screenshot of the game is used
  anywhere — the look is this guide's own.
- Trophy names and descriptions are shown as PlayStation publishes them.
- Guides are this entry's own words, drawn from the cited sources and never
  copied from them.
- Screenshots in `screenshots/` are real renders of this app in headless
  Chromium; `shots.json` says which view each one shows. The first by name,
  `1-cover.jpg`, is the cover.
