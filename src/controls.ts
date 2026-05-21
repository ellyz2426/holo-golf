/**
 * Holo Golf VR — Controls Help
 * Shows contextual help overlay with controls guide.
 */

export class ControlsHelp {
  private overlay: HTMLDivElement;
  private dismissed = false;

  constructor() {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: fixed; bottom: 70px; right: 20px;
      padding: 15px 20px; max-width: 260px;
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
      <div>🖱 <span style="color: #6688aa;">Click & drag</span> to aim/putt</div>
      <div>🖱 <span style="color: #6688aa;">Right-drag</span> to orbit camera</div>
      <div>⚙ <span style="color: #6688aa;">Scroll</span> to zoom</div>
      <div>🔄 <span style="color: #6688aa;">R</span> to reset ball</div>
      <div>📋 <span style="color: #6688aa;">TAB</span> for scorecard</div>
      <div style="margin-top: 8px; color: #334455; font-size: 10px; cursor: pointer;"
        id="dismiss-help">Click to dismiss</div>
    `;
    document.body.appendChild(this.overlay);

    this.overlay.querySelector("#dismiss-help")?.addEventListener("click", () => {
      this.dismiss();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (!this.dismissed) this.fadeOut();
    }, 10000);
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
