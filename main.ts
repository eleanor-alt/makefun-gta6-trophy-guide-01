// Vice Ledger — hand-in program for the make.fun bounty gta6-trophy-guide-01.
// Node 22, standard library only, no build step and nothing to install.
//
// The entry itself is the static web app in app/ (a GTA VI trophy guide and
// tracker that runs offline in a desktop browser) plus the maker's screenshots
// in screenshots/. This program is only the delivery mechanism: it copies both
// folders into the output directory and writes dossier.json there, using the
// vendored dossier library in vendor/makefun-frontend.ts. That library file is
// the kit's own copy and is deliberately left untouched — the scorer rebuilds
// the dossier with its identical copy and expects the same bytes back.
//
// In the grading container the output directory is /output. Anywhere else,
// point MAKEFUN_OUTPUT_DIR at a scratch folder to rehearse the hand-in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps below are the scorer's own limits for this bounty, passed through
// so a rehearsal fails here on anything the scorer itself would refuse: the
// dossier text cap, at most 4 screenshots of at most 256 KiB each, and app/
// holding at most 993 entries and 48 MiB in all.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));

// Fail loudly on a hand-in that cannot score: no index page, no dossier, or a
// screenshot count outside the three-to-four the rules ask for.
const shotDir = join(outputDir, 'screenshots');
const shotNames = existsSync(shotDir)
  ? readdirSync(shotDir).filter((name) => !name.startsWith('.') && statSync(join(shotDir, name)).isFile()).sort()
  : [];
if (!existsSync(join(outputDir, 'app', 'index.html'))) throw new Error('hand-in is missing app/index.html');
if (!existsSync(join(outputDir, 'dossier.json'))) throw new Error('hand-in is missing dossier.json');
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`hand-in needs 3 or 4 screenshots, found ${shotNames.length}`);
}
console.log(`Vice Ledger handed in: ${shotNames.length} screenshots (cover: ${shotNames[0]}), dossier.json written.`);
