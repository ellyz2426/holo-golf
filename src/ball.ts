/**
 * Holo Golf VR — Ball Controller
 * Custom physics for the golf ball: velocity, friction, slope, walls, hole capture.
 */
import {
  World,
  Vector3,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Group,
  Color,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  AdditiveBlending,
  PointLight,
  RingGeometry,
  DoubleSide,
} from "@iwsdk/core";
import { AudioManager } from "./audio";

const BALL_RADIUS = 0.025;
const FRICTION = 0.97;
const SLOPE_FORCE = 4.0;
const MIN_VELOCITY = 0.005;
const MAX_VELOCITY = 12.0;
const WALL_BOUNCE = 0.65;
const GRAVITY = -9.8;

export class BallController {
  position = new Vector3(0, 0.05, 0);
  velocity = new Vector3(0, 0, 0);
  isActive = false;
  private mesh: Mesh;
  private glowMesh: Mesh;
  private trailGroup: Group;
  private light: PointLight;
  private world: World;
  private audio: AudioManager;
  private sinking = false;
  private sinkTarget = new Vector3();
  private sinkTimer = 0;
  private trailPositions: Vector3[] = [];
  private trailMeshes: Mesh[] = [];
  private bounceCount = 0;
  private onFloor = true;
  private floorY = 0.05;
  private stopped = true;

  constructor(world: World, audio: AudioManager) {
    this.world = world;
    this.audio = audio;

    // Main ball mesh — glowing cyan sphere
    const ballGeo = new SphereGeometry(BALL_RADIUS, 16, 16);
    const ballMat = new MeshStandardMaterial({
      color: new Color(0x00ffff),
      emissive: new Color(0x00aaaa),
      emissiveIntensity: 1.5,
      metalness: 0.3,
      roughness: 0.1,
    });
    this.mesh = new Mesh(ballGeo, ballMat);

    // Wireframe glow
    const edgesGeo = new EdgesGeometry(ballGeo);
    this.glowMesh = new Mesh(); // placeholder
    const wireframe = new LineSegments(
      edgesGeo,
      new LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 }),
    );
    this.mesh.add(wireframe);

    // Outer glow
    const glowGeo = new SphereGeometry(BALL_RADIUS * 1.6, 12, 12);
    const glowMat = new MeshBasicMaterial({
      color: new Color(0x00ffff),
      transparent: true,
      opacity: 0.15,
      blending: AdditiveBlending,
    });
    this.glowMesh = new Mesh(glowGeo, glowMat);
    this.mesh.add(this.glowMesh);

    // Ground ring indicator
    const ringGeo = new RingGeometry(BALL_RADIUS * 1.5, BALL_RADIUS * 2.5, 24);
    const ringMat = new MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -BALL_RADIUS + 0.001;
    this.mesh.add(ring);

    // Point light
    this.light = new PointLight(0x00ffff, 0.8, 3);
    this.mesh.add(this.light);

    // Trail group
    this.trailGroup = new Group();
    world.scene.add(this.trailGroup);

    world.scene.add(this.mesh);
    this.mesh.visible = false;
  }

  reset(pos: Vector3) {
    this.position.copy(pos);
    this.position.y = pos.y + BALL_RADIUS;
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;
    this.isActive = true;
    this.sinking = false;
    this.stopped = true;
    this.bounceCount = 0;
    this.floorY = pos.y + BALL_RADIUS;
    this.clearTrail();
  }

  hit(direction: Vector3, power: number) {
    if (!this.isActive || this.sinking) return;
    const force = direction.clone().normalize().multiplyScalar(power);
    force.y = Math.max(force.y, power * 0.05); // tiny upward lift
    this.velocity.copy(force);
    this.stopped = false;
    this.bounceCount = 0;
  }

  sinkIntoHole(holePos: Vector3) {
    this.sinking = true;
    this.sinkTarget.copy(holePos);
    this.sinkTarget.y -= 0.1;
    this.sinkTimer = 0;
    this.velocity.set(0, 0, 0);
  }

  isStopped(): boolean {
    return this.stopped && !this.sinking;
  }

  update(dt: number) {
    if (!this.isActive) return;

    if (this.sinking) {
      this.sinkTimer += dt;
      const t = Math.min(this.sinkTimer / 0.5, 1);
      this.position.lerp(this.sinkTarget, t * 0.15);
      const scale = 1 - t * 0.8;
      this.mesh.scale.setScalar(Math.max(scale, 0.01));
      this.mesh.position.copy(this.position);
      if (t >= 1) {
        this.mesh.visible = false;
        this.isActive = false;
      }
      return;
    }

    if (this.stopped) {
      this.mesh.position.copy(this.position);
      return;
    }

    // Apply friction
    this.velocity.x *= FRICTION;
    this.velocity.z *= FRICTION;

    // Gravity
    if (!this.onFloor) {
      this.velocity.y += GRAVITY * dt;
    }

    // Clamp velocity
    const speed = this.velocity.length();
    if (speed > MAX_VELOCITY) {
      this.velocity.normalize().multiplyScalar(MAX_VELOCITY);
    }

    // Move ball
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Floor collision
    if (this.position.y <= this.floorY) {
      this.position.y = this.floorY;
      if (this.velocity.y < -0.3) {
        this.velocity.y *= -WALL_BOUNCE * 0.5;
        this.bounceCount++;
        if (this.bounceCount > 3) {
          this.velocity.y = 0;
        }
        this.audio.playBounce(Math.abs(this.velocity.y));
      } else {
        this.velocity.y = 0;
      }
      this.onFloor = true;
    } else {
      this.onFloor = false;
    }

    // Wall collisions — check against current hole walls
    this.checkWallCollisions();

    // Check if ball fell off course
    if (this.position.y < -5) {
      // Reset to last valid position or tee
      this.velocity.set(0, 0, 0);
      this.stopped = true;
    }

    // Stop check
    if (speed < MIN_VELOCITY && this.onFloor) {
      this.velocity.set(0, 0, 0);
      this.stopped = true;
    }

    // Update mesh
    this.mesh.position.copy(this.position);

    // Glow pulse
    const pulse = 0.12 + Math.sin(performance.now() * 0.004) * 0.05;
    (this.glowMesh.material as MeshBasicMaterial).opacity = pulse;
    this.light.intensity = 0.5 + speed * 0.3;

    // Update trail
    this.updateTrail();
  }

  private checkWallCollisions() {
    // Wall collision is handled by CourseManager providing wall segments
    // The ball checks against registered wall planes
    const walls = (this.world as any).__holoGolfWalls as Array<{
      normal: Vector3;
      point: Vector3;
      min: Vector3;
      max: Vector3;
    }>;
    if (!walls) return;

    for (const wall of walls) {
      const dist = this.position.clone().sub(wall.point).dot(wall.normal);
      if (dist < BALL_RADIUS) {
        // Check bounds
        const p = this.position;
        if (
          p.x >= wall.min.x - BALL_RADIUS &&
          p.x <= wall.max.x + BALL_RADIUS &&
          p.y >= wall.min.y - BALL_RADIUS &&
          p.y <= wall.max.y + BALL_RADIUS &&
          p.z >= wall.min.z - BALL_RADIUS &&
          p.z <= wall.max.z + BALL_RADIUS
        ) {
          // Push ball out
          this.position.add(wall.normal.clone().multiplyScalar(BALL_RADIUS - dist));

          // Reflect velocity
          const dot = this.velocity.dot(wall.normal);
          if (dot < 0) {
            this.velocity.sub(wall.normal.clone().multiplyScalar(2 * dot));
            this.velocity.multiplyScalar(WALL_BOUNCE);
            this.audio.playWallBounce(this.velocity.length());
          }
        }
      }
    }
  }

  private updateTrail() {
    if (this.stopped) return;
    const speed = this.velocity.length();
    if (speed < 0.1) return;

    this.trailPositions.push(this.position.clone());
    if (this.trailPositions.length > 40) {
      this.trailPositions.shift();
    }

    // Rebuild trail visualization
    this.trailMeshes.forEach((m) => {
      m.visible = false;
      this.trailGroup.remove(m);
    });
    this.trailMeshes = [];

    for (let i = 0; i < this.trailPositions.length; i++) {
      const t = i / this.trailPositions.length;
      const size = BALL_RADIUS * 0.5 * t;
      const geo = new SphereGeometry(size, 4, 4);
      const mat = new MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: t * 0.4,
        blending: AdditiveBlending,
      });
      const dot = new Mesh(geo, mat);
      dot.position.copy(this.trailPositions[i]);
      this.trailGroup.add(dot);
      this.trailMeshes.push(dot);
    }
  }

  private clearTrail() {
    this.trailPositions = [];
    this.trailMeshes.forEach((m) => this.trailGroup.remove(m));
    this.trailMeshes = [];
  }
}
