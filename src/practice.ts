/**
 * Holo Golf VR — Practice Mode
 * Allows replaying individual holes for practice without affecting course scores.
 * Accessible from the course select screen.
 */
import { GameManager, GameState } from "./game";
import { AudioManager } from "./audio";

export class PracticeMode {
  private overlay: HTMLDivElement;
  private game: GameManager;
  private audio: AudioManager;
  private visible = false;
  private selectedCourse = 0;
  private practiceActive = false;
  private bestPracticeScores: Map<string, number> = new Map();

  constructor(game: GameManager, audio: AudioManager) {
    this.game = game;
    this.audio = audio;

    this.overlay = document.createElement("div");
    this.overlay.id = "practice-overlay";
    this.overlay.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 520px; max-width: 92vw; max-height: 80vh;
      padding: 25px; overflow-y: auto;
      background: rgba(0, 10, 25, 0.95);
      border: 2px solid #44ff88;
      font-family: 'Courier New', monospace;
      color: #ffffff;
      z-index: 250;
      display: none;
      pointer-events: auto;
    `;
    document.body.appendChild(this.overlay);

    this.loadPracticeScores();
  }

  show(courseIndex: number) {
    this.selectedCourse = courseIndex;
    this.visible = true;
    this.redraw();
    this.overlay.style.display = "block";
  }

  hide() {
    this.visible = false;
    this.overlay.style.display = "none";
  }

  isVisible(): boolean {
    return this.visible;
  }

  isPracticeActive(): boolean {
    return this.practiceActive;
  }

  endPractice() {
    this.practiceActive = false;
  }

  private redraw() {
    const courseManager = this.game.courseManager;
    const course = courseManager.getCourse(this.selectedCourse);
    const themeColors = ["#00ffff", "#ff44aa", "#ff6600"];
    const color = themeColors[this.selectedCourse] || themeColors[0];

    let html = `
      <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-size: 20px; color: ${color}; letter-spacing: 3px;">PRACTICE MODE</div>
        <div style="font-size: 13px; color: #4488aa;">${course.name}</div>
        <div style="font-size: 10px; color: #334455; margin-top: 4px;">SELECT A HOLE TO PRACTICE</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
    `;

    for (let i = 0; i < course.holes.length; i++) {
      const hole = course.holes[i];
      const key = `practice_${this.selectedCourse}_${i}`;
      const best = this.bestPracticeScores.get(key);
      const bestText = best ? `Best: ${best}` : "—";

      html += `
        <div id="practice-hole-${i}" style="
          padding: 12px; text-align: center;
          border: 1px solid ${color}40;
          background: rgba(0, 15, 30, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <div style="font-size: 18px; color: ${color}; font-weight: bold;">${i + 1}</div>
          <div style="font-size: 10px; color: #6688aa; margin-top: 4px;">${hole.name}</div>
          <div style="font-size: 10px; color: #445566; margin-top: 2px;">Par ${hole.par}</div>
          <div style="font-size: 9px; color: #334455; margin-top: 2px;">${bestText}</div>
        </div>
      `;
    }

    html += `
      </div>
      <div style="text-align: center; margin-top: 15px;">
        <button id="practice-close" style="
          background: transparent; border: 1px solid #445566;
          color: #6688aa; font-family: 'Courier New', monospace;
          font-size: 14px; padding: 8px 24px; cursor: pointer;
          letter-spacing: 2px;
        ">← BACK</button>
      </div>
    `;

    this.overlay.innerHTML = html;

    for (let i = 0; i < course.holes.length; i++) {
      this.overlay.querySelector(`#practice-hole-${i}`)?.addEventListener("click", () => {
        this.audio.playMenuSelect();
        this.startPractice(i);
      });
    }

    this.overlay.querySelector("#practice-close")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.hide();
    });
  }

  private startPractice(holeIndex: number) {
    this.practiceActive = true;
    this.hide();

    // Use game manager's startCourse, then load specific hole
    this.game.startPracticeHole(this.selectedCourse, holeIndex);
  }

  recordPracticeScore(courseIndex: number, holeIndex: number, strokes: number) {
    const key = `practice_${courseIndex}_${holeIndex}`;
    const best = this.bestPracticeScores.get(key);
    if (!best || strokes < best) {
      this.bestPracticeScores.set(key, strokes);
      this.savePracticeScores();
    }
  }

  private loadPracticeScores() {
    try {
      const data = localStorage.getItem("holo-golf-practice");
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([k, v]) => this.bestPracticeScores.set(k, v as number));
      }
    } catch {}
  }

  private savePracticeScores() {
    try {
      const obj: Record<string, number> = {};
      this.bestPracticeScores.forEach((v, k) => (obj[k] = v));
      localStorage.setItem("holo-golf-practice", JSON.stringify(obj));
    } catch {}
  }
}
