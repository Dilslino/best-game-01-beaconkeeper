// Beaconkeeper tuning: every number the simulation and the renderer share.
// One place to tune the game; nothing here reads the clock or the network.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

export const LAMP = { x: 172, y: 296 };
export const TOWER = { x: 172, baseY: 486, topY: 296, halfWidth: 34 };
export const DOCK = { x: 168, y: 664, halfWidth: 96 };

export const BEAM = {
  range: 780,
  halfAngle: 0.13,
  turnRate: 3.6,
  dimRange: 320,
  oilDrainPerSecond: 1.1,
};

export const FLARE = {
  cost: 15,
  cooldownSeconds: 3,
  durationSeconds: 0.6,
  halfAngle: 0.5,
  range: 940,
};

export const OIL = { max: 100, start: 100, barrelGain: 30, beamResume: 12 };

export const LIGHTS = { start: 3 };

export const SHIP = {
  baseSpeed: 26,
  speedPerWave: 1.6,
  guidedSpeed: 62,
  spawnGapSeconds: 4.2,
  scoreDocked: 100,
  wreckX: 64,
};

export const WRAITH = {
  baseSpeed: 20,
  speedPerWave: 2.2,
  scoreBurned: 25,
  lampRadius: 30,
  spawnIntervalBase: 3.4,
  spawnIntervalPerWave: 0.24,
  spawnIntervalMin: 1.3,
  maxAliveBase: 5,
};

export const BARREL = { spawnEverySeconds: 7, score: 10 };

export const WAVES = { total: 10, shipsPerWaveBase: 2, bannerSeconds: 3 };

export const SCORE = { docked: 100, burned: 25, barrel: 10 };

export const PALETTE = {
  skyTop: '#070d24',
  skyMid: '#0d1f3c',
  horizon: '#173a52',
  seaDeep: '#06222e',
  seaShallow: '#0d3a44',
  moon: '#f4e9c8',
  star: '#cfe4ff',
  towerRed: '#b8452f',
  towerCream: '#f2e3c6',
  rock: '#2b3442',
  rockTop: '#4a5a6e',
  dockWood: '#7a5230',
  beamCore: 'rgba(255, 236, 170, 0.85)',
  beamEdge: 'rgba(255, 214, 110, 0.20)',
  shipHull: '#5a3423',
  shipSail: '#e8dcc0',
  shipLantern: '#ffd76a',
  wraith: '#1a1030',
  wraithEye: '#c77dff',
  oil: '#ffb347',
  heart: '#ff5a6e',
  panel: 'rgba(6, 14, 30, 0.82)',
  panelEdge: '#2e4a6b',
  text: '#f4ead2',
  textDim: '#9db4c8',
  gold: '#ffd76a',
};
