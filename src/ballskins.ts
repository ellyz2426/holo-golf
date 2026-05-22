/**
 * Holo Golf VR — Ball Skins System (Round 6)
 * Unlockable ball appearances earned through gameplay achievements.
 * Each skin modifies ball color, glow, trail effect, and emissive properties.
 */

export interface BallSkin {
  id: string;
  name: string;
  icon: string;
  description: string;
  ballColor: number;
  emissiveColor: number;
  glowColor: number;
  trailColor1: number;
  trailColor2: number;
  unlockCondition: string;
  /** Check function — receives current achievement/stats state */
  isUnlocked: (stats: SkinUnlockState) => boolean;
}

export interface SkinUnlockState {
  totalRounds: number;
  totalHoleInOnes: number;
  coursesCompleted: number[];
  bestStreaks: number;
  underParHoles: number;
  achievementIds: string[];
}

const SKINS: BallSkin[] = [
  {
    id: "default",
    name: "Cyan Standard",
    icon: "🔵",
    description: "The classic holo ball",
    ballColor: 0x00ffff,
    emissiveColor: 0x00aaaa,
    glowColor: 0x00ffff,
    trailColor1: 0x00ffff,
    trailColor2: 0xff4488,
    unlockCondition: "Always available",
    isUnlocked: () => true,
  },
  {
    id: "solar",
    name: "Solar Flare",
    icon: "☀️",
    description: "Complete any course",
    ballColor: 0xff8800,
    emissiveColor: 0xff4400,
    glowColor: 0xffaa00,
    trailColor1: 0xff6600,
    trailColor2: 0xffcc00,
    unlockCondition: "Complete any course",
    isUnlocked: (s) => s.coursesCompleted.length > 0,
  },
  {
    id: "amethyst",
    name: "Amethyst Pulse",
    icon: "💜",
    description: "Score 3 hole-in-ones total",
    ballColor: 0xaa44ff,
    emissiveColor: 0x8822cc,
    glowColor: 0xcc66ff,
    trailColor1: 0xaa44ff,
    trailColor2: 0xff44aa,
    unlockCondition: "Score 3 hole-in-ones",
    isUnlocked: (s) => s.totalHoleInOnes >= 3,
  },
  {
    id: "emerald",
    name: "Emerald Wisp",
    icon: "💚",
    description: "Complete 5 rounds",
    ballColor: 0x00ff66,
    emissiveColor: 0x00aa44,
    glowColor: 0x44ff88,
    trailColor1: 0x00ff44,
    trailColor2: 0x88ffaa,
    unlockCondition: "Complete 5 rounds",
    isUnlocked: (s) => s.totalRounds >= 5,
  },
  {
    id: "ruby",
    name: "Ruby Blaze",
    icon: "❤️",
    description: "Complete all 3 courses",
    ballColor: 0xff2244,
    emissiveColor: 0xcc0022,
    glowColor: 0xff4466,
    trailColor1: 0xff2244,
    trailColor2: 0xff8844,
    unlockCondition: "Complete all 3 courses",
    isUnlocked: (s) => s.coursesCompleted.length >= 3,
  },
  {
    id: "gold",
    name: "Golden Champion",
    icon: "🏆",
    description: "Finish a course under par",
    ballColor: 0xffd700,
    emissiveColor: 0xcc9900,
    glowColor: 0xffee44,
    trailColor1: 0xffd700,
    trailColor2: 0xffffff,
    unlockCondition: "Finish a course under par",
    isUnlocked: (s) => s.achievementIds.includes("par_course"),
  },
  {
    id: "prismatic",
    name: "Prismatic",
    icon: "🌈",
    description: "Get a 5+ hole streak",
    ballColor: 0xffffff,
    emissiveColor: 0x888888,
    glowColor: 0xffffff,
    trailColor1: 0xff0000,
    trailColor2: 0x0000ff,
    unlockCondition: "Get a 5+ under-par streak",
    isUnlocked: (s) => s.bestStreaks >= 5,
  },
];

const STORAGE_KEY = "holo-golf-skins";

export class BallSkinManager {
  private activeSkinId = "default";
  private stats: SkinUnlockState = {
    totalRounds: 0,
    totalHoleInOnes: 0,
    coursesCompleted: [],
    bestStreaks: 0,
    underParHoles: 0,
    achievementIds: [],
  };

  constructor() {
    this.loadState();
  }

  /** Update stats from external game state */
  updateStats(stats: Partial<SkinUnlockState>) {
    if (stats.totalRounds !== undefined) this.stats.totalRounds = stats.totalRounds;
    if (stats.totalHoleInOnes !== undefined) this.stats.totalHoleInOnes = stats.totalHoleInOnes;
    if (stats.coursesCompleted) this.stats.coursesCompleted = stats.coursesCompleted;
    if (stats.bestStreaks !== undefined) this.stats.bestStreaks = stats.bestStreaks;
    if (stats.underParHoles !== undefined) this.stats.underParHoles = stats.underParHoles;
    if (stats.achievementIds) this.stats.achievementIds = stats.achievementIds;
    this.saveState();
  }

  getActiveSkin(): BallSkin {
    return SKINS.find((s) => s.id === this.activeSkinId) || SKINS[0];
  }

  setActiveSkin(id: string) {
    const skin = SKINS.find((s) => s.id === id);
    if (skin && skin.isUnlocked(this.stats)) {
      this.activeSkinId = id;
      this.saveState();
    }
  }

  getAllSkins(): Array<BallSkin & { unlocked: boolean }> {
    return SKINS.map((s) => ({
      ...s,
      unlocked: s.isUnlocked(this.stats),
    }));
  }

  getUnlockedSkins(): BallSkin[] {
    return SKINS.filter((s) => s.isUnlocked(this.stats));
  }

  getActiveSkinId(): string {
    return this.activeSkinId;
  }

  private loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.activeSkinId) this.activeSkinId = parsed.activeSkinId;
        if (parsed.stats) {
          this.stats = { ...this.stats, ...parsed.stats };
        }
      }
    } catch {}
  }

  private saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeSkinId: this.activeSkinId,
          stats: this.stats,
        }),
      );
    } catch {}
  }
}
