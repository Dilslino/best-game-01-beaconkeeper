// Beaconkeeper renderer: every pixel is drawn from code — night sky, storm sea,
// the lighthouse and its beam, ships, wraiths, HUD and every menu screen.
import { BEAM, DOCK, FLARE, LAMP, PALETTE, TOWER, VIEW_HEIGHT, VIEW_WIDTH, WAVES } from './config.js';
import { makeSeededRandom, pickBetween } from './random.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeDecor(seed) {
  const random = makeSeededRandom(seed ^ 0x51ab);
  const stars = [];
  for (let i = 0; i < 110; i += 1) {
    stars.push({
      x: random() * VIEW_WIDTH,
      y: random() * 260,
      r: 0.6 + random() * 1.5,
      twinkle: random() * Math.PI * 2,
    });
  }
  const clouds = [];
  for (let i = 0; i < 7; i += 1) {
    clouds.push({
      x: random() * VIEW_WIDTH,
      y: 30 + random() * 130,
      w: 120 + random() * 180,
      h: 22 + random() * 26,
      speed: 4 + random() * 7,
    });
  }
  const waveLines = [];
  for (let i = 0; i < 26; i += 1) {
    waveLines.push({
      x: random() * VIEW_WIDTH,
      y: 300 + random() * 400,
      len: 40 + random() * 120,
      phase: random() * Math.PI * 2,
    });
  }
  return { stars, clouds, waveLines };
}

function drawSky(ctx, decor, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, 340);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.6, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, 340);

  for (const star of decor.stars) {
    const alpha = 0.45 + 0.4 * Math.sin(time * 0.9 + star.twinkle);
    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.fillStyle = PALETTE.star;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon with a halo.
  const moon = ctx.createRadialGradient(1120, 92, 8, 1120, 92, 90);
  moon.addColorStop(0, 'rgba(244, 233, 200, 0.5)');
  moon.addColorStop(1, 'rgba(244, 233, 200, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(1020, 0, 200, 190);
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(1120, 92, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(190, 175, 140, 0.6)';
  ctx.beginPath();
  ctx.arc(1110, 84, 7, 0, Math.PI * 2);
  ctx.arc(1132, 102, 5, 0, Math.PI * 2);
  ctx.fill();

  for (const cloud of decor.clouds) {
    const cx = ((cloud.x + time * cloud.speed) % (VIEW_WIDTH + 240)) - 120;
    ctx.fillStyle = 'rgba(16, 28, 52, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cloud.w * 0.28, cloud.y + 8, cloud.w / 3, cloud.h / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSea(ctx, decor, time) {
  const sea = ctx.createLinearGradient(0, 300, 0, VIEW_HEIGHT);
  sea.addColorStop(0, PALETTE.seaShallow);
  sea.addColorStop(1, PALETTE.seaDeep);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 300, VIEW_WIDTH, VIEW_HEIGHT - 300);

  ctx.strokeStyle = 'rgba(140, 200, 220, 0.20)';
  ctx.lineWidth = 2;
  for (const line of decor.waveLines) {
    const bob = Math.sin(time * 1.1 + line.phase) * 3;
    ctx.beginPath();
    ctx.moveTo(line.x, line.y + bob);
    ctx.quadraticCurveTo(line.x + line.len / 2, line.y + bob - 5, line.x + line.len, line.y + bob);
    ctx.stroke();
  }
}

function drawRocksAndDock(ctx) {
  // Rocky shore along the bottom edge.
  ctx.fillStyle = PALETTE.rock;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_HEIGHT);
  ctx.lineTo(0, 668);
  ctx.lineTo(120, 648);
  ctx.lineTo(260, 664);
  ctx.lineTo(420, 650);
  ctx.lineTo(560, 668);
  ctx.lineTo(760, 654);
  ctx.lineTo(960, 670);
  ctx.lineTo(1120, 656);
  ctx.lineTo(VIEW_WIDTH, 668);
  ctx.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.rockTop;
  ctx.beginPath();
  ctx.moveTo(0, 668);
  ctx.lineTo(120, 648);
  ctx.lineTo(260, 664);
  ctx.lineTo(420, 650);
  ctx.lineTo(560, 668);
  ctx.lineTo(760, 654);
  ctx.lineTo(960, 670);
  ctx.lineTo(1120, 656);
  ctx.lineTo(VIEW_WIDTH, 668);
  ctx.lineTo(VIEW_WIDTH, 676);
  ctx.lineTo(0, 676);
  ctx.closePath();
  ctx.fill();

  // The lighthouse rock island.
  ctx.fillStyle = PALETTE.rock;
  ctx.beginPath();
  ctx.ellipse(TOWER.x, TOWER.baseY + 16, 108, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.rockTop;
  ctx.beginPath();
  ctx.ellipse(TOWER.x, TOWER.baseY + 8, 96, 22, 0, Math.PI, 0);
  ctx.fill();

  // Wooden dock jutting from the island into the harbour.
  ctx.fillStyle = PALETTE.dockWood;
  ctx.fillRect(DOCK.x - DOCK.halfWidth, DOCK.y - 12, DOCK.halfWidth * 2, 14);
  ctx.fillStyle = '#5d3d22';
  for (let x = DOCK.x - DOCK.halfWidth; x < DOCK.x + DOCK.halfWidth; x += 24) {
    ctx.fillRect(x, DOCK.y - 12, 3, 14);
  }
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('H A R B O U R', DOCK.x, DOCK.y + 34);
}

function drawLighthouse(ctx, world) {
  const { x, baseY, topY, halfWidth } = TOWER;
  // Striped tower.
  ctx.fillStyle = PALETTE.towerCream;
  ctx.beginPath();
  ctx.moveTo(x - halfWidth, baseY);
  ctx.lineTo(x - halfWidth + 10, topY);
  ctx.lineTo(x + halfWidth - 10, topY);
  ctx.lineTo(x + halfWidth, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.towerRed;
  const stripes = 3;
  for (let i = 0; i < stripes; i += 1) {
    const y0 = topY + ((baseY - topY) * (2 * i + 1)) / (2 * stripes) - 14;
    const y1 = y0 + 26;
    const w0 = halfWidth - ((halfWidth - (halfWidth - 10)) * (y0 - topY)) / (baseY - topY);
    const w1 = halfWidth - ((halfWidth - (halfWidth - 10)) * (y1 - topY)) / (baseY - topY);
    ctx.beginPath();
    ctx.moveTo(x - w0, y0);
    ctx.lineTo(x + w0, y0);
    ctx.lineTo(x + w1, y1);
    ctx.lineTo(x - w1, y1);
    ctx.closePath();
    ctx.fill();
  }
  // Gallery and lamp room.
  ctx.fillStyle = '#1d2733';
  ctx.fillRect(x - 44, topY - 14, 88, 12);
  ctx.fillStyle = '#f7e9bd';
  ctx.fillRect(x - 26, topY - 52, 52, 40);
  ctx.fillStyle = '#1d2733';
  ctx.beginPath();
  ctx.moveTo(x - 32, topY - 52);
  ctx.lineTo(x, topY - 76);
  ctx.lineTo(x + 32, topY - 52);
  ctx.closePath();
  ctx.fill();
  // Lamp glow.
  const glow = ctx.createRadialGradient(LAMP.x, LAMP.y, 4, LAMP.x, LAMP.y, 90);
  glow.addColorStop(0, 'rgba(255, 220, 120, 0.9)');
  glow.addColorStop(1, 'rgba(255, 220, 120, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(LAMP.x, LAMP.y, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(LAMP.x, LAMP.y, 13, 0, Math.PI * 2);
  ctx.fill();
  // Little window lights on the tower.
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(x - 6, baseY - 96, 12, 16);
  ctx.fillRect(x - 6, baseY - 150, 12, 16);
}

function drawBeam(ctx, world) {
  if (!world.beamIsLit() && world.flareTimer <= 0) return;
  const range = world.beamRange();
  const half = world.beamHalfAngle();
  const angle = world.beamAngle;
  const bright = world.flareTimer > 0 ? 1 : 0.75;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createLinearGradient(LAMP.x, LAMP.y, LAMP.x + Math.cos(angle) * range, LAMP.y + Math.sin(angle) * range);
  grad.addColorStop(0, `rgba(255, 236, 170, ${0.55 * bright})`);
  grad.addColorStop(1, 'rgba(255, 214, 110, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(LAMP.x, LAMP.y);
  ctx.arc(LAMP.x, LAMP.y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fill();
  // Hot core of the beam.
  const core = ctx.createLinearGradient(LAMP.x, LAMP.y, LAMP.x + Math.cos(angle) * range, LAMP.y + Math.sin(angle) * range);
  core.addColorStop(0, `rgba(255, 248, 210, ${0.7 * bright})`);
  core.addColorStop(1, 'rgba(255, 240, 180, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(LAMP.x, LAMP.y);
  ctx.arc(LAMP.x, LAMP.y, range, angle - half * 0.35, angle + half * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawShip(ctx, ship, time) {
  const bob = Math.sin(ship.bob) * 2;
  ctx.save();
  ctx.translate(ship.x, ship.y + bob);
  // Wake.
  ctx.strokeStyle = 'rgba(180, 220, 235, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-34, 12);
  ctx.quadraticCurveTo(-52, 16, -66, 10);
  ctx.moveTo(34, 12);
  ctx.quadraticCurveTo(52, 16, 66, 10);
  ctx.stroke();
  // Hull.
  ctx.fillStyle = PALETTE.shipHull;
  ctx.beginPath();
  ctx.moveTo(-36, -2);
  ctx.lineTo(36, -2);
  ctx.lineTo(28, 14);
  ctx.lineTo(-28, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a4a2e';
  ctx.fillRect(-36, -4, 72, 4);
  // Mast and sail.
  ctx.fillStyle = '#3d2716';
  ctx.fillRect(-2, -46, 4, 44);
  ctx.fillStyle = ship.lit ? '#fff2c8' : PALETTE.shipSail;
  ctx.beginPath();
  ctx.moveTo(2, -46);
  ctx.lineTo(2, -8);
  ctx.lineTo(30, -10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2, -44);
  ctx.lineTo(-2, -10);
  ctx.lineTo(-24, -10);
  ctx.closePath();
  ctx.fill();
  // Lantern: lit ships shine, so the keeper can see them home.
  if (ship.lit) {
    const glow = ctx.createRadialGradient(0, -50, 2, 0, -50, 26);
    glow.addColorStop(0, 'rgba(255, 215, 106, 0.95)');
    glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -50, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.shipLantern;
    ctx.beginPath();
    ctx.arc(0, -50, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWraith(ctx, wraith, time) {
  const wobble = Math.sin(time * 2.4 + wraith.phase) * 4;
  ctx.save();
  ctx.translate(wraith.x + wobble, wraith.y);
  ctx.fillStyle = 'rgba(26, 16, 48, 0.92)';
  ctx.beginPath();
  ctx.arc(0, 0, wraith.radius, 0, Math.PI * 2);
  ctx.arc(-wraith.radius * 0.55, wraith.radius * 0.5, wraith.radius * 0.55, 0, Math.PI * 2);
  ctx.arc(wraith.radius * 0.5, wraith.radius * 0.55, wraith.radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.wraithEye;
  ctx.beginPath();
  ctx.arc(-6, -4, 3.4, 0, Math.PI * 2);
  ctx.arc(6, -4, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(199, 125, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-wraith.radius * 0.7, wraith.radius * 0.7);
  ctx.quadraticCurveTo(-wraith.radius, wraith.radius * 1.6, -wraith.radius * 0.4, wraith.radius * 1.9);
  ctx.moveTo(wraith.radius * 0.7, wraith.radius * 0.7);
  ctx.quadraticCurveTo(wraith.radius, wraith.radius * 1.6, wraith.radius * 0.4, wraith.radius * 1.9);
  ctx.stroke();
  ctx.restore();
}

function drawBarrel(ctx, barrel) {
  const bob = Math.sin(barrel.bob) * 2;
  ctx.save();
  ctx.translate(barrel.x, barrel.y + bob);
  ctx.fillStyle = '#8a5a26';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a2f14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.moveTo(-13, -4);
  ctx.lineTo(13, -4);
  ctx.moveTo(-13, 4);
  ctx.lineTo(13, 4);
  ctx.stroke();
  ctx.fillStyle = PALETTE.oil;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('OIL', 0, 4);
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx, world) {
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, world) {
  ctx.save();
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 12, 10, VIEW_WIDTH - 24, 52, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  roundRect(ctx, 12, 10, VIEW_WIDTH - 24, 52, 10);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText(`SCORE ${world.score}`, 28, 37);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(`WAVE ${world.wave}/${WAVES.total}`, 300, 37);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`SHIPS ${world.shipsGuided}/${world.shipsThisWave}`, 440, 37);

  // Oil gauge.
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('OIL', 640, 26);
  ctx.fillStyle = '#12283a';
  roundRect(ctx, 640, 34, 170, 14, 7);
  ctx.fill();
  ctx.fillStyle = world.oil > 25 ? PALETTE.oil : '#ff5a6e';
  roundRect(ctx, 640, 34, Math.max(0, 170 * (world.oil / 100)), 14, 7);
  ctx.fill();

  // Flare readiness.
  ctx.fillStyle = world.flareCooldown <= 0 && world.oil >= FLARE.cost ? PALETTE.gold : PALETTE.textDim;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(world.flareCooldown <= 0 ? 'FLARE READY [SPACE]' : `FLARE ${Math.ceil(world.flareCooldown)}s`, 840, 37);

  // Lights: three lamp icons.
  for (let i = 0; i < 3; i += 1) {
    const cx = 1104 + i * 34;
    const cy = 36;
    ctx.fillStyle = i < world.lights ? PALETTE.heart : 'rgba(120, 120, 120, 0.35)';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 3, 7, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 3, 7, 0, Math.PI * 2);
    ctx.moveTo(cx - 12, cy - 1);
    ctx.lineTo(cx, cy + 12);
    ctx.lineTo(cx + 12, cy - 1);
    ctx.fill();
  }
  ctx.restore();

  // Wave banner.
  if (world.waveState === 'banner' && world.phase === 'play') {
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.bannerTimer);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(world.bannerText, VIEW_WIDTH / 2, 150);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(world.bannerSub, VIEW_WIDTH / 2, 186);
    ctx.restore();
  }
}

function drawPanel(ctx, title, lines, accent) {
  const w = 640;
  const h = 150 + lines.length * 30;
  const x = (VIEW_WIDTH - w) / 2;
  const y = 130;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 10, 22, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = accent || PALETTE.panelEdge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent || PALETTE.gold;
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText(title, VIEW_WIDTH / 2, y + 62);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '19px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_WIDTH / 2, y + 108 + i * 30);
  });
  ctx.restore();
}

function drawTitle(ctx, world, best) {
  drawPanel(ctx, 'BEACONKEEPER', [
    'The Last Light — keep the lamp burning through 10 storm waves.',
    'Move the mouse to aim the beam. Light a ship and it sails home.',
    'Burn the wraiths before they reach the lamp. Catch oil barrels.',
    'SPACE = flare burst (costs oil).  P = pause.  M = mute.',
    '',
    best > 0 ? `Best score: ${best}` : 'No keeper has scored yet — be the first.',
    '',
    'CLICK OR PRESS ENTER TO BEGIN',
  ], PALETTE.gold);
}

function drawPause(ctx) {
  drawPanel(ctx, 'PAUSED', [
    'The storm waits for no keeper — but it will wait for you.',
    '',
    'P = resume    R = restart    M = mute',
  ], PALETTE.textDim);
}

function drawGameOver(ctx, world) {
  drawPanel(ctx, 'DARKNESS FALLS', [
    'The lamp went out. The ships are lost to the rocks.',
    '',
    `Score ${world.score}   •   Ships guided home ${world.shipsGuided}`,
    `Wraiths burned ${world.wraithsBurned}   •   Reached wave ${world.wave}`,
    '',
    'PRESS R OR CLICK TO PLAY AGAIN',
  ], '#ff5a6e');
}

function drawVictory(ctx, world) {
  drawPanel(ctx, 'THE LIGHT ENDURES', [
    'Ten waves weathered. Every ship that could be saved, was.',
    '',
    `Score ${world.score}   •   Ships guided home ${world.shipsGuided}`,
    `Wraiths burned ${world.wraithsBurned}   •   Oil barrels caught ${world.barrelsCollected}`,
    `Ships wrecked ${world.shipsWrecked}`,
    '',
    'PRESS R OR CLICK TO PLAY AGAIN',
  ], PALETTE.gold);
}

export function drawWorld(ctx, world, decor, screen, best) {
  ctx.save();
  if (world.shake > 0) {
    const magnitude = world.shake * world.shake * 14;
    ctx.translate((Math.sin(world.time * 91) * magnitude), (Math.cos(world.time * 113) * magnitude));
  }
  drawSky(ctx, decor, world.time);
  drawSea(ctx, decor, world.time);
  drawRocksAndDock(ctx);
  // Beam under the ships so lit ships glow above it.
  if (screen !== 'title') drawBeam(ctx, world);
  for (const barrel of world.barrels) drawBarrel(ctx, barrel);
  for (const ship of world.ships) drawShip(ctx, ship, world.time);
  for (const wraith of world.wraiths) drawWraith(ctx, wraith, world.time);
  drawLighthouse(ctx, world);
  // Title screen keeps its own sweeping beam for the backdrop.
  if (screen === 'title') {
    const saved = world.beamAngle;
    world.beamAngle = -0.6 + Math.sin(world.time * 0.25) * 0.9;
    drawBeam(ctx, world);
    world.beamAngle = saved;
  }
  drawParticles(ctx, world);
  drawFloaters(ctx, world);
  ctx.restore();

  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 60, 80, ${world.flash * 0.35})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  if (screen === 'play' || screen === 'pause') drawHud(ctx, world);
  if (screen === 'title') drawTitle(ctx, world, best);
  if (screen === 'pause') drawPause(ctx);
  if (screen === 'over') drawGameOver(ctx, world);
  if (screen === 'victory') drawVictory(ctx, world);
}
