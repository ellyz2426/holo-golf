/**
 * Holo Golf VR — Audio Manager
 * Procedural audio using Web Audio API for all game sounds.
 */

export class AudioManager {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode;
  private initialized = false;

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
      // Will resume on user interaction
      document.addEventListener("click", () => this.ctx.resume(), { once: true });
      document.addEventListener("touchstart", () => this.ctx.resume(), { once: true });
    }
    this.initialized = true;
  }

  // === Ambient Music ===

  playAmbient() {
    if (this.ambientOsc) return;

    // Drone pad — layered oscillators
    const now = this.ctx.currentTime;

    // Base drone
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(55, now); // A1
    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.3, now);
    osc1.connect(gain1);
    gain1.connect(this.ambientGain);
    osc1.start(now);

    // Fifth harmony
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(82.4, now); // E2
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.15, now);
    osc2.connect(gain2);
    gain2.connect(this.ambientGain);
    osc2.start(now);

    // High shimmer
    const osc3 = this.ctx.createOscillator();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(440, now);
    const gain3 = this.ctx.createGain();
    gain3.gain.setValueAtTime(0.05, now);
    // LFO on shimmer
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.3, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(20, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc3.frequency);
    lfo.start(now);
    osc3.connect(gain3);
    gain3.connect(this.ambientGain);
    osc3.start(now);

    // Fade in
    this.ambientGain.gain.linearRampToValueAtTime(1.0, now + 3);

    this.ambientOsc = osc1;
  }

  stopAmbient() {
    if (this.ambientOsc) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.linearRampToValueAtTime(0, now + 1);
      // Will be garbage collected eventually
      this.ambientOsc = null;
    }
  }

  // === Sound Effects ===

  playPutt() {
    this.playTone(220, 0.08, 0.4, "sine");
    this.playTone(330, 0.05, 0.2, "triangle", 0.02);
  }

  playSwing(power: number) {
    // Whoosh sound — noise + filter sweep
    const now = this.ctx.currentTime;
    const duration = 0.15 + power * 0.1;

    const bufferSize = this.ctx.sampleRate * duration;
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

  playHoleStart() {
    // Rising arpeggio
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
    // Triumphant fanfare
    const notes = [523, 659, 784, 1047, 784, 1047]; // C5 E5 G5 C6 G5 C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.3, 0.35, "triangle", i * 0.12);
    });
    // Sparkle noise
    setTimeout(() => this.playSparkle(), 600);
  }

  playUnderPar() {
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 0.3, "triangle", i * 0.1);
    });
  }

  playCourseComplete() {
    // Grand finale sound
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.4, 0.3, "triangle", i * 0.15);
    });
    setTimeout(() => this.playSparkle(), 800);
    setTimeout(() => this.playSparkle(), 1200);
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
    const now = this.ctx.currentTime;
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
