# Beaconkeeper: The Last Light

A complete, original 2D canvas game for make.fun's best-game-01 bounty.
You are the keeper of the last lighthouse on a storm coast. Aim the beam
with the mouse, guide lost ships into the harbour, burn the storm wraiths
before they snuff the lamp, and catch drifting oil barrels to keep the
light burning through 10 waves. Survive all 10 waves to win; lose all 3
lights and the darkness takes the coast.

## How to play

- **Mouse** — aim the beam. A ship the beam touches turns for the harbour.
- **Click / Space** — flare burst: a wide, bright beam that burns every
  wraith in its cone. Costs 15 oil, 3 s cooldown.
- **Arrow keys** — rotate the beam without the mouse.
- **P** — pause. **M** — mute. **R** — restart. **Enter / click** — start.

Oil drains while the beam burns; an empty lamp dims to a stub until you
haul in a barrel. Every docked ship scores 100, every burned wraith 25.

## Run it

```sh
node serve.ts            # serves game/ on http://127.0.0.1:8080
```

No build step, no network request, no external asset: art is drawn in
code, sound is synthesized with WebAudio.

## Shots

`shots.json` lists the four deterministic scenes (`?shot=play|title|storm|
victory&seed=7`): each plays the real rules forward with a seeded autopilot,
so the same seed always gives the same frame.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## License

MIT — see LICENSE.
