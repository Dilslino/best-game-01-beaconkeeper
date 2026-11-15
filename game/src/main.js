// Beaconkeeper boot and game loop: screens, fixed-step updates, input wiring,
// and the deterministic shot path (?shot=name&seed=n) the screenshots come from.
import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { createSoundBank } from './audio.js';
import { createInput } from './input.js';
import { drawWorld, makeDecor } from './render.js';
import { stageShot } from './shots.js';
import { createWorld } from './world.js';

const STEP = 1 / 60;
const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;

const sound = createSoundBank();
const input = createInput(canvas);
const decor = makeDecor(seed);
let world = createWorld(seed);
let screen = 'title';
let keyAim = null;
let best = 0;

try {
  best = Number.parseInt(window.localStorage.getItem('beaconkeeper-best') || '0', 10) || 0;
} catch {
  best = 0;
}

function saveBest() {
  if (world.score > best) {
    best = world.score;
    try {
      window.localStorage.setItem('beaconkeeper-best', String(best));
    } catch {
      // Storage unavailable (private mode, file://): the game still plays.
    }
  }
}

function beaconSnapshot() {
  return {
    screen,
    phase: world.phase,
    score: world.score,
    wave: world.wave,
    lights: world.lights,
    oil: Math.round(world.oil),
    shipsGuided: world.shipsGuided,
    shipsWrecked: world.shipsWrecked,
    wraithsBurned: world.wraithsBurned,
    barrelsCollected: world.barrelsCollected,
    best,
  };
}

function render() {
  drawWorld(ctx, world, decor, screen, best);
  window.__beacon = beaconSnapshot();
}

function startGame() {
  sound.ensure();
  world = createWorld(seed);
  world.best = best;
  screen = 'play';
  keyAim = null;
  world.startWave();
  render();
}

function backToTitle() {
  saveBest();
  world = createWorld(seed);
  screen = 'title';
  render();
}

function onConfirm() {
  sound.ensure();
  if (screen === 'title') startGame();
  else if (screen === 'over' || screen === 'victory') backToTitle();
  // A click that starts or restarts must not also fire a flare.
  input.takeFlare();
}

canvas.addEventListener('mousedown', (event) => {
  if (event.button !== 0) return;
  if (screen === 'title' || screen === 'over' || screen === 'victory') onConfirm();
});

canvas.addEventListener('mousemove', () => {
  keyAim = null;
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter') onConfirm();
  if (event.code === 'KeyR' && screen !== 'title') {
    if (screen === 'play' || screen === 'pause' || screen === 'over' || screen === 'victory') startGame();
  }
  if (event.code === 'KeyP' && (screen === 'play' || screen === 'pause')) {
    screen = screen === 'play' ? 'pause' : 'play';
  }
  if (event.code === 'KeyM') sound.toggleMute();
});

function frameAim(dt) {
  let angle = input.aimAngle();
  if (input.pressedKeys.has('ArrowLeft') || input.pressedKeys.has('ArrowRight')) {
    if (keyAim === null) keyAim = world.beamAngle;
    if (input.pressedKeys.has('ArrowLeft')) keyAim -= 2.4 * dt;
    if (input.pressedKeys.has('ArrowRight')) keyAim += 2.4 * dt;
    angle = keyAim;
  }
  return angle;
}

let lastTime = 0;
let accumulator = 0;

function frame(timestamp) {
  window.requestAnimationFrame(frame);
  if (!lastTime) lastTime = timestamp;
  let elapsed = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (elapsed > 0.25) elapsed = 0.25;
  accumulator += elapsed;
  let steps = 0;
  while (accumulator >= STEP && steps < 5) {
    accumulator -= STEP;
    steps += 1;
    if (screen === 'play') {
      const aim = frameAim(STEP);
      world.step(STEP, aim, input.takeFlare(), sound);
      if (world.phase === 'over') {
        screen = 'over';
        saveBest();
      } else if (world.phase === 'victory') {
        screen = 'victory';
        saveBest();
      }
    } else if (screen === 'title') {
      // The title lives: the sea breathes and the beam sweeps behind it.
      world.time += STEP;
    }
  }
  render();
}

if (shotName) {
  // Deterministic scene: stage it from the seed, draw once, signal readiness.
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  if (staged.screen === 'title') best = staged.best;
  render();
  window.__shotReady = true;
} else {
  world.startWave();
  render();
  window.requestAnimationFrame(frame);
}
