/**
 * Holo Golf VR — Wind Indicator Overlay (Round 6)
 * Visual HUD element that shows wind direction and strength
 * when the ball is near or inside a wind zone.
 */
import {
  World,
  Vector3,
  Group,
  Mesh,
  ConeGeometry,
  CylinderGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  Color,
  RingGeometry,
  DoubleSide,
} from "@iwsdk/core";

export class WindIndicator {
  private world: World;
  private group: Group;
  private arrowBody: Mesh;
  private arrowHead: Mesh;
  private rings: Mesh[] = [];
  private streamParticles: Mesh[] = [];

  private active = false;
  private currentDirection = new Vector3();
  private currentForce = 0;
  private animTime = 0;

  // Position indicator above the ball
  private ballRef: { position: Vector3 } | null = null;

  constructor(world: World) {
    this.world = world;
    this.group = new Group();

    // Arrow shaft
    const shaftGeo = new CylinderGeometry(0.008, 0.008, 0.2, 6);
    const shaftMat = new MeshBasicMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
    });
    this.arrowBody = new Mesh(shaftGeo, shaftMat);
    this.arrowBody.rotation.z = Math.PI / 2;
    this.group.add(this.arrowBody);

    // Arrow head
    const headGeo = new ConeGeometry(0.025, 0.06, 6);
    const headMat = new MeshBasicMaterial({
      color: 0x44ccff,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
    });
    this.arrowHead = new Mesh(headGeo, headMat);
    this.arrowHead.rotation.z = -Math.PI / 2;
    this.arrowHead.position.x = 0.13;
    this.group.add(this.arrowHead);

    // Concentric wind rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new RingGeometry(0.06 + i * 0.04, 0.065 + i * 0.04, 16);
      const ringMat = new MeshBasicMaterial({
        color: 0x44aaff,
        transparent: true,
        opacity: 0.2 - i * 0.05,
        side: DoubleSide,
        blending: AdditiveBlending,
      });
      const ring = new Mesh(ringGeo, ringMat);
      ring.rotation.y = Math.PI / 2;
      this.rings.push(ring);
      this.group.add(ring);
    }

    // Stream particles (small dots that flow in wind direction)
    for (let i = 0; i < 8; i++) {
      const dotGeo = new CylinderGeometry(0.004, 0.004, 0.015, 4);
      const dotMat = new MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.4,
        blending: AdditiveBlending,
      });
      const dot = new Mesh(dotGeo, dotMat);
      dot.rotation.z = Math.PI / 2;
      this.streamParticles.push(dot);
      this.group.add(dot);
    }

    this.group.visible = false;
    world.scene.add(this.group);
  }

  setBall(ball: { position: Vector3 }) {
    this.ballRef = ball;
  }

  /** Show wind indicator with direction and force */
  show(direction: Vector3, force: number) {
    if (force < 0.01) {
      this.hide();
      return;
    }
    this.active = true;
    this.currentDirection.copy(direction).normalize();
    this.currentForce = force;
    this.group.visible = true;
  }

  hide() {
    this.active = false;
    this.group.visible = false;
  }

  update(dt: number) {
    if (!this.active || !this.ballRef) return;

    this.animTime += dt;

    // Position above the ball
    this.group.position.set(
      this.ballRef.position.x,
      this.ballRef.position.y + 0.25,
      this.ballRef.position.z,
    );

    // Rotate to face wind direction (on XZ plane)
    const angle = Math.atan2(this.currentDirection.x, this.currentDirection.z);
    this.group.rotation.y = angle;

    // Scale arrow based on force
    const scale = 0.5 + Math.min(this.currentForce * 0.3, 1.5);
    this.arrowBody.scale.x = scale;
    this.arrowHead.position.x = 0.1 * scale + 0.03;

    // Pulse opacity based on force
    const pulse = 0.4 + Math.sin(this.animTime * 4) * 0.15;
    (this.arrowBody.material as MeshBasicMaterial).opacity = pulse * Math.min(this.currentForce * 0.5, 1);
    (this.arrowHead.material as MeshBasicMaterial).opacity = (pulse + 0.2) * Math.min(this.currentForce * 0.5, 1);

    // Animate rings expanding outward
    for (let i = 0; i < this.rings.length; i++) {
      const t = (this.animTime * 1.5 + i * 0.4) % 1.5;
      const ringScale = 0.5 + t * 0.8;
      this.rings[i].scale.setScalar(ringScale);
      (this.rings[i].material as MeshBasicMaterial).opacity = Math.max(0, 0.2 * (1 - t / 1.5));
    }

    // Animate stream particles flowing in wind direction
    for (let i = 0; i < this.streamParticles.length; i++) {
      const phase = (this.animTime * 2 + i * 0.3) % 1.5;
      const offset = phase * 0.3;
      const spread = (i % 3 - 1) * 0.04;
      this.streamParticles[i].position.set(
        offset - 0.15,
        spread + Math.sin(this.animTime * 3 + i) * 0.01,
        spread * 0.5,
      );
      (this.streamParticles[i].material as MeshBasicMaterial).opacity =
        0.3 * (1 - phase / 1.5) * Math.min(this.currentForce * 0.4, 1);
    }
  }
}
