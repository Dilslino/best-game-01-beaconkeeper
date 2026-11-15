// Keyboard and mouse input for Beaconkeeper. The canvas is the whole window,
// so mouse position maps straight onto the playfield.
import { LAMP } from './config.js';

export function createInput(canvas) {
  const input = {
    mouseX: 900,
    mouseY: 200,
    flareQueued: false,
    pressedKeys: new Set(),

    aimAngle() {
      return Math.atan2(this.mouseY - LAMP.y, this.mouseX - LAMP.x);
    },

    takeFlare() {
      const queued = this.flareQueued;
      this.flareQueued = false;
      return queued;
    },
  };

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });

  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) input.flareQueued = true;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    input.pressedKeys.add(event.code);
    if (event.code === 'Space') {
      input.flareQueued = true;
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    input.pressedKeys.delete(event.code);
  });

  return input;
}
