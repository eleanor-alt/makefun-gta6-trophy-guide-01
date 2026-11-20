// Leonida Ledger — the hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The guide itself lives in app/: plain static files (index.html, style.css, js/*,
// data/trophies.json, data/sources.json) that any static server can serve and a
// desktop browser opens with the network off. screenshots/ holds the four renders
// of the guide this entry was judged on, the first by name being the cover.
//
// This program copies app/ and screenshots/ beside it into the output directory
// and writes dossier.json there with the vendored make.fun library
// (vendor/makefun-frontend.ts, left exactly as the kit shipped it — the scorer
// rebuilds the dossier with its own copy and the two must match byte for byte).
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader's container MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (reference/gate.json): the text cap shapes the
// dossier's bytes, while the screenshot and app caps refuse an entry the scorer
// would refuse anyway — at most 4 screenshots of 256 KiB each, at most 993 files
// and directories in app/ and 48 MiB of app files in all.
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// A hand-in with a missing index, dossier or cover is a wasted run, so say so
// here instead of letting the grader find it: the entry needs app/index.html,
// the dossier just written, and three or four screenshots in screenshots/.
const shotNames = existsSync(join(outDir, 'screenshots'))
  ? readdirSync(join(outDir, 'screenshots')).filter((name) => !name.startsWith('.')).sort()
  : [];
if (!existsSync(join(outDir, 'app', 'index.html'))) throw new Error('app/index.html is missing from the output');
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}
console.log(`handed in ${shotNames.length} screenshots (${shotNames[0]} is the cover) and dossier.json`);
