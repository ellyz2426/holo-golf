/**
 * Holo Golf VR — Browser Input Handler
 * Mouse/keyboard controls for desktop play.
 * Click + drag back from ball = aim + power, release = putt.
 */
import { World, Vector3 } from "@iwsdk/core";
import { PutterController } from "./putter";
import { GameManager, GameState } from "./game";
import { UIManager } from "./ui";
import { PowerMeter } from "./powermeter";
import { ScorecardOverlay } from "./scorecard";

const MAX_POWER = 10.0;

export class BrowserInputHandler {
  private world: World;
  private putter: PutterController;
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
    // Camera updates handled by IWSDK's render config
  }
}
