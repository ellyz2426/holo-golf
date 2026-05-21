/**
 * Holo Golf VR — Scorecard
 * Detailed scorecard display as HTML overlay accessible mid-round.
 * Dynamically reads hole names from the active course.
 */
import { GameManager } from "./game";
import { CourseManager } from "./course";

export class ScorecardOverlay {
  private overlay: HTMLDivElement;
  private game: GameManager;
  private visible = false;

  constructor(game: GameManager) {
    this.game = game;
    this.overlay = document.createElement("div");
    this.overlay.id = "scorecard-overlay";
    this.overlay.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 480px; max-width: 90vw; padding: 25px;
      background: rgba(0, 10, 25, 0.95);
      border: 2px solid #00ccff;
      font-family: 'Courier New', monospace;
      color: #ffffff;
      z-index: 200;
      display: none;
      pointer-events: auto;
    `;
    document.body.appendChild(this.overlay);
  }

  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this.redraw();
      this.overlay.style.display = "block";
    } else {
      this.overlay.style.display = "none";
    }
  }

  hide() {
    this.visible = false;
    this.overlay.style.display = "none";
  }

  isVisible(): boolean {
    return this.visible;
  }

  private redraw() {
    const score = this.game.courseScore;
    const totalPar = score.holes.reduce((s, h) => s + h.par, 0);
    const holeCount = score.holes.length;

    // Get hole names from the course data via game manager
    const courseManager = (this.game as any).courseManager as CourseManager | undefined;
    const courseData = courseManager?.getCourse(this.game.currentCourseIndex);

    let html = `
      <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-size: 20px; color: #00ffff; letter-spacing: 3px;">SCORECARD</div>
        <div style="font-size: 13px; color: #4488aa;">${score.courseName}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="color: #4488aa; border-bottom: 1px solid #223344;">
          <th style="padding: 4px 8px; text-align: left;">HOLE</th>
          <th style="padding: 4px 8px;">NAME</th>
          <th style="padding: 4px 8px;">PAR</th>
          <th style="padding: 4px 8px;">SCORE</th>
          <th style="padding: 4px 8px;">+/-</th>
        </tr>
    `;

    for (let i = 0; i < holeCount; i++) {
      const h = score.holes[i];
      const isCurrent = i === this.game.currentHoleIndex;
      const strokes = h.strokes > 0 ? h.strokes :
        (isCurrent ? this.game.currentStrokes : 0);
      const diff = strokes > 0 ? strokes - h.par : 0;

      // Get hole name from course data
      const holeName = courseData?.holes[i]?.name ?? `Hole ${i + 1}`;
      const bgColor = isCurrent ? "rgba(0, 100, 150, 0.2)" : "transparent";
      const diffColor = diff < 0 ? "#00ff88" : diff === 0 ? "#ffffff" : "#ff6644";
      const diffText = strokes === 0 ? "-" :
        strokes === 1 ? "ACE" :
        diff === 0 ? "E" :
        diff > 0 ? `+${diff}` : `${diff}`;

      html += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #112233;">
          <td style="padding: 4px 8px; color: ${isCurrent ? '#00ffff' : '#888'};">${i + 1}</td>
          <td style="padding: 4px 8px; color: #6688aa; font-size: 11px;">${holeName}</td>
          <td style="padding: 4px 8px; text-align: center;">${h.par}</td>
          <td style="padding: 4px 8px; text-align: center; font-weight: bold;">
            ${strokes > 0 ? strokes : '-'}
          </td>
          <td style="padding: 4px 8px; text-align: center; color: ${diffColor}; font-weight: bold;">
            ${diffText}
          </td>
        </tr>
      `;
    }

    const completedStrokes = score.holes.filter(h => h.strokes > 0).reduce((s, h) => s + h.strokes, 0);
    const completedPar = score.holes.filter(h => h.strokes > 0).reduce((s, h) => s + h.par, 0);

    html += `
        <tr style="border-top: 2px solid #00ccff; color: #00ffff; font-weight: bold;">
          <td colspan="2" style="padding: 6px 8px;">TOTAL</td>
          <td style="padding: 6px 8px; text-align: center;">${totalPar}</td>
          <td style="padding: 6px 8px; text-align: center;">${completedStrokes || '-'}</td>
          <td style="padding: 6px 8px; text-align: center;">
            ${completedStrokes > 0 ? (completedStrokes - completedPar <= 0 ? completedStrokes - completedPar : '+' + (completedStrokes - completedPar)) : '-'}
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin-top: 12px; color: #334455; font-size: 11px;">
        Press TAB or click to close
      </div>
    `;

    this.overlay.innerHTML = html;
    this.overlay.addEventListener("click", () => this.hide());
  }
}
