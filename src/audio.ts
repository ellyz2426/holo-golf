/**
 * Holo Golf VR — Audio Manager (Round 3 Overhaul)
 * Procedural audio using Web Audio API for all game sounds.
 * New: course-specific ambient music, stroke limit sound, enhanced effects.
 */

// Course ambient configurations
const COURSE_AMBIENTS = [
  // Course 0: Neon Circuit — clean synth pad, A minor
  { baseFreq: 55, fifthFreq: 82.4, shimmerFreq: 440, lfoRate: 0.3, padType: "sine" as OscillatorType },
  // Course 1: Quantum Field — darker, Bb minor, slower LFO
  { baseFreq: 58.27, fifthFreq: 87.31, shimmerFreq: 466.16, lfoRate: 0.15, padType: "triangle" as OscillatorType },
  // Course 2: Cosmic Abyss — ominous, E minor, deep bass
  { baseFreq: 41.2, fifthFreq: 61.74, shimmerFreq: 329.63, lfoRate: 0.08, padType: "sawtooth" as OscillatorType },
];

export class AudioManager {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;
  private ambientGain: GainNode;
  private initialized = false;

  // Active ambient oscillators for cleanup
  private ambientOscillators: OscillatorNode[] = [];
  private ambientGains: GainNode[] = [];
  private currentCourseIndex = -1;

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.15;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.connect(this.musicGain);
  }

  async init() {
    if (this.ctx.state === "suspended") {
      document.addEventListener("click", () => this.ctx.resume(), { once: true });
      document.addEventListener("touchstart", () => this.ctx.resume(), { once: true });
    }
    this.initialized = true;
  }

  // === Ambient Music ===

  playAmbient() {
    this.switchCourseAmbient(0);
  }

  switchCourseAmbient(courseIndex: number) {
    if (courseIndex === this.currentCourseIndex) return;
    this.currentCourseIndex = courseIndex;

    // Fade out existing ambient
    this.stopAmbient();

    const config = COURSE_AMBIENTS[courseIndex] || COURSE_AMBIENTS[0];
    const now = this.ctx.currentTime;

    // Base drone
    const osc1 = this.ctx.createOscillator();
    osc1.type = config.padType;
    osc1.frequency.setValueAtTime(config.baseFreq, now);
    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.25, now);
    osc1.connect(gain1);
    gain1.connect(this.ambientGain);
    osc1.start(now);
    this.ambientOscillators.push(osc1);
    this.ambientGains.push(gain1);

    // Fifth harmony
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(config.fifthFreq, now);
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.12, now);
    osc2.connect(gain2);
    gain2.connect(this.ambientGain);
    osc2.start(now);
    this.ambientOscillators.push(osc2);
    this.ambientGains.push(gain2);

    // High shimmer with LFO
    const osc3 = this.ctx.createOscillator();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(config.shimmerFreq, now);
    const gain3 = this.ctx.createGain();
    gain3.gain.setValueAtTime(0.04, now);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(config.lfoRate, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(20, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc3.frequency);
    lfo.start(now);

    osc3.connect(gain3);
    gain3.connect(this.ambientGain);
    osc3.start(now);
    this.ambientOscillators.push(osc3, lfo);
    this.ambientGains.push(gain3);

    // Sub bass for courses 1 and 2
    if (courseIndex >= 1) {
      const subOsc = this.ctx.createOscillator();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(config.baseFreq / 2, now);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.15, now);
      subOsc.connect(subGain);
      subGain.connect(this.ambientGain);
      subOsc.start(now);
      this.ambientOscillators.push(subOsc);
      this.ambientGains.push(subGain);
    }

    // Fade in
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.gain.linearRampToValueAtTime(1.0, now + 2);
  }

  stopAmbient() {
    const now = this.ctx.currentTime;
    // Fade out existing
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);

    // Stop and disconnect old oscillators
    setTimeout(() => {
      for (const osc of this.ambientOscillators) {
        try { osc.stop(); } catch {}
      }
      for (const g of this.ambientGains) {
        try { g.disconnect(); } catch {}
      }
      this.ambientOscillators = [];
      this.ambientGains = [];
    }, 600);
  }

  // === Sound Effects ===

  playPutt() {
    this.playTone(220, 0.08, 0.4, "sine");
    this.playTone(330, 0.05, 0.2, "triangle", 0.02);
  }

  playSwing(power: number) {
    const now = this.ctx.currentTime;
    const duration = 0.15 + power * 0.1;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800 + power * 2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);
    filter.Q.setValueAtTime(2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * power, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  playBounce(force: number) {
    const vol = Math.min(force * 0.5, 0.4);
    this.playTone(180 + force * 200, 0.06, vol, "sine");
  }

  playWallBounce(speed: number) {
    const vol = Math.min(speed * 0.3, 0.5);
    this.playTone(400, 0.04, vol, "square");
    this.playTone(300, 0.06, vol * 0.5, "sine", 0.02);
  }

  playBumperHit(speed: number) {
    const vol = Math.min(speed * 0.3, 0.6);
    this.playTone(600, 0.08, vol, "sine");
    this.playTone(900, 0.06, vol * 0.6, "triangle", 0.03);
    this.playTone(1200, 0.04, vol * 0.3, "sine", 0.06);
  }

  playTeleport() {
    const notes = [800, 1200, 1600, 2400];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.12, 0.25, "sine", i * 0.04);
    });
    [2400, 1600, 1200, 800].forEach((freq, i) => {
      this.playTone(freq, 0.08, 0.15, "triangle", 0.2 + i * 0.03);
    });
  }

  playWindZone() {
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.3;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(1, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  playHoleStart() {
    const notes = [262, 330, 392, 523]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.15, 0.2, "triangle", i * 0.08);
    });
  }

  playHoleComplete() {
    const notes = [392, 494, 523, 659]; // G4 B4 C5 E5
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 0.25, "triangle", i * 0.1);
    });
  }

  playHoleInOne() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.3, 0.35, "triangle", i * 0.12);
    });
    setTimeout(() => this.playSparkle(), 600);
  }

  playUnderPar() {
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 0.3, "triangle", i * 0.1);
    });
  }

  playCourseComplete() {
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.4, 0.3, "triangle", i * 0.15);
    });
    setTimeout(() => this.playSparkle(), 800);
    setTimeout(() => this.playSparkle(), 1200);
  }

  playStrokeLimit() {
    // Descending "wah wah" sound
    this.playTone(400, 0.3, 0.25, "triangle");
    this.playTone(350, 0.3, 0.2, "triangle", 0.15);
    this.playTone(280, 0.4, 0.25, "triangle", 0.3);
  }

  playReset() {
    this.playTone(400, 0.1, 0.15, "sine");
    this.playTone(300, 0.1, 0.15, "sine", 0.05);
  }

  playMenuSelect() {
    this.playTone(600, 0.08, 0.2, "triangle");
  }

  playMenuHover() {
    this.playTone(800, 0.04, 0.1, "sine");
  }

  private playSparkle() {
    for (let i = 0; i < 8; i++) {
      const freq = 2000 + Math.random() * 4000;
      this.playTone(freq, 0.05, 0.1, "sine", i * 0.03 + Math.random() * 0.02);
    }
  }

  private playTone(
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
    delay = 0,
  ) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  setMasterVolume(vol: number) {
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
  }

  setSFXVolume(vol: number) {
    this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
  }

  setMusicVolume(vol: number) {
    this.musicGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
  }
}
