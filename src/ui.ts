/**
 * Holo Golf VR — UI Manager
 * Title screen, course select, settings, and game-over overlays.
 * Uses HTML overlay for menus.
 */
import { World } from "@iwsdk/core";
import { GameManager, GameState } from "./game";
import { AudioManager } from "./audio";

export class UIManager {
  private world: World;
  private game: GameManager;
  private audio: AudioManager;
  private overlay: HTMLDivElement;
  private currentScreen: string = "";

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
            <button id="btn-play" style="${this.buttonStyle()}">
              ▶ PLAY
            </button>
          </div>
          <div style="margin-top: 15px;">
            <button id="btn-settings" style="${this.buttonStyle('#ff4488', '#cc2266')}">
              ⚙ SETTINGS
            </button>
          </div>
          <div style="
            margin-top: 50px; color: #334455; font-size: 12px; letter-spacing: 2px;
          ">
            MOUSE: CLICK & DRAG TO AIM AND PUTT<br>
            VR: SWING CONTROLLER TO HIT BALL
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
  }

  showCourseSelect() {
    this.currentScreen = "course_select";
    const courseCount = 2; // We have 2 courses (1 playable + 1 coming soon)

    this.overlay.innerHTML = `
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%; pointer-events: auto;
        background: radial-gradient(ellipse at center, rgba(0,20,40,0.85) 0%, rgba(0,0,0,0.95) 100%);
      ">
        <h2 style="color: #00ffff; font-size: 36px; letter-spacing: 4px; margin-bottom: 30px;
          text-shadow: 0 0 15px #00ffff;">SELECT COURSE</h2>

        <div style="display: flex; gap: 30px;">
          <div id="course-0" class="course-card" style="${this.courseCardStyle(true)}">
            <div style="font-size: 40px; margin-bottom: 10px;">🟢</div>
            <div style="font-size: 22px; color: #00ffff; font-weight: bold;">Neon Circuit</div>
            <div style="font-size: 13px; color: #6688aa; margin-top: 8px;">9 Holes • Easy-Medium</div>
            <div style="font-size: 12px; color: #445566; margin-top: 5px;">
              ${this.getBestScoreText(0)}
            </div>
          </div>

          <div style="${this.courseCardStyle(false)}">
            <div style="font-size: 40px; margin-bottom: 10px;">🔒</div>
            <div style="font-size: 22px; color: #445566; font-weight: bold;">Quantum Field</div>
            <div style="font-size: 13px; color: #334455; margin-top: 8px;">Coming Soon</div>
          </div>
        </div>

        <button id="btn-back" style="${this.buttonStyle('#445566', '#334455')}; margin-top: 30px;">
          ← BACK
        </button>
      </div>
    `;

    this.overlay.querySelector("#course-0")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.hideUI();
      this.game.startCourse(0);
    });

    this.overlay.querySelector("#btn-back")?.addEventListener("click", () => {
      this.audio.playMenuSelect();
      this.showTitle();
    });
  }

  showSettings() {
    this.currentScreen = "settings";
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

        <button id="btn-back" style="${this.buttonStyle('#445566', '#334455')}; margin-top: 20px;">
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
    const score = this.game.courseScore;
    const totalPar = score.holes.reduce((s, h) => s + h.par, 0);
    const diff = score.totalStrokes - totalPar;
    const holeInOnes = score.holes.filter((h) => h.holeInOne).length;

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

        <div style="margin-top: 30px; display: flex; gap: 15px;">
          <button id="btn-replay" style="${this.buttonStyle()}">
            🔄 REPLAY
          </button>
          <button id="btn-menu" style="${this.buttonStyle('#ff4488', '#cc2266')}">
            🏠 MENU
          </button>
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
  }

  handleSelect() {
    // For XR controller A button press
    if (this.currentScreen === "title") {
      this.showCourseSelect();
    } else if (this.currentScreen === "course_select") {
      this.hideUI();
      this.game.startCourse(0);
    } else if (this.currentScreen === "complete") {
      this.hideUI();
      this.game.startCourse(this.game.currentCourseIndex);
    }
    this.audio.playMenuSelect();
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

  private courseCardStyle(playable: boolean): string {
    return `
      width: 220px; padding: 25px; text-align: center;
      border: 2px solid ${playable ? "#00ffff" : "#223344"};
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
