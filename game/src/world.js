// Beaconkeeper simulation: ships, wraiths, barrels, the beam, waves, lights.
// Pure fixed-step logic: given the same seed and the same inputs, step() always
// produces the same state. Rendering and sound only read this state.
import {
  BARREL, BEAM, DOCK, FLARE, LAMP, LIGHTS, OIL, SCORE, SHIP, VIEW_HEIGHT,
  VIEW_WIDTH, WAVES, WRAITH,
} from './config.js';
import { makeSeededRandom, pickBetween } from './random.js';

const TAU = Math.PI * 2;

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

function inCone(fromX, fromY, angle, range, halfAngle, x, y, radius) {
  const dx = x - fromX;
  const dy = y - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance > range + radius) return false;
  if (distance < radius + 4) return true;
  const spread = Math.abs(angleDifference(Math.atan2(dy, dx), angle));
  return spread < halfAngle + Math.atan2(radius, distance);
}

export function createWorld(seed) {
  const random = makeSeededRandom(seed);
  const world = {
    seed,
    phase: 'play',
    time: 0,
    wave: 1,
    score: 0,
    lights: LIGHTS.start,
    oil: OIL.start,
    beamAngle: -0.5,
    aimAngle: -0.5,
    flareTimer: 0,
    flareCooldown: 0,
    shipsGuided: 0,
    shipsWrecked: 0,
    wraithsBurned: 0,
    barrelsCollected: 0,
    shipsSpawned: 0,
    shipsThisWave: WAVES.shipsPerWaveBase + 1,
    waveState: 'banner',
    bannerTimer: WAVES.bannerSeconds,
    bannerText: 'WAVE 1',
    bannerSub: 'Guide 3 ships home — burn the wraiths',
    shipTimer: 1.2,
    wraithTimer: 2.5,
    barrelTimer: 4,
    ships: [],
    wraiths: [],
    barrels: [],
    particles: [],
    floaters: [],
    shake: 0,
    flash: 0,
    best: 0,

    reset() {
      const fresh = createWorld(this.seed);
      for (const key of Object.keys(fresh)) this[key] = fresh[key];
    },

    beamIsLit() {
      return this.oil > 0;
    },

    beamRange() {
      if (!this.beamIsLit()) return BEAM.dimRange;
      return this.flareTimer > 0 ? FLARE.range : BEAM.range;
    },

    beamHalfAngle() {
      return this.flareTimer > 0 ? FLARE.halfAngle : BEAM.halfAngle;
    },

    spawnShip() {
      const laneY = pickBetween(random, 120, 540);
      this.ships.push({
        x: VIEW_WIDTH + 40,
        y: laneY,
        lit: false,
        speed: SHIP.baseSpeed + SHIP.speedPerWave * this.wave + random() * 6,
        bob: random() * TAU,
        resolved: false,
      });
      this.shipsSpawned += 1;
    },

    spawnWraith() {
      const fromTop = random() < 0.55;
      this.wraiths.push({
        x: fromTop ? pickBetween(random, 320, VIEW_WIDTH + 20) : VIEW_WIDTH + 24,
        y: fromTop ? -24 : pickBetween(random, 40, 320),
        speed: WRAITH.baseSpeed + WRAITH.speedPerWave * this.wave + random() * 8,
        phase: random() * TAU,
        radius: 15 + random() * 7,
      });
    },

    spawnBarrel() {
      this.barrels.push({
        x: VIEW_WIDTH + 30,
        y: pickBetween(random, 90, 620),
        speed: 30 + random() * 14,
        bob: random() * TAU,
      });
    },

    burst(x, y, color, count, speed) {
      for (let i = 0; i < count; i += 1) {
        const a = random() * TAU;
        const v = speed * (0.3 + random() * 0.7);
        this.particles.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 24,
          life: 0.5 + random() * 0.6,
          maxLife: 1.1,
          size: 2 + random() * 4,
          color,
          gravity: 130,
        });
      }
    },

    addFloater(x, y, text, color) {
      this.floaters.push({ x, y, text, life: 1.4, color });
    },

    loseLight(x, y, sound) {
      this.lights -= 1;
      this.shake = 1;
      this.flash = 0.55;
      this.burst(x, y, '#ff5a6e', 26, 190);
      if (sound) sound.hit();
      if (this.lights <= 0) this.phase = 'over';
    },

    startWave() {
      this.shipsThisWave = WAVES.shipsPerWaveBase + this.wave;
      this.shipsSpawned = 0;
      this.shipTimer = 1.0;
      this.wraithTimer = 2.0;
      this.waveState = 'banner';
      this.bannerText = `WAVE ${this.wave}`;
      this.bannerSub = `Guide ${this.shipsThisWave} ships home — burn the wraiths`;
      this.bannerTimer = WAVES.bannerSeconds;
    },

    completeWave(sound) {
      if (this.wave >= WAVES.total) {
        this.phase = 'victory';
        if (sound) sound.docked();
        return;
      }
      this.wave += 1;
      this.oil = Math.min(OIL.max, this.oil + 25);
      this.startWave();
      if (sound) sound.horn();
    },

    step(dt, aimAngle, wantFlare, sound) {
      if (this.phase !== 'play') return;
      this.time += dt;

      // Beam steering and oil.
      const turn = angleDifference(aimAngle, this.beamAngle);
      const maxTurn = BEAM.turnRate * dt;
      this.beamAngle += Math.max(-maxTurn, Math.min(maxTurn, turn));
      this.aimAngle = aimAngle;
      if (this.beamIsLit()) {
        this.oil = Math.max(0, this.oil - BEAM.oilDrainPerSecond * dt);
      }
      if (this.flareCooldown > 0) this.flareCooldown -= dt;
      if (this.flareTimer > 0) this.flareTimer -= dt;
      if (wantFlare && this.flareCooldown <= 0 && this.oil >= FLARE.cost && this.beamIsLit()) {
        this.oil -= FLARE.cost;
        this.flareTimer = FLARE.durationSeconds;
        this.flareCooldown = FLARE.cooldownSeconds;
        if (sound) sound.flare();
      }

      // Wave banner counts down, then the wave goes live.
      if (this.waveState === 'banner') {
        this.bannerTimer -= dt;
        if (this.bannerTimer <= 0) this.waveState = 'active';
      }

      // Spawning.
      if (this.waveState === 'active') {
        if (this.shipsSpawned < this.shipsThisWave) {
          this.shipTimer -= dt;
          if (this.shipTimer <= 0) {
            this.spawnShip();
            this.shipTimer = SHIP.spawnGapSeconds;
          }
        }
        this.wraithTimer -= dt;
        if (this.wraithTimer <= 0) {
          const cap = WRAITH.maxAliveBase + this.wave;
          if (this.wraiths.length < cap) this.spawnWraith();
          const interval = Math.max(
            WRAITH.spawnIntervalMin,
            WRAITH.spawnIntervalBase - WRAITH.spawnIntervalPerWave * this.wave,
          );
          this.wraithTimer = interval;
        }
        this.barrelTimer -= dt;
        if (this.barrelTimer <= 0) {
          this.spawnBarrel();
          this.barrelTimer = BARREL.spawnEverySeconds;
        }
      }

      const range = this.beamRange();
      const half = this.beamHalfAngle();
      const lit = this.beamIsLit();

      // Ships: the beam guides them home; the rocks wreck the unguided.
      for (let i = this.ships.length - 1; i >= 0; i -= 1) {
        const ship = this.ships[i];
        if (lit && !ship.lit && inCone(LAMP.x, LAMP.y, this.beamAngle, range, half, ship.x, ship.y, 26)) {
          ship.lit = true;
          this.addFloater(ship.x, ship.y - 34, 'GUIDED!', '#ffd76a');
          if (sound) sound.tone({ frequency: 1046, seconds: 0.16, type: 'triangle', volume: 0.16 });
        }
        if (ship.lit) {
          const dx = DOCK.x - ship.x;
          const dy = DOCK.y - ship.y;
          const dist = Math.hypot(dx, dy) || 1;
          ship.x += (dx / dist) * SHIP.guidedSpeed * dt;
          ship.y += (dy / dist) * SHIP.guidedSpeed * dt;
          if (dist < 30) {
            this.ships.splice(i, 1);
            this.shipsGuided += 1;
            this.score += SCORE.docked;
            this.burst(DOCK.x, DOCK.y - 8, '#ffd76a', 22, 150);
            this.addFloater(DOCK.x, DOCK.y - 44, `+${SCORE.docked} DOCKED`, '#ffd76a');
            if (sound) sound.docked();
            continue;
          }
        } else {
          ship.x -= ship.speed * dt;
          ship.bob += dt * 2;
          if (ship.x <= SHIP.wreckX) {
            this.ships.splice(i, 1);
            this.shipsWrecked += 1;
            this.burst(ship.x, ship.y, '#ff8a5a', 30, 210);
            this.addFloater(ship.x + 30, ship.y - 30, 'WRECKED!', '#ff8a5a');
            this.loseLight(ship.x, ship.y, sound);
            continue;
          }
        }
      }

      // Wraiths: drift at the lamp; the beam burns them on contact.
      for (let i = this.wraiths.length - 1; i >= 0; i -= 1) {
        const wraith = this.wraiths[i];
        const dx = LAMP.x - wraith.x;
        const dy = LAMP.y - wraith.y;
        const dist = Math.hypot(dx, dy) || 1;
        const wobble = Math.sin(this.time * 1.7 + wraith.phase) * 26;
        wraith.x += ((dx / dist) * wraith.speed + wobble * 0.4) * dt;
        wraith.y += (dy / dist) * wraith.speed * dt;
        if (dist < WRAITH.lampRadius) {
          this.wraiths.splice(i, 1);
          this.addFloater(LAMP.x + 40, LAMP.y - 40, 'THE LIGHT FADES!', '#ff5a6e');
          this.loseLight(LAMP.x, LAMP.y, sound);
          continue;
        }
        if (lit && inCone(LAMP.x, LAMP.y, this.beamAngle, range, half, wraith.x, wraith.y, wraith.radius)) {
          this.wraiths.splice(i, 1);
          this.wraithsBurned += 1;
          this.score += SCORE.burned;
          this.burst(wraith.x, wraith.y, '#c77dff', 18, 170);
          this.addFloater(wraith.x, wraith.y - 22, `+${SCORE.burned}`, '#c77dff');
          if (sound) sound.burned();
        }
      }

      // Barrels: drift by; the beam hauls in their oil.
      for (let i = this.barrels.length - 1; i >= 0; i -= 1) {
        const barrel = this.barrels[i];
        barrel.x -= barrel.speed * dt;
        barrel.bob += dt * 3;
        if (lit && inCone(LAMP.x, LAMP.y, this.beamAngle, range, half, barrel.x, barrel.y, 14)) {
          this.barrels.splice(i, 1);
          this.barrelsCollected += 1;
          this.oil = Math.min(OIL.max, this.oil + OIL.barrelGain);
          this.score += SCORE.barrel;
          this.addFloater(barrel.x, barrel.y - 24, `+${OIL.barrelGain} OIL`, '#ffb347');
          if (sound) sound.barrel();
          continue;
        }
        if (barrel.x < -30) this.barrels.splice(i, 1);
      }

      // Wave completion.
      if (this.waveState === 'active'
        && this.shipsSpawned >= this.shipsThisWave
        && this.ships.length === 0) {
        this.waveState = 'banner';
        this.completeWave(sound);
      }

      // Particles, floaters, shake, flash.
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.floaters.length - 1; i >= 0; i -= 1) {
        const f = this.floaters[i];
        f.life -= dt;
        f.y -= 26 * dt;
        if (f.life <= 0) this.floaters.splice(i, 1);
      }
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1.6);
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.4);
    },
  };
  world.random = random;
  return world;
}
