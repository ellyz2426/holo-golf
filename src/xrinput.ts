/**
 * Holo Golf VR — XR Input Handler
 * Handles VR controller input: trigger to select/confirm, grip to reset ball,
 * A button for menus, thumbstick for camera.
 */
import { World, Vector3, Quaternion } from "@iwsdk/core";
import { InputComponent } from "@iwsdk/core";
import { PutterController } from "./putter";
import { GameManager, GameState } from "./game";
import { UIManager } from "./ui";

export class XRInputHandler {
  private world: World;
  private putter: PutterController;
  private game: GameManager;
  private ui: UIManager;

  constructor(
    world: World,
    putter: PutterController,
    game: GameManager,
    ui: UIManager,
  ) {
    this.world = world;
    this.putter = putter;
    this.game = game;
    this.ui = ui;
  }

  update(dt: number) {
    const xr = this.world.input?.xr;
    if (!xr) return;

    const rightGamepad = xr.gamepads?.right;
    const leftGamepad = xr.gamepads?.left;

    if (!rightGamepad) return;

    // Get right controller position for putter tracking
    const rightGripSpace = this.world.playerSpaceEntities?.gripSpaces?.right;
    if (rightGripSpace) {
      const pos = new Vector3();
      const quat = new Quaternion();
      rightGripSpace.object3D.getWorldPosition(pos);
      rightGripSpace.object3D.getWorldQuaternion(quat);
      this.putter.updateXR(pos, quat);
    }

    // A button — menu interaction
    const aPressed = rightGamepad.getButtonDown?.(InputComponent.A_Button);
    if (aPressed) {
      if (this.ui.isVisible()) {
        this.ui.handleSelect();
      } else if (this.game.state === GameState.COURSE_COMPLETE) {
        this.ui.showCourseComplete();
      }
    }

    // B button — reset ball
    const bPressed = rightGamepad.getButtonDown?.(InputComponent.B_Button);
    if (bPressed) {
      if (this.game.state === GameState.AIMING) {
        this.game.resetBall();
      }
    }

    // Squeeze/grip — could be used for ball pickup in future
    const squeeze = rightGamepad.getButtonPressed?.(InputComponent.Squeeze);
  }
}
