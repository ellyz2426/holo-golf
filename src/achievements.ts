/**
 * Holo Golf VR — Achievements
 * Track and display achievements: hole-in-one, under par, course completion, etc.
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first_putt", name: "First Swing", description: "Complete your first putt", icon: "🏌️" },
  { id: "hole_in_one", name: "Ace!", description: "Score a hole-in-one", icon: "⭐" },
  { id: "under_par", name: "Below Par", description: "Complete a hole under par", icon: "🎯" },
  { id: "birdie", name: "Birdie", description: "Score exactly one under par", icon: "🐦" },
  { id: "eagle", name: "Eagle", description: "Score exactly two under par", icon: "🦅" },
  { id: "course_clear", name: "Course Champion", description: "Complete Neon Circuit", icon: "🏆" },
  { id: "par_course", name: "Par for the Course", description: "Finish a course at or under par", icon: "✨" },
  { id: "no_bogey", name: "Clean Sheet", description: "Complete a course with no bogeys", icon: "💎" },
  { id: "three_aces", name: "Triple Ace", description: "Score 3 hole-in-ones in one course", icon: "🌟" },
  { id: "speed_round", name: "Speed Golfer", description: "Complete a course in under 20 total strokes", icon: "⚡" },
  { id: "persistence", name: "Never Give Up", description: "Complete a hole in 10+ strokes", icon: "💪" },
  { id: "five_rounds", name: "Regular", description: "Complete 5 rounds", icon: "🔁" },
];

export class AchievementTracker {
  private achievements: Achievement[];
  private popupQueue: Achievement[] = [];
  private currentPopup: Achievement | null = null;
  private popupTimer = 0;
  private overlay: HTMLDivElement;
  private totalRounds = 0;

  constructor() {
    this.achievements = ACHIEVEMENT_DEFS.map((def) => ({
      ...def,
      unlocked: false,
    }));
    this.loadState();

    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      padding: 15px 25px; background: rgba(0, 15, 30, 0.9);
      border: 2px solid #ffaa00; border-radius: 4px;
      font-family: 'Courier New', monospace; z-index: 300;
      display: none; text-align: center; min-width: 250px;
      box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
    `;
    document.body.appendChild(this.overlay);
  }

  // Check conditions after each hole
  checkHole(strokes: number, par: number) {
    if (strokes >= 1) this.unlock("first_putt");
    if (strokes === 1) this.unlock("hole_in_one");
    if (strokes < par) this.unlock("under_par");
    if (strokes === par - 1) this.unlock("birdie");
    if (strokes === par - 2) this.unlock("eagle");
    if (strokes >= 10) this.unlock("persistence");
  }

  // Check conditions after course completion
  checkCourse(totalStrokes: number, totalPar: number, holeScores: Array<{ strokes: number; par: number; holeInOne: boolean }>) {
    this.unlock("course_clear");

    if (totalStrokes <= totalPar) this.unlock("par_course");
    if (totalStrokes < 20) this.unlock("speed_round");

    const allUnderOrPar = holeScores.every((h) => h.strokes <= h.par);
    if (allUnderOrPar) this.unlock("no_bogey");

    const aces = holeScores.filter((h) => h.holeInOne).length;
    if (aces >= 3) this.unlock("three_aces");

    this.totalRounds++;
    if (this.totalRounds >= 5) this.unlock("five_rounds");

    this.saveState();
  }

  private unlock(id: string) {
    const a = this.achievements.find((a) => a.id === id);
    if (!a || a.unlocked) return;

    a.unlocked = true;
    a.unlockedAt = Date.now();
    this.popupQueue.push(a);
    this.saveState();
  }

  getAll(): Achievement[] {
    return this.achievements;
  }

  getUnlocked(): Achievement[] {
    return this.achievements.filter((a) => a.unlocked);
  }

  update(dt: number) {
    if (this.currentPopup) {
      this.popupTimer -= dt;
      if (this.popupTimer <= 0) {
        this.overlay.style.display = "none";
        this.currentPopup = null;
      }
    }

    if (!this.currentPopup && this.popupQueue.length > 0) {
      this.showPopup(this.popupQueue.shift()!);
    }
  }

  private showPopup(a: Achievement) {
    this.currentPopup = a;
    this.popupTimer = 3.0;

    this.overlay.innerHTML = `
      <div style="font-size: 11px; color: #ffaa00; letter-spacing: 3px; margin-bottom: 5px;">
        🏅 ACHIEVEMENT UNLOCKED
      </div>
      <div style="font-size: 28px; margin: 5px 0;">${a.icon}</div>
      <div style="font-size: 16px; color: #ffffff; font-weight: bold;">${a.name}</div>
      <div style="font-size: 11px; color: #6688aa; margin-top: 3px;">${a.description}</div>
    `;
    this.overlay.style.display = "block";
  }

  private saveState() {
    try {
      const state = {
        unlocked: this.achievements.filter((a) => a.unlocked).map((a) => a.id),
        totalRounds: this.totalRounds,
      };
      localStorage.setItem("holo-golf-achievements", JSON.stringify(state));
    } catch {}
  }

  private loadState() {
    try {
      const data = localStorage.getItem("holo-golf-achievements");
      if (!data) return;
      const state = JSON.parse(data);
      if (state.unlocked) {
        for (const id of state.unlocked) {
          const a = this.achievements.find((a) => a.id === id);
          if (a) a.unlocked = true;
        }
      }
      if (state.totalRounds) this.totalRounds = state.totalRounds;
    } catch {}
  }
}
