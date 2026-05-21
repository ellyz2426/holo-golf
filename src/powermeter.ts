/**
 * Holo Golf VR — Power Meter
 * Visual power indicator shown while aiming in browser mode.
 */

export class PowerMeter {
  private container: HTMLDivElement;
  private bar: HTMLDivElement;
  private label: HTMLDivElement;
  private visible = false;

  constructor() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      width: 300px; height: 24px; background: rgba(0, 10, 20, 0.85);
      border: 1px solid #003344; display: none; z-index: 150;
      font-family: 'Courier New', monospace;
    `;

    this.bar = document.createElement("div");
    this.bar.style.cssText = `
      width: 0%; height: 100%;
      background: linear-gradient(90deg, #00ff88, #ffff00, #ff4444);
      transition: width 0.05s ease;
    `;
    this.container.appendChild(this.bar);

    this.label = document.createElement("div");
    this.label.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: #ffffff; font-size: 11px; letter-spacing: 2px;
      text-shadow: 0 0 5px #000;
    `;
    this.container.appendChild(this.label);

    document.body.appendChild(this.container);
  }

  show() {
    this.visible = true;
    this.container.style.display = "block";
  }

  hide() {
    this.visible = false;
    this.container.style.display = "none";
  }

  update(power: number, maxPower: number) {
    if (!this.visible) return;
    const pct = Math.min((power / maxPower) * 100, 100);
    this.bar.style.width = `${pct}%`;

    if (pct < 30) {
      this.label.textContent = "GENTLE";
    } else if (pct < 60) {
      this.label.textContent = "MEDIUM";
    } else if (pct < 85) {
      this.label.textContent = "STRONG";
    } else {
      this.label.textContent = "FULL POWER";
    }
  }
}
