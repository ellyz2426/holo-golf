/**
 * Holo Golf VR — UI Manager (Round 3 Overhaul)
 * Title screen, course select, settings, and game-over overlays.
 * Full XR controller navigation: handleNavNext/Prev for thumbstick, handleBack for B.
 * Course-specific color theming.
 */
import { World } from "@iwsdk/core";
import { GameManager, GameState } from "./game";
import { AudioManager } from "./audio";
import { PracticeMode } from "./practice";

// Course color themes
const COURSE_THEMES = [
  { primary: "#00ffff", secondary: "#0088aa", accent: "#44ff88", name: "Neon Circuit", emoji: "🟢" },
  { primary: "#ff44aa", secondary: "#cc2266", accent: "#8844ff", name: "Quantum Field", emoji: "🟣" },
  { primary: "#ff6600", secondary: "#cc4400", accent: "#ffaa00", name: "Cosmic Abyss", emoji: "🔴" },
];

export class UIManager {
  private world: World;
  private game: GameManager;
  private audio: AudioManager;
  private overlay: HTMLDivElement;
  currentScreen: string = "";

  // XR navigation state
  private focusIndex = 0;
  private focusableCount = 0;
  private focusableIds: string[] = [];

  // Practice mode
  practiceMode: PracticeMode | null = null;

  constructor(world: World, game: GameManager, audio: AudioManager) {
    this.world = world;
    this.game = game;
    this.audio = audio;

    this.overlay = document.createElement("div");
    this.overlay.id = "holo-golf-ui";
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 100; font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.overlay);

    game.onStateChange((state) => {
      if (state === GameState.COURSE_COMPLETE) {
        this.showCourseComplete();
      }
    });
  }

  showTitle() {
    this.currentScreen = "title";
    this.focusableIds = ["btn-play", "btn-settings"];
    this.focusIndex = 0;
    this.focusableCount = 2;

    this.overlay.innerHTML = `
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%; pointer-events: auto;
        background: radial-gradient(ellipse at center, rgba(0,20,40,0.9) 0%, rgba(0,0,0,0.95) 100%);
      ">
        <div style="text-align: center;">
          <h1 style="
            font-size: 72px; color: #00ffff; margin: 0; letter-spacing: 8px;
            text-shadow: 0 0 20px #00ffff, 0 0 40px #0088aa, 0 0 80px #004466;
          ">HOLO GOLF</h1>
          <div style="
            font-size: 18px; color: #4488aa; margin-top: 8px; letter-spacing: 6px;
          ">VIRTUAL REALITY MINI GOLF</div>
          <div style="
            width: 300px; height: 2px; margin: 24px auto;
            background: linear-gradient(90deg, transparent, #00ffff, transparent);
          "></div>
          <div style="margin-top: 40px;">
            <button id="btn-play" style="${this.buttonStyle()}" data-focus="0">
              ▶ PLAY
            </button>
          </div>
          <div style="margin-top: 15px;">
            <button id="btn-settings" style="${this.buttonStyle('#ff4488', '#cc2266')}" data-focus="1">
              ⚙ SETTINGS
            </button>
          </div>
          <div style="
            margin-top: 50px; color: #334455; font-size: 12px; letter-spacing: 2px;
          ">
            MOUSE: CLICK & DRAG TO AIM AND PUTT<br>
            VR: SWING CONTROLLER OR PRESS TRIGGER<br>
            <span style="color: #224455; font-size: 11px;">GRIP = POWER BOOST · LEFT STICK = CAMERA</span>
          </div>
        </div>
      </div>
    `;

    this.overlay.querySelector("#btn-play")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.showCourseSelect();
    });

    this.overlay.querySelector("#btn-settings")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.showSettings();
    });

    this.updateFocusHighlight();
  }

  showCourseSelect() {
    this.currentScreen = "course_select";
    this.focusableIds = ["course-0", "course-1", "course-2", "btn-back"];
    this.focusIndex = 0;
    this.focusableCount = 4;

    this.overlay.innerHTML = `
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%; pointer-events: auto;
        background: radial-gradient(ellipse at center, rgba(0,20,40,0.85) 0%, rgba(0,0,0,0.95) 100%);
      ">
        <h2 style="color: #00ffff; font-size: 36px; letter-spacing: 4px; margin-bottom: 30px;
          text-shadow: 0 0 15px #00ffff;">SELECT COURSE</h2>

        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
          ${COURSE_THEMES.map((theme, i) => `
            <div id="course-${i}" class="course-card" style="${this.courseCardStyle(true, i === this.focusIndex)}" data-focus="${i}">
              <div style="font-size: 40px; margin-bottom: 10px;">${theme.emoji}</div>
              <div style="font-size: 20px; color: ${theme.primary}; font-weight: bold;">${theme.name}</div>
              <div style="font-size: 12px; color: #6688aa; margin-top: 6px;">9 Holes • ${i === 0 ? 'Easy-Medium' : i === 1 ? 'Medium-Hard' : 'Expert'}</div>
              ${i === 2 ? '<div style="font-size: 11px; color: #ff6644; margin-top: 4px;">🌀 Teleporters • 💨 Wind • ❄️ Ice</div>' : ''}
              <div style="font-size: 11px; color: #445566; margin-top: 4px;">
                ${this.getBestScoreText(i)}
              </div>
              <div id="practice-btn-${i}" style="font-size: 10px; color: #44ff88; margin-top: 8px; cursor: pointer; letter-spacing: 1px;">
                🏋 PRACTICE
              </div>
            </div>
          `).join('')}
        </div>

        <button id="btn-back" style="${this.buttonStyle('#445566', '#334455')}; margin-top: 30px;" data-focus="3">
          ← BACK
        </button>

        <div style="margin-top: 20px; color: #223344; font-size: 11px; letter-spacing: 1px;">
          VR: THUMBSTICK ◄► TO BROWSE · TRIGGER TO SELECT · B TO GO BACK
        </div>
      </div>
    `;

    for (let i = 0; i < 3; i++) {
      this.overlay.querySelector(`#course-${i}`)?.addEventListener("click", (e) => {
        // Ignore if clicking the practice button
        if ((e.target as HTMLElement).id?.startsWith("practice-btn")) return;
        this.audio.playMenuSelect();
        this.hideUI();
        this.game.startCourse(i);
      });
      this.overlay.querySelector(`#practice-btn-${i}`)?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audio.playMenuSelect();
        if (this.practiceMode) {
          this.practiceMode.show(i);
        }
      });
    }

    this.overlay.querySelector("#btn-back")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.showTitle();
    });

    this.updateFocusHighlight();
  }

  showSettings() {
    this.currentScreen = "settings";
    this.focusableIds = ["btn-back"];
    this.focusIndex = 0;
    this.focusableCount = 1;

    this.overlay.innerHTML = `
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%; pointer-events: auto;
        background: radial-gradient(ellipse at center, rgba(0,20,40,0.85) 0%, rgba(0,0,0,0.95) 100%);
      ">
        <h2 style="color: #00ffff; font-size: 36px; letter-spacing: 4px; margin-bottom: 30px;
          text-shadow: 0 0 15px #00ffff;">SETTINGS</h2>

        <div style="width: 350px;">
          <div style="margin-bottom: 20px;">
            <label style="color: #6688aa; font-size: 14px;">MASTER VOLUME</label>
            <input id="vol-master" type="range" min="0" max="100" value="50"
              style="${this.sliderStyle()}">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="color: #6688aa; font-size: 14px;">MUSIC</label>
            <input id="vol-music" type="range" min="0" max="100" value="15"
              style="${this.sliderStyle()}">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="color: #6688aa; font-size: 14px;">SFX</label>
            <input id="vol-sfx" type="range" min="0" max="100" value="70"
              style="${this.sliderStyle()}">
          </div>
        </div>

        <button id="btn-back" style="${this.buttonStyle('#445566', '#334455')}; margin-top: 20px;" data-focus="0">
          ← BACK
        </button>
      </div>
    `;

    this.overlay.querySelector("#vol-master")?.addEventListener("input", (e) => {
      this.audio.setMasterVolume(parseInt((e.target as HTMLInputElement).value) / 100);
    });
    this.overlay.querySelector("#vol-music")?.addEventListener("input", (e) => {
      this.audio.setMusicVolume(parseInt((e.target as HTMLInputElement).value) / 100);
    });
    this.overlay.querySelector("#vol-sfx")?.addEventListener("input", (e) => {
      this.audio.setSFXVolume(parseInt((e.target as HTMLInputElement).value) / 100);
    });
    this.overlay.querySelector("#btn-back")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.showTitle();
    });
  }

  showCourseComplete() {
    this.currentScreen = "complete";
    this.focusableIds = ["btn-replay", "btn-menu"];
    this.focusIndex = 0;
    this.focusableCount = 2;

    const score = this.game.courseScore;
    const totalPar = score.holes.reduce((s, h) => s + h.par, 0);
    const diff = score.totalStrokes - totalPar;
    const holeInOnes = score.holes.filter((h) => h.holeInOne).length;
    const theme = COURSE_THEMES[this.game.currentCourseIndex] || COURSE_THEMES[0];

    this.overlay.innerHTML = `
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%; pointer-events: auto;
        background: radial-gradient(ellipse at center, rgba(0,20,40,0.9) 0%, rgba(0,0,0,0.95) 100%);
      ">
        <h2 style="color: #ffff00; font-size: 42px; letter-spacing: 4px;
          text-shadow: 0 0 20px #ffff00, 0 0 40px #ff8800;">
          🏆 COURSE COMPLETE!
        </h2>

        <div style="margin-top: 10px; font-size: 14px; color: ${theme.primary}; letter-spacing: 3px;">
          ${theme.name.toUpperCase()}
        </div>

        <div style="margin-top: 20px; text-align: center;">
          <div style="font-size: 52px; color: #ffffff; font-weight: bold;">
            ${score.totalStrokes}
          </div>
          <div style="font-size: 16px; color: #6688aa; margin-top: 5px;">TOTAL STROKES</div>
          <div style="font-size: 24px; color: ${diff <= 0 ? '#00ff88' : '#ff8844'}; margin-top: 10px;">
            ${diff === 0 ? 'Even Par' : diff < 0 ? `${diff} Under Par` : `+${diff} Over Par`}
          </div>
          ${holeInOnes > 0 ? `
            <div style="font-size: 20px; color: #ffff00; margin-top: 10px;">
              ⭐ ${holeInOnes} Hole-in-One${holeInOnes > 1 ? 's' : ''}!
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 15px; padding: 12px 20px; border: 1px solid #223344; background: rgba(0,10,20,0.6); font-size: 12px; color: #6688aa;">
          ${this.buildMiniResultTable(score)}
        </div>

        <div style="margin-top: 30px; display: flex; gap: 15px;">
          <button id="btn-replay" style="${this.buttonStyle(theme.primary, theme.secondary)}" data-focus="0">
            🔄 REPLAY
          </button>
          <button id="btn-menu" style="${this.buttonStyle('#ff4488', '#cc2266')}" data-focus="1">
            🏠 MENU
          </button>
        </div>

        <div style="margin-top: 15px; color: #223344; font-size: 11px;">
          VR: TRIGGER TO SELECT · THUMBSTICK ◄► TO BROWSE
        </div>
      </div>
    `;

    this.overlay.querySelector("#btn-replay")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.hideUI();
      this.game.startCourse(this.game.currentCourseIndex);
    });

    this.overlay.querySelector("#btn-menu")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.showTitle();
    });

    this.updateFocusHighlight();
  }

  // === XR Controller Navigation ===

  handleSelect() {
    if (this.currentScreen === "title") {
      if (this.focusIndex === 0) {
        this.showCourseSelect();
      } else {
        this.showSettings();
      }
    } else if (this.currentScreen === "course_select") {
      if (this.focusIndex < 3) {
        this.hideUI();
        this.game.startCourse(this.focusIndex);
      } else {
        this.showTitle();
      }
    } else if (this.currentScreen === "settings") {
      this.showTitle();
    } else if (this.currentScreen === "complete") {
      if (this.focusIndex === 0) {
        this.hideUI();
        this.game.startCourse(this.game.currentCourseIndex);
      } else {
        this.showTitle();
      }
    }
    this.audio.playMenuSelect();
  }

  handleBack() {
    if (this.currentScreen === "course_select" || this.currentScreen === "settings") {
      this.audio.playMenuSelect();
      this.showTitle();
    } else if (this.currentScreen === "complete") {
      this.audio.playMenuSelect();
      this.showTitle();
    }
  }

  handleNavNext() {
    if (this.focusableCount === 0) return;
    this.focusIndex = (this.focusIndex + 1) % this.focusableCount;
    this.audio.playMenuHover();
    this.updateFocusHighlight();
  }

  handleNavPrev() {
    if (this.focusableCount === 0) return;
    this.focusIndex = (this.focusIndex - 1 + this.focusableCount) % this.focusableCount;
    this.audio.playMenuHover();
    this.updateFocusHighlight();
  }

  private updateFocusHighlight() {
    // Remove existing focus highlights
    this.overlay.querySelectorAll("[data-focus]").forEach((el) => {
      (el as HTMLElement).style.outline = "none";
      (el as HTMLElement).style.boxShadow = "none";
    });

    // Add focus to current
    const focusId = this.focusableIds[this.focusIndex];
    if (focusId) {
      const el = this.overlay.querySelector(`#${focusId}`) as HTMLElement;
      if (el) {
        el.style.outline = "2px solid #00ffff";
        el.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.4)";
      }
    }
  }

  hideUI() {
    this.currentScreen = "";
    this.overlay.innerHTML = "";
  }

  isVisible(): boolean {
    return this.currentScreen !== "";
  }

  update(dt: number) {
    // Nothing continuous needed for HTML overlay
  }

  private buildMiniResultTable(score: any): string {
    let html = '<table style="border-collapse: collapse; font-size: 11px; width: 100%;">';
    html += '<tr style="color: #445566;">';
    for (let i = 0; i < score.holes.length; i++) {
      html += `<td style="padding: 2px 6px; text-align: center;">${i + 1}</td>`;
    }
    html += '</tr><tr>';
    for (let i = 0; i < score.holes.length; i++) {
      const h = score.holes[i];
      const diff = h.strokes - h.par;
      const color = h.strokes === 1 ? '#ffff00' : diff < 0 ? '#00ff88' : diff === 0 ? '#ffffff' : '#ff6644';
      html += `<td style="padding: 2px 6px; text-align: center; color: ${color}; font-weight: bold;">${h.strokes || '-'}</td>`;
    }
    html += '</tr></table>';
    return html;
  }

  private getBestScoreText(courseIndex: number): string {
    const best = this.game.bestScores.get(`course_${courseIndex}`);
    return best ? `Best: ${best}` : "No record yet";
  }

  private buttonStyle(color = "#00ffff", hoverColor = "#0088aa"): string {
    return `
      background: transparent;
      border: 2px solid ${color};
      color: ${color};
      font-family: 'Courier New', monospace;
      font-size: 18px;
      padding: 12px 32px;
      cursor: pointer;
      letter-spacing: 3px;
      transition: all 0.2s ease;
      text-shadow: 0 0 10px ${color};
    `;
  }

  private courseCardStyle(playable: boolean, focused = false): string {
    return `
      width: 220px; padding: 25px; text-align: center;
      border: 2px solid ${playable ? (focused ? "#ffffff" : "#00ffff") : "#223344"};
      background: rgba(0, 15, 30, 0.8);
      cursor: ${playable ? "pointer" : "default"};
      transition: all 0.2s ease;
      ${playable ? "pointer-events: auto;" : "pointer-events: none; opacity: 0.5;"}
    `;
  }

  private sliderStyle(): string {
    return `
      width: 100%; margin-top: 5px; cursor: pointer;
      accent-color: #00ffff;
    `;
  }
}
