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
import { ScanlineOverlay, CameraShake, SlowMotionController, StreakTracker } from "./postfx";

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
    cameraShake.trigger(0.3, 6);
  };

  // Wire ball bounce callback for camera shake
  ball.onBounce = (intensity: number) => {
    cameraShake.trigger(intensity, 10);
  };

  // Wire water hazard callback
  game.onWaterHazard = () => {
    toast.showWaterHazard();
    hud.flashPenalty();
    cameraShake.trigger(0.2, 6);
  };

  // Achievements
  const achievements = new AchievementTracker();
  const banner = new HoleBanner();
  const stats = new StatsTracker();
  const minimap = new MiniMap(game, ball);
  const practice = new PracticeMode(game, audio);
  const toast = new ToastManager();
  const scanlines = new ScanlineOverlay();
  const cameraShake = new CameraShake();
  const slowMo = new SlowMotionController();
  const streakTracker = new StreakTracker();

  // Start rolling sound system (will be silent until ball moves)
  audio.startRolling();

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
      streakTracker.reset();
    }
    if (state === GameState.HOLE_COMPLETE) {
      const hole = game.getCurrentHole();
      if (hole) {
        achievements.checkHole(game.currentStrokes, hole.par);
        stats.recordHole(game.currentStrokes, hole.par);

        // Distinct score SFX based on performance
        const diff = game.currentStrokes - hole.par;
        if (game.currentStrokes === 1) {
          // hole-in-one handled by game.ts
        } else if (diff <= -2) {
          audio.playEagle();
        } else if (diff === -1) {
          audio.playBirdie();
        } else if (diff === 0) {
          audio.playParScore();
        } else if (diff >= 1) {
          audio.playBogey();
        }

        // Streak tracking
        const streakMsg = streakTracker.recordHole(game.currentStrokes, hole.par);
        if (streakMsg) {
          toast.show(streakMsg, "#ffaa00", "🔥", 3.0);
          audio.playStreakChime(streakTracker.state.consecutive);
        }

        // Show score name toast
        const scoreName = game.getScoreName(game.currentStrokes, hole.par);
        if (game.currentStrokes === 1) {
          toast.show("HOLE IN ONE!", "#ffff00", "⭐", 3.0);
        } else if (game.currentStrokes <= hole.par) {
          toast.show(scoreName, "#00ff88", "✓");
        }

        // Camera shake for dramatic moments
        if (game.currentStrokes === 1) {
          cameraShake.trigger(0.5, 5);
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
    let dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Apply slow motion time scale
    const timeScale = slowMo.update(dt);
    const gameDt = dt * timeScale;

    // Update game systems with time-scaled dt
    game.update(gameDt);
    ball.update(gameDt);
    putter.update(gameDt, world);
    courseManager.updateObstacles(gameDt);
    effects.update(gameDt);
    hud.update(gameDt);
    ui.update(gameDt);
    env.update(gameDt);

    // Input (always real-time dt)
    if (xrAvailable) {
      xrInput.update(dt);
    }
    browserInput.update(dt);
    achievements.update(dt);
    banner.update(dt);
    minimap.update(dt);
    toast.update(dt);
    streakTracker.update(dt);

    // Rolling ball sound — update volume based on ball speed
    const ballSpeed = ball.velocity.length();
    if (ballSpeed > 0.1 && ball.isActive && !ball.isStopped()) {
      audio.updateRolling(ballSpeed);
    } else {
      audio.updateRolling(0);
    }

    // Slow-mo trigger when ball is close to hole and moving slowly
    if (
      game.state === GameState.BALL_MOVING &&
      ball.isActive &&
      !ball.isStopped()
    ) {
      const hole = game.getCurrentHole();
      if (hole) {
        const dist = ball.position.distanceTo(hole.holePosition);
        if (dist < 0.3 && ballSpeed < 2.0 && ballSpeed > 0.1) {
          slowMo.trigger(0.4, 1.0);
        }
      }
    }

    // Apply camera shake offset
    const shakeOffset = cameraShake.update(dt);
    if (cameraShake.isShaking) {
      browserInput.applyCameraShake(shakeOffset.x, shakeOffset.y, shakeOffset.z);
    }
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
