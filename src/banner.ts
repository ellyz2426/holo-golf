/**
 * Holo Golf VR — Hole Intro Banner
 * Shows an animated banner when transitioning between holes.
 */

export class HoleBanner {
  private overlay: HTMLDivElement;
  private active = false;
  private timer = 0;

  constructor() {
    this.overlay = document.createElement("div");
    this.overlay.id = "hole-banner";
    this.overlay.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center; z-index: 180; pointer-events: none;
      font-family: 'Courier New', monospace;
      transition: opacity 0.3s ease;
      display: none;
    `;
    document.body.appendChild(this.overlay);
  }

  show(holeNumber: number, holeName: string, par: number) {
    this.active = true;
    this.timer = 2.5;

    this.overlay.innerHTML = `
      <div style="
        font-size: 14px; color: #4488aa; letter-spacing: 6px;
        margin-bottom: 8px; text-transform: uppercase;
      ">HOLE</div>
      <div style="
        font-size: 80px; color: #00ffff; font-weight: bold;
        text-shadow: 0 0 30px #00ffff, 0 0 60px #0066aa;
        line-height: 1;
      ">${holeNumber}</div>
      <div style="
        font-size: 22px; color: #ffffff; margin-top: 10px;
        letter-spacing: 3px;
      ">${holeName.toUpperCase()}</div>
      <div style="
        font-size: 16px; color: #ffff00; margin-top: 10px;
        letter-spacing: 2px;
      ">PAR ${par}</div>
      <div style="
        width: 150px; height: 2px; margin: 15px auto 0;
        background: linear-gradient(90deg, transparent, #00ffff, transparent);
      "></div>
    `;

    this.overlay.style.display = "block";
    this.overlay.style.opacity = "1";
  }

  update(dt: number) {
    if (!this.active) return;
    this.timer -= dt;

    if (this.timer < 0.5) {
      this.overlay.style.opacity = `${this.timer / 0.5}`;
    }

    if (this.timer <= 0) {
      this.active = false;
      this.overlay.style.display = "none";
    }
  }

  isActive(): boolean {
    return this.active;
  }
}
