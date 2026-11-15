// Deterministic screenshot scenes. Each scene plays the real rules forward
// from a fresh world with a fixed-step autopilot, so the frame is what a real
// game looks like and the same seed always gives the same frame.
// Scenes: title, play, storm, victory. window.__shotReady is set by main.js.
import { LAMP, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

const STEP = 1 / 60;
const TITLE_SECONDS = 6;
const PLAY_SECONDS = 34;
const STORM_SECONDS = 52;
const VICTORY_LIMIT_SECONDS = 1500;

// Pick the most urgent thing to point the beam at: a wraith closing on the
// lamp, or an unlit ship drifting toward the rocks. Urgency is distance left.
function nearestTarget(world) {
  let best = null;
  let bestUrgency = 0;
  for (const wraith of world.wraiths) {
    const dist = Math.hypot(wraith.x - LAMP.x, wraith.y - LAMP.y);
    const urgency = Math.max(0, 760 - dist);
    if (urgency > bestUrgency) {
      bestUrgency = urgency;
      best = { x: wraith.x, y: wraith.y, kind: 'wraith', dist };
    }
  }
  for (const ship of world.ships) {
    if (ship.lit) continue;
    const urgency = Math.max(0, 780 - ship.x) * 1.15;
    if (urgency > bestUrgency) {
      bestUrgency = urgency;
      best = { x: ship.x, y: ship.y, kind: 'ship', dist: ship.x };
    }
  }
  // Nothing urgent: sweep toward the nearest ship so it gets lit early.
  if (!best) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const ship of world.ships) {
      if (ship.lit) continue;
      const dist = Math.hypot(ship.x - LAMP.x, ship.y - LAMP.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { x: ship.x, y: ship.y, kind: 'ship', dist };
      }
    }
    return nearest;
  }
  return best;
}

// Steer the beam at the most urgent target; flare when wraiths crowd the lamp.
function autopilot(world) {
  const target = nearestTarget(world);
  let aim = -0.45;
  if (target) aim = Math.atan2(target.y - LAMP.y, target.x - LAMP.x);
  let flare = false;
  let close = 0;
  for (const wraith of world.wraiths) {
    if (Math.hypot(wraith.x - LAMP.x, wraith.y - LAMP.y) < 260) close += 1;
  }
  if (close >= 2 && world.oil >= 20) flare = true;
  return { aim, flare };
}

function runSteps(world, seconds, pilot) {
  const total = Math.floor(seconds / STEP);
  for (let i = 0; i < total; i += 1) {
    if (world.phase !== 'play') break;
    const { aim, flare } = pilot ? autopilot(world) : { aim: -0.45, flare: false };
    world.step(STEP, aim, flare, null);
  }
}

export function stageShot(name, world) {
  world.reset();
  world.phase = 'play';
  if (name === 'title') {
    runSteps(world, TITLE_SECONDS, true);
    return { screen: 'title', best: 1250 };
  }
  if (name === 'storm') {
    // Jump to a late, crowded wave, then let the pilot fight it.
    world.wave = 6;
    world.startWave();
    world.waveState = 'active';
    world.bannerTimer = 0;
    runSteps(world, STORM_SECONDS, true);
    return { screen: world.phase === 'play' ? 'play' : world.phase, best: 0 };
  }
  if (name === 'victory') {
    // The pilot plays the whole campaign for real; it must win to show this.
    const total = Math.floor(VICTORY_LIMIT_SECONDS / STEP);
    for (let i = 0; i < total; i += 1) {
      if (world.phase !== 'play') break;
      const { aim, flare } = autopilot(world);
      world.step(STEP, aim, flare, null);
    }
    return { screen: world.phase, best: 0 };
  }
  // Default: play — a busy mid-wave frame with a guided ship and a burn.
  runSteps(world, PLAY_SECONDS, true);
  return { screen: world.phase === 'play' ? 'play' : world.phase, best: 0 };
}

export function shotList() {
  return [
    { name: '1-play.jpg', query: '?shot=play&seed=7' },
    { name: '2-title.jpg', query: '?shot=title&seed=7' },
    { name: '3-storm.jpg', query: '?shot=storm&seed=7' },
    { name: '4-victory.jpg', query: '?shot=victory&seed=7' },
  ];
}

export { VIEW_HEIGHT, VIEW_WIDTH };
