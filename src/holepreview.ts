/**
 * Holo Golf VR — Hole Preview Camera (Round 6)
 * Smooth camera flythrough from tee to hole before play begins.
 * Shows the hole layout and obstacles before the player takes their first shot.
 */
import { Vector3 } from "@iwsdk/core";

export interface HolePreviewTarget {
  teePosition: Vector3;
  holePosition: Vector3;
}

export class HolePreviewCamera {
  private active = false;
  private timer = 0;
  private duration = 2.5; // seconds for flythrough
  private startPos = new Vector3();
  private endPos = new Vector3();
  private midPos = new Vector3();
  private lookTarget = new Vector3();

  // Callback for when preview completes
  onComplete: (() => void) | null = null;

  // Camera position/lookAt output for the main camera system
  cameraPosition = new Vector3();
  cameraLookAt = new Vector3();

  /** Start a preview flythrough for a hole */
  start(hole: HolePreviewTarget) {
    const tee = hole.teePosition;
    const cup = hole.holePosition;

    // Camera starts above the tee, flies to above the hole, then settles behind the tee
    this.startPos.set(cup.x, cup.y + 3, cup.z + 1.5);
    this.midPos.set(
      (tee.x + cup.x) / 2,
      Math.max(tee.y, cup.y) + 4,
      (tee.z + cup.z) / 2 + 2,
    );
    this.endPos.set(tee.x, tee.y + 2.5, tee.z + 4);
    this.lookTarget.set(
      (tee.x + cup.x) / 2,
      (tee.y + cup.y) / 2,
      (tee.z + cup.z) / 2,
    );

    this.timer = 0;
    this.active = true;
    this.cameraPosition.copy(this.startPos);
    this.cameraLookAt.copy(this.lookTarget);
  }

  /** Skip the preview */
  skip() {
    if (!this.active) return;
    this.active = false;
    if (this.onComplete) this.onComplete();
  }

  isActive(): boolean {
    return this.active;
  }

  update(dt: number): boolean {
    if (!this.active) return false;

    this.timer += dt;
    const t = Math.min(this.timer / this.duration, 1);

    // Smooth easing (ease-in-out cubic)
    const ease = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Quadratic bezier curve: start → mid → end
    const u = 1 - ease;
    this.cameraPosition.set(
      u * u * this.startPos.x + 2 * u * ease * this.midPos.x + ease * ease * this.endPos.x,
      u * u * this.startPos.y + 2 * u * ease * this.midPos.y + ease * ease * this.endPos.y,
      u * u * this.startPos.z + 2 * u * ease * this.midPos.z + ease * ease * this.endPos.z,
    );

    // Look target transitions from hole to tee
    this.cameraLookAt.lerpVectors(this.lookTarget, this.endPos.clone().setY(this.endPos.y - 2), ease * 0.5);

    if (t >= 1) {
      this.active = false;
      if (this.onComplete) this.onComplete();
    }

    return true;
  }
}
