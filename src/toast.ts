/**
 * Holo Golf VR — Toast Notification System
 * Displays transient notifications for game events:
 * water hazard, out-of-bounds, achievements, penalties.
 */

interface ToastEntry {
  element: HTMLDivElement;
  timer: number;
  fadingOut: boolean;
}

const TOAST_DURATION = 2.5;
const TOAST_FADE = 0.5;

export class ToastManager {
  private container: HTMLDivElement;
  private toasts: ToastEntry[] = [];

  constructor() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      z-index: 300; pointer-events: none;
      font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.container);
  }

  show(
    message: string,
    color = "#00ffff",
    icon = "⚠",
    duration = TOAST_DURATION,
  ) {
    const el = document.createElement("div");
    el.style.cssText = `
      padding: 10px 24px;
      background: rgba(0, 8, 20, 0.92);
      border: 1px solid ${color};
      color: ${color};
      font-size: 16px;
      letter-spacing: 2px;
      text-shadow: 0 0 10px ${color};
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    el.textContent = `${icon} ${message}`;
    this.container.appendChild(el);

    // Trigger enter animation
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });

    this.toasts.push({ element: el, timer: duration, fadingOut: false });
  }

  showWaterHazard() {
    this.show("WATER HAZARD · +1 STROKE", "#0088ff", "💧");
  }

  showOutOfBounds() {
    this.show("OUT OF BOUNDS · +1 STROKE", "#ff4400", "⛳");
  }

  showPenalty(message: string) {
    this.show(message, "#ff6600", "⚠");
  }

  showAchievement(name: string) {
    this.show(name, "#ffaa00", "🏆", 3.5);
  }

  showNewRecord() {
    this.show("NEW PERSONAL BEST!", "#ffff00", "⭐", 3.5);
  }

  update(dt: number) {
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      t.timer -= dt;

      if (t.timer <= TOAST_FADE && !t.fadingOut) {
        t.fadingOut = true;
        t.element.style.opacity = "0";
        t.element.style.transform = "translateY(-10px)";
      }

      if (t.timer <= 0) {
        this.container.removeChild(t.element);
        this.toasts.splice(i, 1);
      }
    }
  }
}
