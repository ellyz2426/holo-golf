/**
 * Holo Golf VR — Leaderboard System
 * Tracks personal best scores per course with timestamps.
 * Provides a sortable leaderboard display overlay.
 */

export interface LeaderboardEntry {
  courseName: string;
  courseIndex: number;
  totalStrokes: number;
  totalPar: number;
  diff: number;
  holeInOnes: number;
  timestamp: number;
  dateStr: string;
}

const STORAGE_KEY = "holo-golf-leaderboard";
const MAX_ENTRIES_PER_COURSE = 10;

export class LeaderboardManager {
  private entries: LeaderboardEntry[] = [];
  private overlay: HTMLDivElement;
  private visible = false;

  constructor() {
    this.load();

    this.overlay = document.createElement("div");
    this.overlay.id = "leaderboard-overlay";
    this.overlay.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 560px; max-width: 94vw; max-height: 85vh;
      padding: 25px; overflow-y: auto;
      background: rgba(0, 8, 20, 0.96);
      border: 2px solid #ffaa00;
      font-family: 'Courier New', monospace;
      color: #ffffff;
      z-index: 260;
      display: none;
      pointer-events: auto;
    `;
    document.body.appendChild(this.overlay);
  }

  recordScore(
    courseIndex: number,
    courseName: string,
    totalStrokes: number,
    totalPar: number,
    holeInOnes: number,
  ): { isNewBest: boolean; rank: number } {
    const now = Date.now();
    const date = new Date(now);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    const entry: LeaderboardEntry = {
      courseName,
      courseIndex,
      totalStrokes,
      totalPar,
      diff: totalStrokes - totalPar,
      holeInOnes,
      timestamp: now,
      dateStr,
    };

    this.entries.push(entry);

    // Sort entries for this course by score (ascending), then by date (most recent first)
    const courseEntries = this.entries
      .filter((e) => e.courseIndex === courseIndex)
      .sort((a, b) => a.totalStrokes - b.totalStrokes || b.timestamp - a.timestamp);

    // Keep only top N per course
    if (courseEntries.length > MAX_ENTRIES_PER_COURSE) {
      const toRemove = courseEntries.slice(MAX_ENTRIES_PER_COURSE);
      this.entries = this.entries.filter((e) => !toRemove.includes(e));
    }

    this.save();

    const rank = courseEntries.findIndex((e) => e.timestamp === now) + 1;
    const isNewBest = rank === 1;

    return { isNewBest, rank };
  }

  getTopScore(courseIndex: number): LeaderboardEntry | null {
    const courseEntries = this.entries
      .filter((e) => e.courseIndex === courseIndex)
      .sort((a, b) => a.totalStrokes - b.totalStrokes);
    return courseEntries[0] || null;
  }

  getCourseEntries(courseIndex: number): LeaderboardEntry[] {
    return this.entries
      .filter((e) => e.courseIndex === courseIndex)
      .sort((a, b) => a.totalStrokes - b.totalStrokes || b.timestamp - a.timestamp);
  }

  show(courseIndex?: number) {
    this.visible = true;
    this.redraw(courseIndex);
    this.overlay.style.display = "block";
  }

  hide() {
    this.visible = false;
    this.overlay.style.display = "none";
  }

  isVisible(): boolean {
    return this.visible;
  }

  private redraw(filterCourse?: number) {
    const themeColors = ["#00ffff", "#ff44aa", "#ff6600"];
    const courseNames = ["Neon Circuit", "Quantum Field", "Cosmic Abyss"];
    const borderColor =
      filterCourse !== undefined ? themeColors[filterCourse] || "#ffaa00" : "#ffaa00";
    this.overlay.style.borderColor = borderColor;

    let html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 24px; color: #ffaa00; letter-spacing: 4px;
          text-shadow: 0 0 15px #ff8800;">🏆 LEADERBOARD</div>
        <div style="font-size: 11px; color: #445566; margin-top: 5px; letter-spacing: 2px;">
          PERSONAL BEST SCORES
        </div>
      </div>
    `;

    const coursesToShow =
      filterCourse !== undefined ? [filterCourse] : [0, 1, 2];

    for (const ci of coursesToShow) {
      const entries = this.getCourseEntries(ci);
      const color = themeColors[ci] || "#00ffff";

      html += `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 16px; color: ${color}; letter-spacing: 2px; margin-bottom: 8px;
            border-bottom: 1px solid ${color}40; padding-bottom: 4px;">
            ${courseNames[ci] || `Course ${ci + 1}`}
          </div>
      `;

      if (entries.length === 0) {
        html += `<div style="font-size: 12px; color: #334455; padding: 8px 0;">No scores recorded yet</div>`;
      } else {
        html += `
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr style="color: #445566;">
              <th style="padding: 3px 6px; text-align: left;">#</th>
              <th style="padding: 3px 6px; text-align: center;">SCORE</th>
              <th style="padding: 3px 6px; text-align: center;">vs PAR</th>
              <th style="padding: 3px 6px; text-align: center;">ACES</th>
              <th style="padding: 3px 6px; text-align: right;">DATE</th>
            </tr>
        `;

        for (let i = 0; i < entries.length; i++) {
          const e = entries[i];
          const medal =
            i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
          const diffColor =
            e.diff < 0 ? "#00ff88" : e.diff === 0 ? "#ffffff" : "#ff6644";
          const diffText =
            e.diff === 0
              ? "Even"
              : e.diff < 0
                ? `${e.diff}`
                : `+${e.diff}`;
          const rowBg =
            i === 0
              ? "rgba(255, 170, 0, 0.08)"
              : i % 2 === 0
                ? "transparent"
                : "rgba(0, 20, 40, 0.3)";

          html += `
            <tr style="background: ${rowBg};">
              <td style="padding: 4px 6px;">${medal}</td>
              <td style="padding: 4px 6px; text-align: center; font-weight: bold; color: #ffffff;">
                ${e.totalStrokes}
              </td>
              <td style="padding: 4px 6px; text-align: center; color: ${diffColor}; font-weight: bold;">
                ${diffText}
              </td>
              <td style="padding: 4px 6px; text-align: center; color: ${e.holeInOnes > 0 ? "#ffff00" : "#334455"};">
                ${e.holeInOnes > 0 ? `⭐${e.holeInOnes}` : "-"}
              </td>
              <td style="padding: 4px 6px; text-align: right; color: #445566; font-size: 10px;">
                ${e.dateStr}
              </td>
            </tr>
          `;
        }

        html += `</table>`;
      }

      html += `</div>`;
    }

    html += `
      <div style="text-align: center; margin-top: 10px;">
        <button id="lb-close" style="
          background: transparent; border: 1px solid #445566;
          color: #6688aa; font-family: 'Courier New', monospace;
          font-size: 13px; padding: 8px 28px; cursor: pointer;
          letter-spacing: 2px;
        ">CLOSE</button>
      </div>
    `;

    this.overlay.innerHTML = html;
    this.overlay.querySelector("#lb-close")?.addEventListener("click", () => this.hide());
  }

  private load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.entries = JSON.parse(data);
      }
    } catch {
      this.entries = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {}
  }
}
