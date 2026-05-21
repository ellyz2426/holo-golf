/**
 * Holo Golf VR — Putter Controller
 * XR: Putter follows right controller, swing detects putt.
 * Browser: Click-and-drag power/direction mechanic.
 */
import {
  World,
  Vector3,
  Mesh,
  CylinderGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Group,
  Color,
  BoxGeometry,
  SphereGeometry,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Line,
} from "@iwsdk/core";
import { BallController } from "./ball";
import { AudioManager } from "./audio";

const SHAFT_LENGTH = 0.9;
const HEAD_SIZE = 0.06;
const SWING_THRESHOLD = 0.8;
const MAX_POWER = 10.0;
const BROWSER_POWER_SCALE = 0.06;

export class PutterController {
  private world: World;
  private ball: BallController;
  private audio: AudioManager;
  private group: Group;
  private headMesh: Mesh;
  private shaftMesh: Mesh;
  private active = false;

  // XR swing tracking
  private prevControllerPos = new Vector3();
  private controllerVelocity = new Vector3();
  private isSwinging = false;
  private swingCooldown = 0;

  // Browser aiming
  aimDirection = new Vector3(0, 0, -1);
  aimPower = 0;
  isAiming = false;
  private aimLine: Line;
  private aimDots: Mesh[] = [];
  private aimGroup: Group;
  private dragStart = new Vector3();

  constructor(world: World, ball: BallController, audio: AudioManager) {
    this.world = world;
    this.ball = ball;
    this.audio = audio;

    this.group = new Group();

    // Shaft — thin glowing cylinder
    const shaftGeo = new CylinderGeometry(0.006, 0.008, SHAFT_LENGTH, 8);
    const shaftMat = new MeshStandardMaterial({
      color: new Color(0x8844ff),
      emissive: new Color(0x6622cc),
      emissiveIntensity: 0.8,
      metalness: 0.7,
      roughness: 0.2,
    });
    this.shaftMesh = new Mesh(shaftGeo, shaftMat);
    this.shaftMesh.position.y = SHAFT_LENGTH / 2;
    this.group.add(this.shaftMesh);

    // Head — flat rectangular head
    const headGeo = new BoxGeometry(HEAD_SIZE, 0.03, HEAD_SIZE * 1.8);
    const headMat = new MeshStandardMaterial({
      color: new Color(0xaa66ff),
      emissive: new Color(0x8844dd),
      emissiveIntensity: 1.0,
      metalness: 0.8,
      roughness: 0.1,
    });
    this.headMesh = new Mesh(headGeo, headMat);
    this.headMesh.position.y = 0;
    this.headMesh.position.z = HEAD_SIZE * 0.5;
    this.group.add(this.headMesh);

    // Wireframe edges on head
    const headEdges = new EdgesGeometry(headGeo);
    const edgeMat = new LineBasicMaterial({ color: 0xcc88ff, transparent: true, opacity: 0.8 });
    const wireHead = new LineSegments(headEdges, edgeMat);
    this.headMesh.add(wireHead);

    // Aim line (browser mode)
    const lineGeo = new BufferGeometry();
    const positions = new Float32Array(2 * 3);
    lineGeo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    this.aimLine = new Line(
      lineGeo,
      new LineBasicMaterial({
        color: 0xff4488,
        transparent: true,
        opacity: 0.7,
      }),
    );
    this.aimLine.visible = false;

    this.aimGroup = new Group();
    world.scene.add(this.aimGroup);
    world.scene.add(this.aimLine);
    world.scene.add(this.group);
    this.group.visible = false;
  }

  setActive(active: boolean) {
    this.active = active;
    this.group.visible = active;
    if (!active) {
      this.hideAim();
    }
  }

  // === Browser aiming ===

  startAim(mouseX: number, mouseY: number) {
    if (!this.active || !this.ball.isActive) return;
    this.isAiming = true;
    this.dragStart.set(mouseX, 0, mouseY);
    this.aimPower = 0;
  }

  updateAim(mouseX: number, mouseY: number) {
    if (!this.isAiming) return;

    const dx = mouseX - this.dragStart.x;
    const dy = mouseY - this.dragStart.z;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.aimPower = Math.min(dist * BROWSER_POWER_SCALE, MAX_POWER);

    // Direction is opposite to drag (pull back = hit forward)
    if (dist > 1) {
      this.aimDirection.set(-dx / dist, 0, -dy / dist).normalize();
    }

    this.showAim();
  }

  releaseAim() {
    if (!this.isAiming) return;
    this.isAiming = false;

    if (this.aimPower > 0.1) {
      this.ball.hit(this.aimDirection.clone(), this.aimPower);
      this.audio.playSwing(this.aimPower / MAX_POWER);
    }

    this.hideAim();
    this.aimPower = 0;
  }

  private showAim() {
    if (!this.ball.isActive) return;

    const ballPos = this.ball.position.clone();
    ballPos.y = this.ball.position.y;

    // Direction line
    const lineEnd = ballPos.clone().add(this.aimDirection.clone().multiplyScalar(this.aimPower * 0.3));
    const posAttr = this.aimLine.geometry.getAttribute("position");
    (posAttr.array as Float32Array)[0] = ballPos.x;
    (posAttr.array as Float32Array)[1] = ballPos.y;
    (posAttr.array as Float32Array)[2] = ballPos.z;
    (posAttr.array as Float32Array)[3] = lineEnd.x;
    (posAttr.array as Float32Array)[4] = lineEnd.y;
    (posAttr.array as Float32Array)[5] = lineEnd.z;
    posAttr.needsUpdate = true;
    this.aimLine.visible = true;

    // Power dots
    this.aimDots.forEach((d) => this.aimGroup.remove(d));
    this.aimDots = [];

    const numDots = Math.ceil(this.aimPower * 2);
    for (let i = 0; i < numDots && i < 20; i++) {
      const t = (i + 1) / (numDots + 1);
      const dotPos = ballPos.clone().add(this.aimDirection.clone().multiplyScalar(t * this.aimPower * 0.3));
      const geo = new SphereGeometry(0.008, 6, 6);
      const mat = new MeshBasicMaterial({
        color: new Color().lerpColors(new Color(0x00ffff), new Color(0xff4488), t),
        transparent: true,
        opacity: 0.8 - t * 0.4,
        blending: AdditiveBlending,
      });
      const dot = new Mesh(geo, mat);
      dot.position.copy(dotPos);
      this.aimGroup.add(dot);
      this.aimDots.push(dot);
    }
  }

  private hideAim() {
    this.aimLine.visible = false;
    this.aimDots.forEach((d) => this.aimGroup.remove(d));
    this.aimDots = [];
  }

  // === XR Swing ===

  updateXR(controllerPos: Vector3, controllerQuat: any) {
    if (!this.active || this.swingCooldown > 0) return;

    // Track controller velocity
    this.controllerVelocity.copy(controllerPos).sub(this.prevControllerPos);
    this.prevControllerPos.copy(controllerPos);

    // Position putter at controller
    this.group.position.copy(controllerPos);
    this.group.position.y -= SHAFT_LENGTH;
    if (controllerQuat) {
      this.group.quaternion.copy(controllerQuat);
    }

    // Detect swing
    const speed = this.controllerVelocity.length() * 60; // per second
    if (speed > SWING_THRESHOLD) {
      // Check if putter head is near ball
      const headWorldPos = new Vector3();
      this.headMesh.getWorldPosition(headWorldPos);
      const dist = headWorldPos.distanceTo(this.ball.position);

      if (dist < 0.2) {
        const power = Math.min(speed * 3, MAX_POWER);
        const dir = this.controllerVelocity.clone().normalize();
        dir.y = 0;
        dir.normalize();
        this.ball.hit(dir, power);
        this.audio.playSwing(power / MAX_POWER);
        this.swingCooldown = 0.5;
      }
    }
  }

  update(dt: number, world: World) {
    if (this.swingCooldown > 0) {
      this.swingCooldown -= dt;
    }

    if (!this.active) return;

    // In browser mode, position putter near ball
    if (!this.isAiming) {
      const ballPos = this.ball.position;
      this.group.position.set(ballPos.x + 0.15, ballPos.y + SHAFT_LENGTH * 0.5, ballPos.z);
      this.group.rotation.set(0, 0, -0.15);
    }

    // Putter glow pulse
    const pulse = 0.8 + Math.sin(performance.now() * 0.003) * 0.2;
    (this.headMesh.material as MeshStandardMaterial).emissiveIntensity = pulse;
  }
}
