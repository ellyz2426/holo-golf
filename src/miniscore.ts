/**
 * Holo Golf VR — Mini Scorecard Overlay (Round 6)
 * Always-visible compact scorecard during gameplay showing
 * current hole, strokes, vs-par, and course progress.
 */

export class MiniScorecard {
  private overlay: HTMLDivElement;
  private visible = false;

  constructor() {
    this.overlay = document.createElement("div");
    this.overlay.id = "mini-scorecard";
    this.overlay.style.cssText = `
      position: fixed; bottom: 12px; left: 12px;
      padding: 8px 12px;
      background: rgba(0, 8, 20, 0.75);
      border: 1px solid rgba(0, 255, 255, 0.3);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #88aacc;
      z-index: 90;
      pointer-events: none;
      display: none;
      min-width: 140px;
      backdrop-filter: blur(4px);
      line-height: 1.4;
    `;
    document.body.appendChild(this.overlay);
  }

  show() {
    this.visible = true;
    this.overlay.style.display = "block";
  }

  hide() {
    this.visible = false;
    this.overlay.style.display = "none";
  }

  /**
   * Update the mini scorecard display.
   * @param courseName Course name
   * @param courseIndex Course index (0-2)
   * @param holeIndex Current hole (0-based)
   * @param totalHoles Total holes in course
   * @param currentStrokes Strokes on current hole
   * @param currentPar Par for current hole
   * @param totalStrokes Total strokes so far in the course
   * @param totalPar Total par for holes completed
   * @param holeScores Array of {strokes, par} for completed holes
   */
  update(
    courseName: string,
    courseIndex: number,
    holeIndex: number,
    totalHoles: number,
    currentStrokes: number,
    currentPar: number,
    totalStrokes: number,
    totalPar: number,
    holeScores: Array<{ strokes: number; par: number }>,
  ) {
    if (!this.visible) return;

    const themeColors = ["#00ffff", "#ff44aa", "#ff6600"];
    const color = themeColors[courseIndex] || "#00ffff";

    // Current hole vs par
    const diff = currentStrokes - currentPar;
    const diffText = diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`;
    const diffColor = diff < 0 ? "#00ff88" : diff === 0 ? "#ffffff" : "#ff6644";

    // Overall vs par
    const overallDiff = totalStrokes - totalPar;
    const overallDiffText = overallDiff === 0 ? "E" : overallDiff > 0 ? `+${overallDiff}` : `${overallDiff}`;
    const overallDiffColor = overallDiff < 0 ? "#00ff88" : overallDiff === 0 ? "#aaaaaa" : "#ff6644";

    // Mini hole-by-hole dots
    let dotsHtml = '';
    for (let i = 0; i < totalHoles; i++) {
      if (i < holeScores.length && holeScores[i].strokes > 0) {
        const hDiff = holeScores[i].strokes - holeScores[i].par;
        const dotColor = hDiff < 0 ? "#00ff88" : hDiff === 0 ? "#ffffff" : "#ff6644";
        dotsHtml += `<span style="color:${dotColor}">●</span>`;
      } else if (i === holeIndex) {
        dotsHtml += `<span style="color:${color}">◆</span>`;
      } else {
        dotsHtml += `<span style="color:#334455">○</span>`;
      }
    }

    this.overlay.innerHTML = `
      <div style="color:${color}; font-size: 10px; letter-spacing: 2px; margin-bottom: 2px;">
        ${courseName}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span style="color: #ffffff; font-size: 14px; font-weight: bold;">
          H${holeIndex + 1}
        </span>
        <span style="font-size: 10px; color: #556677;">Par ${currentPar}</span>
        <span style="color: #ffffff; font-size: 14px;">${currentStrokes}</span>
        <span style="color: ${diffColor}; font-size: 12px; font-weight: bold;">${diffText}</span>
      </div>
      <div style="font-size: 9px; margin-top: 3px; letter-spacing: 1px;">
        ${dotsHtml}
      </div>
      <div style="font-size: 10px; color: #556677; margin-top: 2px; display: flex; justify-content: space-between;">
        <span>Total: ${totalStrokes}</span>
        <span style="color: ${overallDiffColor}; font-weight: bold;">${overallDiffText}</span>
      </div>
    `;

    this.overlay.style.borderColor = `${color}50`;
  }
}
