/**
 * Holo Golf VR — Post-Processing Effects
 * Scanline overlay for holodeck CRT aesthetic.
 * Camera shake system for impact feedback.
 * Slow-motion near-hole dramatic effect.
 */

// === Scanline Overlay ===

export class ScanlineOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private visible = true;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "holo-scanlines";
    this.canvas.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.06;
      mix-blend-mode: overlay;
    `;
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.draw();
  }

  private draw() {
    const { ctx, canvas } = this;
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);

    // Horizontal scanlines
    ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }

    // Very subtle vertical scanlines
    ctx.fillStyle = "rgba(0, 255, 255, 0.05)";
    for (let x = 0; x < w; x += 3) {
      ctx.fillRect(x, 0, 1, h);
    }

    // Vignette edges
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  setVisible(v: boolean) {
    this.visible = v;
    this.canvas.style.display = v ? "block" : "none";
  }
}

// === Camera Shake ===

export class CameraShake {
  private intensity = 0;
  private decay = 8;
  private offsetX = 0;
  private offsetY = 0;
  private offsetZ = 0;
  private shakeTime = 0;

  /** Trigger a shake with given intensity (0-1 range recommended) */
  trigger(intensity: number, decay = 8) {
    this.intensity = Math.min(this.intensity + intensity, 1);
    this.decay = decay;
    this.shakeTime = 0;
  }

  update(dt: number): { x: number; y: number; z: number } {
    if (this.intensity < 0.001) {
      this.offsetX = 0;
      this.offsetY = 0;
      this.offsetZ = 0;
      return { x: 0, y: 0, z: 0 };
    }

    this.shakeTime += dt;
    this.intensity *= Math.exp(-this.decay * dt);

    // High-frequency random offset
    const mag = this.intensity * 0.08;
    this.offsetX = (Math.random() - 0.5) * mag;
    this.offsetY = (Math.random() - 0.5) * mag * 0.5;
    this.offsetZ = (Math.random() - 0.5) * mag;

    return { x: this.offsetX, y: this.offsetY, z: this.offsetZ };
  }

  get isShaking(): boolean {
    return this.intensity > 0.001;
  }
}

// === Slow Motion Controller ===

export class SlowMotionController {
  private targetScale = 1.0;
  private currentScale = 1.0;
  private lerpSpeed = 3.0;
  private _active = false;
  private duration = 0;
  private timer = 0;

  /** Trigger slow motion for a duration (seconds) */
  trigger(timeScale = 0.3, duration = 1.5) {
    this.targetScale = timeScale;
    this.duration = duration;
    this.timer = duration;
    this._active = true;
  }

  update(dt: number): number {
    if (this._active) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this._active = false;
        this.targetScale = 1.0;
      }
    }

    // Smooth lerp toward target
    this.currentScale += (this.targetScale - this.currentScale) * this.lerpSpeed * dt;
    return this.currentScale;
  }

  get active(): boolean {
    return this._active;
  }

  get scale(): number {
    return this.currentScale;
  }
}

// === Streak/Combo System ===

export interface StreakState {
  consecutive: number;
  bestStreak: number;
  lastHolePar: boolean;
  message: string;
  showTimer: number;
}

export class StreakTracker {
  state: StreakState = {
    consecutive: 0,
    bestStreak: 0,
    lastHolePar: false,
    message: "",
    showTimer: 0,
  };

  /** Call after each hole completion. Returns a message if streak is notable. */
  recordHole(strokes: number, par: number): string | null {
    if (strokes <= par) {
      this.state.consecutive++;
      this.state.lastHolePar = true;

      if (this.state.consecutive > this.state.bestStreak) {
        this.state.bestStreak = this.state.consecutive;
      }

      if (this.state.consecutive >= 3) {
        const msg = this.getStreakMessage(this.state.consecutive);
        this.state.message = msg;
        this.state.showTimer = 2.5;
        return msg;
      }
    } else {
      this.state.consecutive = 0;
      this.state.lastHolePar = false;
    }

    return null;
  }

  private getStreakMessage(count: number): string {
    if (count >= 9) return "PERFECT ROUND!";
    if (count >= 7) return "UNSTOPPABLE! ×" + count;
    if (count >= 5) return "ON FIRE! ×" + count;
    if (count >= 3) return "HOT STREAK! ×" + count;
    return "";
  }

  update(dt: number) {
    if (this.state.showTimer > 0) {
      this.state.showTimer -= dt;
    }
  }

  reset() {
    this.state.consecutive = 0;
    this.state.lastHolePar = false;
    this.state.message = "";
    this.state.showTimer = 0;
  }
}
