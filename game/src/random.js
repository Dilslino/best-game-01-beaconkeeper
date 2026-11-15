// Seeded random numbers (mulberry32). The game never calls Math.random, so a
// seed fully decides a run: screenshots staged from a seed are reproducible.
export function makeSeededRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickBetween(random, low, high) {
  return low + random() * (high - low);
}

export function pickInt(random, low, high) {
  return low + Math.floor(random() * (high - low + 1));
}
