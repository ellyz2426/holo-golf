/**
 * Holo Golf VR — Statistics
 * Persistent play statistics tracking.
 */

export interface GameStats {
  totalRounds: number;
  totalHoles: number;
  totalStrokes: number;
  holeInOnes: number;
  bestRound: number;
  worstRound: number;
  avgStrokes: number;
  birdies: number;
  eagles: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  longestStreak: number;  // consecutive pars or better
}

const DEFAULT_STATS: GameStats = {
  totalRounds: 0,
  totalHoles: 0,
  totalStrokes: 0,
  holeInOnes: 0,
  bestRound: 999,
  worstRound: 0,
  avgStrokes: 0,
  birdies: 0,
  eagles: 0,
  pars: 0,
  bogeys: 0,
  doubleBogeys: 0,
  longestStreak: 0,
};

export class StatsTracker {
  private stats: GameStats;

  constructor() {
    this.stats = { ...DEFAULT_STATS };
    this.load();
  }

  recordHole(strokes: number, par: number) {
    this.stats.totalHoles++;
    this.stats.totalStrokes += strokes;

    const diff = strokes - par;
    if (strokes === 1) this.stats.holeInOnes++;
    if (diff === -2) this.stats.eagles++;
    else if (diff === -1) this.stats.birdies++;
    else if (diff === 0) this.stats.pars++;
    else if (diff === 1) this.stats.bogeys++;
    else if (diff >= 2) this.stats.doubleBogeys++;

    this.stats.avgStrokes =
      this.stats.totalHoles > 0 ? this.stats.totalStrokes / this.stats.totalHoles : 0;

    this.save();
  }

  recordRound(totalStrokes: number) {
    this.stats.totalRounds++;
    if (totalStrokes < this.stats.bestRound) this.stats.bestRound = totalStrokes;
    if (totalStrokes > this.stats.worstRound) this.stats.worstRound = totalStrokes;
    this.save();
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getTotalRounds(): number {
    return this.stats.totalRounds;
  }

  getTotalHoleInOnes(): number {
    return this.stats.holeInOnes;
  }

  /** Return list of course indices that have been completed at least once.
   *  We track this via a stored array in localStorage. */
  getCoursesCompleted(): number[] {
    try {
      const data = localStorage.getItem("holo-golf-courses-completed");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  recordCourseComplete(courseIndex: number) {
    const completed = this.getCoursesCompleted();
    if (!completed.includes(courseIndex)) {
      completed.push(courseIndex);
      try {
        localStorage.setItem("holo-golf-courses-completed", JSON.stringify(completed));
      } catch {}
    }
  }

  private save() {
    try {
      localStorage.setItem("holo-golf-stats", JSON.stringify(this.stats));
    } catch {}
  }

  private load() {
    try {
      const data = localStorage.getItem("holo-golf-stats");
      if (data) {
        Object.assign(this.stats, JSON.parse(data));
      }
    } catch {}
  }
}
