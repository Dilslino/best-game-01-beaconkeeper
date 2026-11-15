// Beaconkeeper entry program (Node 22, standard library only).
//
// It hands the game in: copies game/ and screenshots/ from beside this file
// into the output directory and writes /output/dossier.json with the vendored
// make.fun library, exactly as the kit's starter does. Deterministic: the
// same repository always produces the same bytes, run after run.
//
// The one rule that matters here: this program NEVER removes the output
// directory itself. Under the grader the output dir is pre-created and this
// process runs as an unprivileged user, so deleting it would need write
// permission on its parent and fail the run. It only clears the children it
// owns — game/ and screenshots/ — then writes them fresh. mkdirSync with
// recursive creates the dir for local runs and is a no-op when it exists.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Clear only our own children inside the output dir, never the dir itself.
for (const child of ['game', 'screenshots']) {
  const target = join(out, child);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true, dereference: false });

if (!existsSync(join(here, 'screenshots'))) {
  throw new Error('screenshots/ is missing beside main.ts — stage the 4 verified 1280x720 shots first');
}
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true, dereference: false });

// Refuse to hand in a screenshot the scorer would refuse, rather than
// letting a bad file ride along to the gate.
for (const name of readdirSync(join(out, 'screenshots'))) {
  const shot = join(out, 'screenshots', name);
  if (statSync(shot).isFile() && statSync(shot).size > 262144) {
    throw new Error(`screenshot ${name} is over the 256 KiB cap — retake it at a lower quality`);
  }
}

// The scorer's own caps (reference/gate.json): text_max_bytes shapes the
// dossier text; the others refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Read the dossier back and report what was produced, so a broken build
// fails loudly here instead of at the scorer.
const dossier = JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
function countFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .reduce((n, e) => n + (e.isDirectory() ? countFiles(join(dir, e.name)) : 1), 0);
}
const gameFiles = countFiles(join(out, 'game'));
const shotCount = dossier.images?.length ?? 0;
console.log(`Beaconkeeper dossier ok: ${gameFiles} game files, ${shotCount} screenshots, dossier ${statSync(join(out, 'dossier.json')).size} bytes -> ${out}`);
