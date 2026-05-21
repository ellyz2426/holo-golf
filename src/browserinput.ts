/**
 * Holo Golf VR — Browser Input Handler
 * Mouse/keyboard controls for desktop play.
 * Click + drag back from ball = aim + power, release = putt.
 * Right-drag orbits the camera around the ball. Scroll to zoom.
 */
import { World, Vector3 } from "@iwsdk/core";
import { PutterController } from "./putter";
import { BallController } from "./ball";
import { GameManager, GameState } from "./game";
import { UIManager } from "./ui";
import { PowerMeter } from "./powermeter";
import { ScorecardOverlay } from "./scorecard";

const MAX_POWER = 10.0;

export class BrowserInputHandler {
  private world: World;
  private putter: PutterController;
  private ball: BallController;
  private game: GameManager;
  private ui: UIManager;
  private container: HTMLDivElement;
  private mouseDown = false;
  private powerMeter: PowerMeter;
  private scorecard: ScorecardOverlay;

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
    ball: BallController,
    ui: UIManager,
    container: HTMLDivElement,
  ) {
    this.world = world;
    this.putter = putter;
    this.ball = ball;
    this.game = game;
    this.ui = ui;
    this.container = container;
    this.powerMeter = new PowerMeter();
    this.scorecard = new ScorecardOverlay(game);

    this.setupListeners();
  }

  private setupListeners() {
    this.container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        if (
          this.game.state === GameState.AIMING &&
          !this.ui.isVisible() &&
          !this.scorecard.isVisible()
        ) {
          this.mouseDown = true;
          this.putter.startAim(e.clientX, e.clientY);
          this.powerMeter.show();
        }
      } else if (e.button === 2) {
        this.rightMouseDown = true;
        this.lastRightX = e.clientX;
        this.lastRightY = e.clientY;
      }
    });

    this.container.addEventListener("mousemove", (e) => {
      if (this.mouseDown) {
        this.putter.updateAim(e.clientX, e.clientY);
        this.powerMeter.update(this.putter.aimPower, MAX_POWER);
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
        const hadPower = this.putter.aimPower > 0.1;
        this.putter.releaseAim();
        this.powerMeter.hide();
        if (hadPower) {
          this.game.onStroke();
        }
      }
      if (e.button === 2) {
        this.rightMouseDown = false;
      }
    });

    this.container.addEventListener("contextmenu", (e) => e.preventDefault());

    window.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "r":
          if (this.game.state === GameState.AIMING) {
            this.game.resetBall();
          }
          break;
        case "tab":
          e.preventDefault();
          this.scorecard.toggle();
          break;
        case "escape":
          if (this.scorecard.isVisible()) {
            this.scorecard.hide();
          } else if (this.ui.isVisible()) {
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

    this.container.addEventListener("wheel", (e) => {
      this.cameraDistance = Math.max(2, Math.min(12, this.cameraDistance + e.deltaY * 0.005));
      e.preventDefault();
    }, { passive: false });
  }

  update(dt: number) {
    // Camera follows ball during gameplay
    const state = this.game.state;
    const isPlaying = state === GameState.AIMING || state === GameState.BALL_MOVING ||
                      state === GameState.HOLE_COMPLETE || state === GameState.PLAYING;

    if (isPlaying && this.ball.isActive) {
      // Smoothly track ball position
      this.cameraTarget.lerp(this.ball.position, dt * 3);
    } else if (isPlaying) {
      // If ball isn't active yet, track the hole area
      const hole = this.game.getCurrentHole();
      if (hole) {
        const mid = hole.teePosition.clone().add(hole.holePosition).multiplyScalar(0.5);
        this.cameraTarget.lerp(mid, dt * 2);
      }
    }

    // Compute orbit camera position
    const camera = (this.world as any).scene?.userData?.camera ??
                   (this.world as any).camera ??
                   (this.world as any)._camera;

    // Try to get Three.js camera from the world's scene children
    let cam: any = null;
    if ((this.world as any).scene) {
      const scene = (this.world as any).scene;
      scene.traverse?.((child: any) => {
        if (!cam && child.isCamera) {
          cam = child;
        }
      });
    }

    if (!cam && (this.world as any).renderer) {
      // Try via renderer
      cam = camera;
    }

    if (cam) {
      const x = this.cameraTarget.x + Math.sin(this.cameraAngle) * this.cameraDistance * Math.cos(this.cameraElevation);
      const y = this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraElevation) + 0.5;
      const z = this.cameraTarget.z + Math.cos(this.cameraAngle) * this.cameraDistance * Math.cos(this.cameraElevation);

      cam.position.lerp(new Vector3(x, y, z), dt * 5);
      cam.lookAt(this.cameraTarget.x, this.cameraTarget.y + 0.1, this.cameraTarget.z);
    }
  }
}
