/**
 * Holo Golf VR — Game Manager (Round 3 Overhaul)
 * Central state machine: TITLE → COURSE_SELECT → PLAYING → HOLE_COMPLETE → COURSE_COMPLETE
 * New: stroke limit per hole, skip-to-next-hole, course-specific theme colors.
 */
import { World, Vector3 } from "@iwsdk/core";
import { BallController } from "./ball";
import { PutterController } from "./putter";
import { CourseManager, HoleData } from "./course";
import { EffectsManager } from "./effects";
import { AudioManager } from "./audio";

export const MAX_STROKES_PER_HOLE = 10;

export enum GameState {
  LOADING = "loading",
  TITLE = "title",
  COURSE_SELECT = "course_select",
  PLAYING = "playing",
  AIMING = "aiming",
  BALL_MOVING = "ball_moving",
  HOLE_COMPLETE = "hole_complete",
  COURSE_COMPLETE = "course_complete",
  SETTINGS = "settings",
}

export interface HoleScore {
  holeIndex: number;
  par: number;
  strokes: number;
  holeInOne: boolean;
}

export interface CourseScore {
  courseName: string;
  holes: HoleScore[];
  totalStrokes: number;
  totalPar: number;
  completed: boolean;
}

export class GameManager {
  state: GameState = GameState.LOADING;
  currentCourseIndex = 0;
  currentHoleIndex = 0;
  currentStrokes = 0;
  courseScore: CourseScore;
  bestScores: Map<string, number> = new Map();
  practiceMode = false;

  private world: World;
  courseManager: CourseManager;
  private ball: BallController;
  private putter: PutterController;
  private effects: EffectsManager;
  audio: AudioManager;
  private holeTransitionTimer = 0;
  private stateListeners: ((state: GameState) => void)[] = [];

  constructor(
    world: World,
    courseManager: CourseManager,
    ball: BallController,
    putter: PutterController,
    effects: EffectsManager,
    audio: AudioManager,
  ) {
    this.world = world;
    this.courseManager = courseManager;
    this.ball = ball;
    this.putter = putter;
    this.effects = effects;
    this.audio = audio;
    this.courseScore = this.createEmptyScore("Neon Circuit");

    // Load best scores from localStorage
    this.loadBestScores();
  }

  onStateChange(listener: (state: GameState) => void) {
    this.stateListeners.push(listener);
  }

  setState(state: GameState) {
    this.state = state;
    this.stateListeners.forEach((l) => l(state));
  }

  startCourse(courseIndex: number) {
    this.currentCourseIndex = courseIndex;
    this.currentHoleIndex = 0;
    this.currentStrokes = 0;
    this.practiceMode = false;
    const course = this.courseManager.getCourse(courseIndex);
    this.courseScore = this.createEmptyScore(course.name);

    // Switch ambient music based on course
    this.audio.switchCourseAmbient(courseIndex);

    this.loadHole(0);
    this.setState(GameState.PLAYING);
  }

  startPracticeHole(courseIndex: number, holeIndex: number) {
    this.currentCourseIndex = courseIndex;
    this.currentHoleIndex = holeIndex;
    this.currentStrokes = 0;
    this.practiceMode = true;
    const course = this.courseManager.getCourse(courseIndex);
    this.courseScore = this.createEmptyScore(course.name + " (Practice)");

    this.audio.switchCourseAmbient(courseIndex);
    this.loadHole(holeIndex);
    this.setState(GameState.PLAYING);
  }

  loadHole(holeIndex: number) {
    this.currentHoleIndex = holeIndex;
    this.currentStrokes = 0;
    const course = this.courseManager.getCourse(this.currentCourseIndex);
    const hole = course.holes[holeIndex];

    // Clear previous hole geometry
    this.courseManager.clearCurrentHole();

    // Build new hole
    this.courseManager.buildHole(hole);

    // Position ball at tee
    this.ball.reset(hole.teePosition.clone());

    // Position putter near ball
    this.putter.setActive(true);

    // Camera
    this.effects.holeTransition();

    this.audio.playHoleStart();
    this.setState(GameState.AIMING);
  }

  onStroke() {
    this.currentStrokes++;
    this.audio.playPutt();
    this.setState(GameState.BALL_MOVING);
  }

  onBallStopped() {
    if (this.state !== GameState.BALL_MOVING) return;

    // Check if ball is in hole
    const course = this.courseManager.getCourse(this.currentCourseIndex);
    const hole = course.holes[this.currentHoleIndex];
    const dist = this.ball.position.distanceTo(hole.holePosition);

    if (dist < 0.15) {
      // Ball is in the hole!
      this.completeHole();
    } else if (this.currentStrokes >= MAX_STROKES_PER_HOLE) {
      // Stroke limit reached — auto-complete with max strokes
      this.completeHole();
    } else {
      // Ball stopped but not in hole
      this.setState(GameState.AIMING);
    }
  }

  private completeHole() {
    const course = this.courseManager.getCourse(this.currentCourseIndex);
    const hole = course.holes[this.currentHoleIndex];
    const holeInOne = this.currentStrokes === 1;

    // Check if actually in hole for effects
    const inHole = this.ball.position.distanceTo(hole.holePosition) < 0.15;

    this.courseScore.holes[this.currentHoleIndex] = {
      holeIndex: this.currentHoleIndex,
      par: hole.par,
      strokes: this.currentStrokes,
      holeInOne,
    };

    this.courseScore.totalStrokes = this.courseScore.holes
      .filter((h) => h.strokes > 0)
      .reduce((sum, h) => sum + h.strokes, 0);

    // Effects
    if (inHole) {
      if (holeInOne) {
        this.effects.holeInOneEffect(this.ball.position);
        this.audio.playHoleInOne();
      } else if (this.currentStrokes <= hole.par) {
        this.effects.underParEffect(this.ball.position);
        this.audio.playUnderPar();
      } else {
        this.effects.holeCompleteEffect(this.ball.position);
        this.audio.playHoleComplete();
      }
      this.ball.sinkIntoHole(hole.holePosition);
    } else {
      // Stroke limit reached, ball didn't make it
      this.effects.strokeLimitEffect(this.ball.position);
      this.audio.playStrokeLimit();
    }

    this.putter.setActive(false);
    this.setState(GameState.HOLE_COMPLETE);
    this.holeTransitionTimer = 3.0;
  }

  // Skip hole transition timer (XR controller A/trigger press)
  skipToNextHole() {
    if (this.state !== GameState.HOLE_COMPLETE) return;
    this.holeTransitionTimer = 0;
    this.nextHole();
  }

  nextHole() {
    if (this.practiceMode) {
      // In practice mode, replay the same hole or go to complete
      this.completeCourse();
      return;
    }
    const course = this.courseManager.getCourse(this.currentCourseIndex);
    if (this.currentHoleIndex < course.holes.length - 1) {
      this.loadHole(this.currentHoleIndex + 1);
    } else {
      this.completeCourse();
    }
  }

  private completeCourse() {
    this.courseScore.completed = true;
    const key = `course_${this.currentCourseIndex}`;
    const best = this.bestScores.get(key);
    if (!best || this.courseScore.totalStrokes < best) {
      this.bestScores.set(key, this.courseScore.totalStrokes);
      this.saveBestScores();
    }
    this.setState(GameState.COURSE_COMPLETE);
    this.audio.playCourseComplete();
  }

  resetBall() {
    if (this.state !== GameState.AIMING) return;
    const course = this.courseManager.getCourse(this.currentCourseIndex);
    const hole = course.holes[this.currentHoleIndex];
    this.ball.reset(hole.teePosition.clone());
    this.audio.playReset();
  }

  getCurrentHole(): HoleData | null {
    try {
      const course = this.courseManager.getCourse(this.currentCourseIndex);
      return course.holes[this.currentHoleIndex] || null;
    } catch {
      return null;
    }
  }

  getScoreName(strokes: number, par: number): string {
    const diff = strokes - par;
    if (strokes === 1) return "HOLE IN ONE!";
    if (strokes >= MAX_STROKES_PER_HOLE) return "MAX STROKES";
    if (diff <= -3) return "Albatross";
    if (diff === -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    if (diff === 3) return "Triple Bogey";
    return `+${diff}`;
  }

  update(dt: number) {
    if (this.state === GameState.HOLE_COMPLETE) {
      this.holeTransitionTimer -= dt;
      if (this.holeTransitionTimer <= 0) {
        this.nextHole();
      }
    }

    // Check if ball stopped
    if (this.state === GameState.BALL_MOVING && this.ball.isStopped()) {
      this.onBallStopped();
    }

    // Check special zones while ball is moving or aiming (wind/ice)
    if (
      (this.state === GameState.BALL_MOVING || this.state === GameState.AIMING) &&
      this.ball.isActive
    ) {
      const result = this.courseManager.checkBallZones(
        this.ball.position,
        this.ball.velocity,
      );

      // Teleporter
      if (result.teleported && result.teleportTarget) {
        this.ball.reset(result.teleportTarget);
        this.ball.velocity.set(0, 0, 0);
        this.audio.playTeleport();
        this.effects.teleportEffect(this.ball.position);
      }

      // Wind force
      this.ball.setWindForce(result.windForce);

      // Ice friction
      this.ball.setFrictionOverride(result.frictionOverride);
    }
  }

  private createEmptyScore(courseName: string): CourseScore {
    return {
      courseName,
      holes: Array.from({ length: 9 }, (_, i) => ({
        holeIndex: i,
        par: 3,
        strokes: 0,
        holeInOne: false,
      })),
      totalStrokes: 0,
      totalPar: 0,
      completed: false,
    };
  }

  private loadBestScores() {
    try {
      const data = localStorage.getItem("holo-golf-best");
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([k, v]) => this.bestScores.set(k, v as number));
      }
    } catch {}
  }

  private saveBestScores() {
    try {
      const obj: Record<string, number> = {};
      this.bestScores.forEach((v, k) => (obj[k] = v));
      localStorage.setItem("holo-golf-best", JSON.stringify(obj));
    } catch {}
  }
}
