/**
 * Holo Golf VR — Controls Help (Round 3 Overhaul)
 * Shows contextual help overlay with controls guide for both browser and VR.
 */

export class ControlsHelp {
  private overlay: HTMLDivElement;
  private dismissed = false;

  constructor() {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: fixed; bottom: 70px; right: 20px;
      padding: 15px 20px; max-width: 280px;
      background: rgba(0, 10, 25, 0.85);
      border: 1px solid #003355;
      font-family: 'Courier New', monospace;
      font-size: 11px; color: #4488aa;
      z-index: 120; line-height: 1.6;
      transition: opacity 0.3s ease;
    `;
    this.overlay.innerHTML = `
      <div style="color: #00ccff; font-size: 13px; margin-bottom: 8px; letter-spacing: 2px;">
        CONTROLS
      </div>
      <div style="color: #335566; font-size: 10px; margin-bottom: 6px; letter-spacing: 1px;">
        — MOUSE & KEYBOARD —
      </div>
      <div>🖱 <span style="color: #6688aa;">Click & drag</span> to aim/putt</div>
      <div>🖱 <span style="color: #6688aa;">Right-drag</span> to orbit camera</div>
      <div>⚙ <span style="color: #6688aa;">Scroll</span> to zoom</div>
      <div>🔄 <span style="color: #6688aa;">R</span> to reset ball</div>
      <div>📋 <span style="color: #6688aa;">TAB</span> for scorecard</div>
      <div>⏩ <span style="color: #6688aa;">SPACE</span> skip to next hole</div>
      <div style="margin-top: 8px; color: #335566; font-size: 10px; letter-spacing: 1px;">
        — VR CONTROLLERS —
      </div>
      <div>🎯 <span style="color: #6688aa;">Trigger</span> putt / select</div>
      <div>✊ <span style="color: #6688aa;">Grip</span> power boost</div>
      <div>🅰 <span style="color: #6688aa;">A Button</span> confirm / skip</div>
      <div>🅱 <span style="color: #6688aa;">B Button</span> reset / back</div>
      <div>🕹 <span style="color: #6688aa;">L Stick</span> orbit camera</div>
      <div>🕹 <span style="color: #6688aa;">R Stick</span> menu navigation</div>
      <div style="margin-top: 8px; color: #223344; font-size: 10px; cursor: pointer;"
        id="dismiss-help">Click to dismiss</div>
    `;
    document.body.appendChild(this.overlay);

    this.overlay.querySelector("#dismiss-help")?.addEventListener("click", () => {
      this.dismiss();
    });

    setTimeout(() => {
      if (!this.dismissed) this.fadeOut();
    }, 12000);
  }

  dismiss() {
    this.dismissed = true;
    this.overlay.style.opacity = "0";
    setTimeout(() => {
      this.overlay.style.display = "none";
    }, 300);
  }

  private fadeOut() {
    this.overlay.style.opacity = "0.3";
  }

  show() {
    if (this.dismissed) return;
    this.overlay.style.display = "block";
    this.overlay.style.opacity = "1";
  }

  hide() {
    this.overlay.style.display = "none";
  }
}
