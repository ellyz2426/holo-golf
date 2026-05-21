/**
 * Holo Golf VR — Browser Input Handler
 * Mouse/keyboard controls for desktop play.
 * Click + drag back from ball = aim + power, release = putt.
 */
import { World, Vector3, Raycaster, Plane } from "@iwsdk/core";
import { PutterController } from "./putter";
import { GameManager, GameState } from "./game";
import { UIManager } from "./ui";

export class BrowserInputHandler {
  private world: World;
  private putter: PutterController;
  private game: GameManager;
  private ui: UIManager;
  private container: HTMLDivElement;
  private mouseDown = false;
  private mouseX = 0;
  private mouseY = 0;

  // Camera orbit
  private cameraAngle = 0;
  private cameraElevation = 0.4;
  private cameraDistance = 5;
  private cameraTarget = new Vector3(0, 0, 0);
  private rightMouseDown = false;
  private lastRightX = 0;
  private lastRightY = 0;

  constructor(
    world: World,
    putter: PutterController,
    game: GameManager,
    ui: UIManager,
    container: HTMLDivElement,
  ) {
    this.world = world;
    this.putter = putter;
    this.game = game;
    this.ui = ui;
    this.container = container;

    this.setupListeners();
  }

  private setupListeners() {
    // Mouse events
    this.container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Left click — start aiming
        if (
          this.game.state === GameState.AIMING &&
          !this.ui.isVisible()
        ) {
          this.mouseDown = true;
          this.mouseX = e.clientX;
          this.mouseY = e.clientY;
          this.putter.startAim(e.clientX, e.clientY);
        }
      } else if (e.button === 2) {
        // Right click — camera orbit
        this.rightMouseDown = true;
        this.lastRightX = e.clientX;
        this.lastRightY = e.clientY;
      }
    });

    this.container.addEventListener("mousemove", (e) => {
      if (this.mouseDown) {
        this.putter.updateAim(e.clientX, e.clientY);
      }
      if (this.rightMouseDown) {
        const dx = e.clientX - this.lastRightX;
        const dy = e.clientY - this.lastRightY;
        this.cameraAngle -= dx * 0.005;
        this.cameraElevation = Math.max(0.1, Math.min(1.2, this.cameraElevation + dy * 0.003));
        this.lastRightX = e.clientX;
        this.lastRightY = e.clientY;
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0 && this.mouseDown) {
        this.mouseDown = false;
        this.putter.releaseAim();
        // Notify game of stroke
        if (this.putter.aimPower > 0.1) {
          this.game.onStroke();
        }
      }
      if (e.button === 2) {
        this.rightMouseDown = false;
      }
    });

    // Prevent context menu
    this.container.addEventListener("contextmenu", (e) => e.preventDefault());

    // Keyboard
    window.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "r":
          if (this.game.state === GameState.AIMING) {
            this.game.resetBall();
          }
          break;
        case "escape":
          if (this.ui.isVisible()) {
            this.ui.showTitle();
          }
          break;
        case "enter":
        case " ":
          if (this.game.state === GameState.COURSE_COMPLETE) {
            this.ui.showCourseComplete();
          }
          break;
      }
    });

    // Scroll to zoom
    this.container.addEventListener("wheel", (e) => {
      this.cameraDistance = Math.max(2, Math.min(12, this.cameraDistance + e.deltaY * 0.005));
      e.preventDefault();
    }, { passive: false });
  }

  update(dt: number) {
    // Update camera orbit
    const state = this.game.state;
    if (
      state === GameState.AIMING ||
      state === GameState.BALL_MOVING ||
      state === GameState.HOLE_COMPLETE ||
      state === GameState.PLAYING
    ) {
      const hole = this.game.getCurrentHole();
      if (hole) {
        // Camera targets midpoint between tee and hole
        this.cameraTarget.copy(hole.teePosition)
          .add(hole.holePosition)
          .multiplyScalar(0.5);
        this.cameraTarget.y += 0.5;
      }

      const cam = (this.world as any).scene?.userData?.camera ||
        (this.world as any).__camera;

      // Try to access the Three.js camera
      if (this.world.scene.children) {
        const cameras = this.world.scene.children.filter(
          (c: any) => c.isCamera || c.type === "PerspectiveCamera",
        );
        // Camera positioning via world render config is handled by IWSDK
        // We'll position using the scene graph if available
      }
    }
  }
}
