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

  const world = await World.create(container, xrAvailable ? {
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
  });

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

  // UI
  const ui = new UIManager(world, game, audio);

  loadingScreen.setProgress(70, "Setting up controls...");

  // Input handlers
  const xrInput = new XRInputHandler(world, putter, game, ui);
  const browserInput = new BrowserInputHandler(world, putter, game, ui, container);

  // Achievements
  const achievements = new AchievementTracker();
  const banner = new HoleBanner();
  const stats = new StatsTracker();

  // Hook achievements into game events
  game.onStateChange((state) => {
    if (state === GameState.AIMING) {
      const hole = game.getCurrentHole();
      if (hole && game.currentStrokes === 0) {
        banner.show(hole.index + 1, hole.name, hole.par);
      }
    }
    if (state === GameState.HOLE_COMPLETE) {
      const hole = game.getCurrentHole();
      if (hole) {
        achievements.checkHole(game.currentStrokes, hole.par);
        stats.recordHole(game.currentStrokes, hole.par);
      }
    }
    if (state === GameState.COURSE_COMPLETE) {
      const score = game.courseScore;
      const totalPar = score.holes.reduce((s, h) => s + h.par, 0);
      achievements.checkCourse(score.totalStrokes, totalPar, score.holes);
      stats.recordRound(score.totalStrokes);
    }
  });

  loadingScreen.setProgress(85, "Ready...");

  // Main update loop
  let lastTime = performance.now();

  world.onUpdate(() => {
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
