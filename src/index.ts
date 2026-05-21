/**
 * Holo Golf VR — Main Entry Point (Round 3 Overhaul)
 * Wires all systems together with course-specific theming, XR→browser camera sync,
 * and integrated environment theme switching.
 */
import {
  World,
  Color,
  AmbientLight,
  DirectionalLight,
  PointLight,
  Fog,
  Vector3,
  Group,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  CylinderGeometry,
  BoxGeometry,
  PlaneGeometry,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  RingGeometry,
  DoubleSide,
  AdditiveBlending,
} from "@iwsdk/core";
import { GameManager, GameState } from "./game";
import { BallController } from "./ball";
import { PutterController } from "./putter";
import { CourseManager } from "./course";
import { HUDManager } from "./hud";
import { UIManager } from "./ui";
import { EffectsManager } from "./effects";
import { AudioManager } from "./audio";
import { EnvironmentBuilder } from "./environment";
import { XRInputHandler } from "./xrinput";
import { BrowserInputHandler } from "./browserinput";
import { createLoadingScreen } from "./loading";
import { ControlsHelp } from "./controls";
import { AchievementTracker } from "./achievements";
import { HoleBanner } from "./banner";
import { StatsTracker } from "./stats";
import { MiniMap } from "./minimap";
import { PracticeMode } from "./practice";
import { ToastManager } from "./toast";

const container = document.getElementById("scene-container") as HTMLDivElement;

const loadingScreen = createLoadingScreen();
loadingScreen.show();
loadingScreen.setProgress(5, "Detecting hardware...");

async function detectXR(): Promise<boolean> {
  if (typeof navigator !== "undefined" && (navigator as any).xr) {
    try {
      return await (navigator as any).xr.isSessionSupported("immersive-vr");
    } catch {
      return false;
    }
  }
  return false;
}

async function main() {
  const xrAvailable = await detectXR();
  loadingScreen.setProgress(15, "Creating world...");

  const worldOpts: any = xrAvailable ? {
    xr: { offer: "once" },
    input: { canvasPointerEvents: true },
    features: {
      grabbing: false,
      locomotion: false,
      physics: false,
    },
  } : {
    xr: false,
    render: {
      near: 0.01,
      far: 500,
      camera: { position: [0, 3, 8], lookAt: [0, 0, 0] },
    },
    input: { canvasPointerEvents: true },
    features: {
      grabbing: false,
      locomotion: false,
      physics: false,
    },
  };

  const world = await World.create(container, worldOpts);

  loadingScreen.setProgress(30, "Building environment...");

  // Environment
  const env = new EnvironmentBuilder(world);
  env.build();

  loadingScreen.setProgress(45, "Initializing audio...");

  // Audio
  const audio = new AudioManager();
  await audio.init();

  loadingScreen.setProgress(55, "Loading course...");

  // Course
  const courseManager = new CourseManager(world);

  // Ball
  const ball = new BallController(world, audio);

  // Putter
  const putter = new PutterController(world, ball, audio);

  // Effects
  const effects = new EffectsManager(world);

  // Game manager
  const game = new GameManager(world, courseManager, ball, putter, effects, audio);

  // HUD
  const hud = new HUDManager(world, game);
  hud.setBall(ball);

  // UI
  const ui = new UIManager(world, game, audio);

  loadingScreen.setProgress(70, "Setting up controls...");

  // Input handlers
  const xrInput = new XRInputHandler(world, putter, game, ui);
  const browserInput = new BrowserInputHandler(world, putter, game, ball, ui, container);

  // Wire XR camera orbit into browser input system
  browserInput.xrInput = xrInput;

  // Wire ball out-of-bounds callback
  ball.onOutOfBounds = () => {
    toast.showOutOfBounds();
    hud.flashPenalty();
    game.handleBallOOB();
  };

  // Wire water hazard callback
  game.onWaterHazard = () => {
    toast.showWaterHazard();
    hud.flashPenalty();
  };

  // Achievements
  const achievements = new AchievementTracker();
  const banner = new HoleBanner();
  const stats = new StatsTracker();
  const minimap = new MiniMap(game, ball);
  const practice = new PracticeMode(game, audio);
  const toast = new ToastManager();

  // Wire practice mode into UI
  ui.practiceMode = practice;

  // Hook state changes for environment theming + achievements
  game.onStateChange((state) => {
    if (state === GameState.AIMING) {
      const hole = game.getCurrentHole();
      if (hole && game.currentStrokes === 0) {
        banner.show(hole.index + 1, hole.name, hole.par);
      }
    }
    if (state === GameState.PLAYING) {
      // Switch environment theme when starting a course
      env.applyTheme(game.currentCourseIndex);
      effects.setCourseIndex(game.currentCourseIndex);
      ball.setCourseTheme(game.currentCourseIndex);
    }
    if (state === GameState.HOLE_COMPLETE) {
      const hole = game.getCurrentHole();
      if (hole) {
        achievements.checkHole(game.currentStrokes, hole.par);
        stats.recordHole(game.currentStrokes, hole.par);

        // Show score name toast
        const scoreName = game.getScoreName(game.currentStrokes, hole.par);
        if (game.currentStrokes === 1) {
          toast.show("HOLE IN ONE!", "#ffff00", "⭐", 3.0);
        } else if (game.currentStrokes <= hole.par) {
          toast.show(scoreName, "#00ff88", "✓");
        }
      }
    }
    if (state === GameState.COURSE_COMPLETE) {
      const score = game.courseScore;
      const totalPar = score.holes.reduce((s, h) => s + h.par, 0);
      const holeInOnes = score.holes.filter((h) => h.holeInOne).length;
      achievements.checkCourse(score.totalStrokes, totalPar, score.holes);
      stats.recordRound(score.totalStrokes);

      // Record to leaderboard
      const lbResult = browserInput.leaderboard.recordScore(
        game.currentCourseIndex,
        score.courseName,
        score.totalStrokes,
        totalPar,
        holeInOnes,
      );
      if (lbResult.isNewBest) {
        toast.showNewRecord();
      }
    }
  });

  loadingScreen.setProgress(85, "Ready...");

  // Main update loop
  let lastTime = performance.now();

  const registerUpdate = (fn: () => void) => {
    if ((world as any).onUpdate) {
      (world as any).onUpdate(fn);
    } else {
      const loop = () => {
        fn();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  };

  registerUpdate(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Update game systems
    game.update(dt);
    ball.update(dt);
    putter.update(dt, world);
    courseManager.updateObstacles(dt);
    effects.update(dt);
    hud.update(dt);
    ui.update(dt);
    env.update(dt);

    // Input
    if (xrAvailable) {
      xrInput.update(dt);
    }
    browserInput.update(dt);
    achievements.update(dt);
    banner.update(dt);
    minimap.update(dt);
    toast.update(dt);
  });

  loadingScreen.setProgress(100, "Welcome to Holo Golf!");
  setTimeout(() => {
    loadingScreen.hide();
    game.setState(GameState.TITLE);
    ui.showTitle();
    audio.playAmbient();
    new ControlsHelp();
  }, 600);
}

main().catch((err) => {
  console.error("Failed to start Holo Golf:", err);
  loadingScreen.setProgress(0, "Error: " + (err as Error).message);
});
