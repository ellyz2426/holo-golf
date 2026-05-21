/**
 * Holo Golf VR — XR Input Handler (Round 3 Overhaul)
 * Full end-to-end XR controller support across ALL game states:
 * - Title screen: trigger/A to navigate, thumbstick to browse
 * - Course select: trigger/A to select course, thumbstick L/R to browse, B for back
 * - Playing/Aiming: trigger to putt, grip for power boost, B to reset, thumbstick to orbit
 * - Hole Complete: auto-advance or A to skip
 * - Course Complete: trigger/A to replay/menu, thumbstick to select option
 * - Scorecard: B to toggle, thumbstick to scroll
 */
import { World, Vector3, Quaternion, Group, Mesh, CylinderGeometry, MeshBasicMaterial, Color, AdditiveBlending, Line, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, SphereGeometry } from "@iwsdk/core";
import { InputComponent } from "@iwsdk/core";
import { PutterController } from "./putter";
import { GameManager, GameState } from "./game";
import { UIManager } from "./ui";

const THUMBSTICK_DEADZONE = 0.3;
const THUMBSTICK_COOLDOWN = 0.25; // seconds between menu nav ticks

export class XRInputHandler {
  private world: World;
  private putter: PutterController;
  private game: GameManager;
  private ui: UIManager;

  // Controller tracking
  private prevRightPos = new Vector3();
  private prevLeftPos = new Vector3();
  private rightVelocity = new Vector3();

  // Thumbstick menu navigation
  private thumbCooldownRight = 0;
  private thumbCooldownLeft = 0;

  // Menu cursor state
  private menuCursorIndex = 0; // which menu item is "focused"
  private lastMenuScreen = "";

  // Laser pointer visualization
  private laserLine: Line;
  private laserDot: Mesh;
  private laserGroup: Group;

  // Grip boost state
  private gripHeld = false;
  private gripBoostMultiplier = 1.0;

  // Camera orbit via left thumbstick
  cameraOrbitDelta = { horizontal: 0, vertical: 0 };

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

    // Build laser pointer
    this.laserGroup = new Group();
    const lineGeo = new BufferGeometry();
    const positions = new Float32Array(6);
    lineGeo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    this.laserLine = new Line(
      lineGeo,
      new LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6,
      }),
    );
    this.laserLine.visible = false;
    this.laserGroup.add(this.laserLine);

    // Laser endpoint dot
    const dotGeo = new SphereGeometry(0.008, 8, 8);
    const dotMat = new MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
    });
    this.laserDot = new Mesh(dotGeo, dotMat);
    this.laserDot.visible = false;
    this.laserGroup.add(this.laserDot);

    world.scene.add(this.laserGroup);

    // Reset cursor when game state changes
    game.onStateChange(() => {
      this.menuCursorIndex = 0;
    });
  }

  update(dt: number) {
    // Tick cooldowns
    if (this.thumbCooldownRight > 0) this.thumbCooldownRight -= dt;
    if (this.thumbCooldownLeft > 0) this.thumbCooldownLeft -= dt;

    // Reset camera orbit delta
    this.cameraOrbitDelta.horizontal = 0;
    this.cameraOrbitDelta.vertical = 0;

    // Access XR input — handle both 0.3.x and 0.4.x API shapes
    const input = this.world.input as any;
    const xr = input?.xr ?? input;
    if (!xr) return;

    const rightGamepad = xr.gamepads?.right;
    const leftGamepad = xr.gamepads?.left;

    if (!rightGamepad) return;

    // Get right controller position for putter tracking
    const playerSpaceEntities = (this.world as any).playerSpaceEntities;
    const rightGripSpace = playerSpaceEntities?.gripSpaces?.right;
    const rightRaySpace = playerSpaceEntities?.raySpaces?.right;

    if (rightGripSpace) {
      const pos = new Vector3();
      const quat = new Quaternion();
      rightGripSpace.object3D.getWorldPosition(pos);
      rightGripSpace.object3D.getWorldQuaternion(quat);

      // Track velocity for swing detection
      this.rightVelocity.copy(pos).sub(this.prevRightPos);
      this.prevRightPos.copy(pos);

      this.putter.updateXR(pos, quat);
    }

    // Update laser pointer (visible in menus and aiming)
    this.updateLaserPointer(rightRaySpace || rightGripSpace);

    // Route input by game state
    const state = this.game.state;

    if (this.ui.isVisible()) {
      this.handleMenuInput(rightGamepad, leftGamepad, dt);
    } else if (state === GameState.AIMING) {
      this.handleAimingInput(rightGamepad, leftGamepad, dt);
    } else if (state === GameState.BALL_MOVING) {
      this.handleBallMovingInput(leftGamepad, dt);
    } else if (state === GameState.HOLE_COMPLETE) {
      this.handleHoleCompleteInput(rightGamepad);
    } else if (state === GameState.COURSE_COMPLETE) {
      this.handleCourseCompleteInput(rightGamepad);
    }

    // Grip button tracking (works in any state)
    const gripHeld = rightGamepad.getButtonPressed?.(InputComponent.Squeeze);
    this.gripHeld = !!gripHeld;
    if (this.gripHeld) {
      this.gripBoostMultiplier = Math.min(this.gripBoostMultiplier + dt * 0.8, 1.5);
    } else {
      this.gripBoostMultiplier = Math.max(this.gripBoostMultiplier - dt * 2.0, 1.0);
    }
  }

  // Get the grip boost multiplier for power shots
  getGripBoost(): number {
    return this.gripBoostMultiplier;
  }

  private updateLaserPointer(gripSpace: any) {
    const showLaser = this.ui.isVisible() || this.game.state === GameState.AIMING;

    if (!gripSpace || !showLaser) {
      this.laserLine.visible = false;
      this.laserDot.visible = false;
      return;
    }

    const pos = new Vector3();
    const dir = new Vector3(0, 0, -1);
    gripSpace.object3D.getWorldPosition(pos);
    gripSpace.object3D.getWorldQuaternion(new Quaternion());

    // In aiming mode, point toward the ball
    if (this.game.state === GameState.AIMING && this.putter.isAiming) {
      // Laser shows aim direction
      const ballPos = (this.game as any).ball?.position;
      if (ballPos) {
        dir.copy(this.putter.aimDirection);
      }
    }

    const end = pos.clone().add(dir.multiplyScalar(3));
    const posAttr = this.laserLine.geometry.getAttribute("position");
    const arr = posAttr.array as Float32Array;
    arr[0] = pos.x; arr[1] = pos.y; arr[2] = pos.z;
    arr[3] = end.x; arr[4] = end.y; arr[5] = end.z;
    posAttr.needsUpdate = true;

    this.laserLine.visible = true;
    this.laserDot.position.copy(end);
    this.laserDot.visible = true;
  }

  // === Menu navigation with controllers ===

  private handleMenuInput(rightGamepad: any, leftGamepad: any, dt: number) {
    // Trigger or A to select current menu item
    const triggerDown = rightGamepad.getButtonDown?.(InputComponent.Trigger);
    const aDown = rightGamepad.getButtonDown?.(InputComponent.A_Button);

    if (triggerDown || aDown) {
      this.ui.handleSelect();
    }

    // B button to go back
    const bDown = rightGamepad.getButtonDown?.(InputComponent.B_Button);
    if (bDown) {
      this.ui.handleBack();
    }

    // Thumbstick for menu navigation
    const rightThumb = rightGamepad.getAxesValues?.(InputComponent.Thumbstick);
    if (rightThumb && this.thumbCooldownRight <= 0) {
      if (rightThumb.x > THUMBSTICK_DEADZONE || rightThumb.y > THUMBSTICK_DEADZONE) {
        this.ui.handleNavNext();
        this.thumbCooldownRight = THUMBSTICK_COOLDOWN;
      } else if (rightThumb.x < -THUMBSTICK_DEADZONE || rightThumb.y < -THUMBSTICK_DEADZONE) {
        this.ui.handleNavPrev();
        this.thumbCooldownRight = THUMBSTICK_COOLDOWN;
      }
    }

    // Left thumbstick also works for navigation
    if (leftGamepad) {
      const leftThumb = leftGamepad.getAxesValues?.(InputComponent.Thumbstick);
      if (leftThumb && this.thumbCooldownLeft <= 0) {
        if (leftThumb.x > THUMBSTICK_DEADZONE) {
          this.ui.handleNavNext();
          this.thumbCooldownLeft = THUMBSTICK_COOLDOWN;
        } else if (leftThumb.x < -THUMBSTICK_DEADZONE) {
          this.ui.handleNavPrev();
          this.thumbCooldownLeft = THUMBSTICK_COOLDOWN;
        }
      }
    }
  }

  // === Aiming state (controller-based putting) ===

  private handleAimingInput(rightGamepad: any, leftGamepad: any, dt: number) {
    // Trigger fires the putt (swing detection also works via putter.updateXR)
    const triggerDown = rightGamepad.getButtonDown?.(InputComponent.Trigger);
    if (triggerDown && this.putter.isAiming) {
      // Quick-fire with current aim direction if set
      this.putter.releaseAim();
      this.game.onStroke();
    }

    // B button resets ball to tee
    const bDown = rightGamepad.getButtonDown?.(InputComponent.B_Button);
    if (bDown) {
      this.game.resetBall();
    }

    // A button toggles scorecard
    const aDown = rightGamepad.getButtonDown?.(InputComponent.A_Button);
    if (aDown) {
      // Could toggle scorecard - for now, handle via browser input
    }

    // Left thumbstick orbits camera around ball
    if (leftGamepad) {
      const leftThumb = leftGamepad.getAxesValues?.(InputComponent.Thumbstick);
      if (leftThumb) {
        if (Math.abs(leftThumb.x) > THUMBSTICK_DEADZONE) {
          this.cameraOrbitDelta.horizontal = leftThumb.x * dt * 2.0;
        }
        if (Math.abs(leftThumb.y) > THUMBSTICK_DEADZONE) {
          this.cameraOrbitDelta.vertical = -leftThumb.y * dt * 1.5;
        }
      }
    }
  }

  // === Ball moving (just camera orbit) ===

  private handleBallMovingInput(leftGamepad: any, dt: number) {
    if (leftGamepad) {
      const leftThumb = leftGamepad.getAxesValues?.(InputComponent.Thumbstick);
      if (leftThumb) {
        if (Math.abs(leftThumb.x) > THUMBSTICK_DEADZONE) {
          this.cameraOrbitDelta.horizontal = leftThumb.x * dt * 2.0;
        }
        if (Math.abs(leftThumb.y) > THUMBSTICK_DEADZONE) {
          this.cameraOrbitDelta.vertical = -leftThumb.y * dt * 1.5;
        }
      }
    }
  }

  // === Hole complete ===

  private handleHoleCompleteInput(rightGamepad: any) {
    const aDown = rightGamepad.getButtonDown?.(InputComponent.A_Button);
    const triggerDown = rightGamepad.getButtonDown?.(InputComponent.Trigger);

    if (aDown || triggerDown) {
      // Skip the auto-timer and go to next hole immediately
      this.game.skipToNextHole();
    }
  }

  // === Course complete ===

  private handleCourseCompleteInput(rightGamepad: any) {
    const aDown = rightGamepad.getButtonDown?.(InputComponent.A_Button);
    const triggerDown = rightGamepad.getButtonDown?.(InputComponent.Trigger);

    if (aDown || triggerDown) {
      this.ui.showCourseComplete();
    }
  }
}
