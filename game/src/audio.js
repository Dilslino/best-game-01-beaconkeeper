// All sound is synthesized with WebAudio: no audio files, no network.
// The synth is created lazily on the first player gesture; shot staging in a
// headless browser never touches it, so screenshots stay silent and stable.
export function createSoundBank() {
  const bank = {
    context: null,
    master: null,
    muted: false,
    wind: null,

    ensure() {
      if (this.context) return true;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.context.destination);
        this.startWind();
        return true;
      } catch {
        return false;
      }
    },

    startWind() {
      const ctx = this.context;
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start();
      this.wind = { gain };
    },

    tone({ frequency, slideTo, seconds, type, volume, when = 0 }) {
      if (!this.context || this.muted) return;
      const ctx = this.context;
      const start = ctx.currentTime + when;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type || 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume || 0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + seconds + 0.05);
    },

    docked() {
      this.tone({ frequency: 523, seconds: 0.18, type: 'triangle', volume: 0.25 });
      this.tone({ frequency: 784, seconds: 0.3, type: 'triangle', volume: 0.25, when: 0.12 });
    },

    burned() {
      this.tone({ frequency: 880, slideTo: 180, seconds: 0.22, type: 'sawtooth', volume: 0.12 });
    },

    flare() {
      this.tone({ frequency: 220, slideTo: 660, seconds: 0.35, type: 'sine', volume: 0.22 });
    },

    horn() {
      this.tone({ frequency: 98, seconds: 0.9, type: 'sawtooth', volume: 0.16 });
      this.tone({ frequency: 147, seconds: 0.9, type: 'sawtooth', volume: 0.1 });
    },

    hit() {
      this.tone({ frequency: 160, slideTo: 55, seconds: 0.4, type: 'square', volume: 0.2 });
    },

    barrel() {
      this.tone({ frequency: 660, slideTo: 990, seconds: 0.12, type: 'sine', volume: 0.15 });
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
      return this.muted;
    },
  };
  return bank;
}
