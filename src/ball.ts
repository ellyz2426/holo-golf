/**
 * Holo Golf VR — Ball Controller
 * Custom physics for the golf ball: velocity, friction, slope, walls,
 * bumper/obstacle collision, hole capture, and trail effects.
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
const BUMPER_BOUNCE = 1.8;
const GRAVITY = -9.8;

export interface BumperCollider {
  position: Vector3;
  radius: number;
  mesh?: any;
}

export interface ObstacleCollider {
  type: "windmill_arm" | "moving_wall";
  mesh: any;
  getWorldBounds: () => { min: Vector3; max: Vector3; normal: Vector3 };
}

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
  private trailPool: Mesh[] = [];
  private trailActiveCount = 0;
  private bounceCount = 0;
  private onFloor = true;
  private floorY = 0.05;
  private stopped = true;

  // Shadow
  private shadow: Mesh;

  // Out-of-bounds callback
  onOutOfBounds: (() => void) | null = null;

  // Wall/bumper bounce callback for camera shake
  onBounce: ((intensity: number) => void) | null = null;

  // Special zone effects
  private windForce = new Vector3();
  private frictionOverride: number | null = null;

  // Course-themed trail colors
  private trailColor1 = new Color(0x00ffff);
  private trailColor2 = new Color(0xff4488);

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

    // Shadow (projected on ground)
    const shadowGeo = new SphereGeometry(BALL_RADIUS * 2.5, 12, 1);
    const shadowMat = new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25,
    });
    this.shadow = new Mesh(shadowGeo, shadowMat);
    this.shadow.scale.set(1, 0.02, 1);
    world.scene.add(this.shadow);
    this.shadow.visible = false;

    // Trail group + pre-allocated pool
    this.trailGroup = new Group();
    world.scene.add(this.trailGroup);
    this.initTrailPool(50);

    world.scene.add(this.mesh);
    this.mesh.visible = false;
  }

  reset(pos: Vector3) {
    this.position.copy(pos);
    this.position.y = pos.y + BALL_RADIUS;
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;
    this.mesh.scale.setScalar(1);
    this.isActive = true;
    this.sinking = false;
    this.stopped = true;
    this.bounceCount = 0;
    this.floorY = pos.y + BALL_RADIUS;
    this.windForce.set(0, 0, 0);
    this.frictionOverride = null;
    this.clearTrail();

    // Update shadow
    this.shadow.visible = true;
    this.shadow.position.set(pos.x, pos.y + 0.002, pos.z);
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
    this.shadow.visible = false;
  }

  isStopped(): boolean {
    return this.stopped && !this.sinking;
  }

  setWindForce(force: Vector3) {
    this.windForce.copy(force);
  }

  setFrictionOverride(friction: number | null) {
    this.frictionOverride = friction;
  }

  setCourseTheme(courseIndex: number) {
    const themes = [
      { c1: 0x00ffff, c2: 0xff4488 },  // Neon Circuit
      { c1: 0xff44aa, c2: 0x8844ff },  // Quantum Field
      { c1: 0xff6600, c2: 0xffaa00 },  // Cosmic Abyss
    ];
    const theme = themes[courseIndex] || themes[0];
    this.trailColor1.set(theme.c1);
    this.trailColor2.set(theme.c2);
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

    // Apply friction (use override if in special zone)
    const fric = this.frictionOverride ?? FRICTION;
    this.velocity.x *= fric;
    this.velocity.z *= fric;

    // Apply wind force
    if (this.windForce.lengthSq() > 0) {
      this.velocity.add(this.windForce.clone().multiplyScalar(dt));
    }

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

    // Wall collisions
    this.checkWallCollisions();

    // Bumper collisions
    this.checkBumperCollisions();

    // Check if ball fell off course (OOB)
    if (this.position.y < -3) {
      this.velocity.set(0, 0, 0);
      this.stopped = true;
      if (this.onOutOfBounds) {
        this.onOutOfBounds();
        return;
      }
    }

    // Stop check
    if (speed < MIN_VELOCITY && this.onFloor) {
      this.velocity.set(0, 0, 0);
      this.stopped = true;
    }

    // Update mesh
    this.mesh.position.copy(this.position);

    // Ball rotation (spin proportional to velocity)
    if (speed > 0.01) {
      const rotSpeed = speed * 4;
      this.mesh.rotation.x += this.velocity.z * dt * rotSpeed;
      this.mesh.rotation.z -= this.velocity.x * dt * rotSpeed;
    }

    // Update shadow
    this.shadow.position.set(this.position.x, this.floorY - BALL_RADIUS + 0.003, this.position.z);
    const shadowHeight = Math.max(0, this.position.y - (this.floorY - BALL_RADIUS));
    const shadowScale = Math.max(0.3, 1 - shadowHeight * 0.5);
    this.shadow.scale.set(shadowScale, 0.02, shadowScale);
    (this.shadow.material as MeshBasicMaterial).opacity = Math.max(0.05, 0.25 - shadowHeight * 0.1);

    // Glow pulse — more intense at higher speeds
    const basePulse = 0.12 + Math.sin(performance.now() * 0.004) * 0.05;
    const speedGlow = Math.min(speed * 0.04, 0.2);
    (this.glowMesh.material as MeshBasicMaterial).opacity = basePulse + speedGlow;
    this.light.intensity = 0.5 + speed * 0.5;
    this.light.color.set(speed > 3 ? 0x44ffff : 0x00ffff);

    // Update trail (optimized pool)
    this.updateTrail();
  }

  private checkWallCollisions() {
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
        const p = this.position;
        if (
          p.x >= wall.min.x - BALL_RADIUS &&
          p.x <= wall.max.x + BALL_RADIUS &&
          p.y >= wall.min.y - BALL_RADIUS &&
          p.y <= wall.max.y + BALL_RADIUS &&
          p.z >= wall.min.z - BALL_RADIUS &&
          p.z <= wall.max.z + BALL_RADIUS
        ) {
          this.position.add(wall.normal.clone().multiplyScalar(BALL_RADIUS - dist));
          const dot = this.velocity.dot(wall.normal);
          if (dot < 0) {
            this.velocity.sub(wall.normal.clone().multiplyScalar(2 * dot));
            this.velocity.multiplyScalar(WALL_BOUNCE);
            this.audio.playWallBounce(this.velocity.length());
            if (this.onBounce) this.onBounce(Math.min(this.velocity.length() * 0.1, 0.3));
          }
        }
      }
    }
  }

  private checkBumperCollisions() {
    const bumpers = (this.world as any).__holoGolfBumpers as BumperCollider[] | undefined;
    if (!bumpers) return;

    for (const bumper of bumpers) {
      const dx = this.position.x - bumper.position.x;
      const dz = this.position.z - bumper.position.z;
      const dist2D = Math.sqrt(dx * dx + dz * dz);
      const minDist = BALL_RADIUS + bumper.radius;

      if (dist2D < minDist && Math.abs(this.position.y - bumper.position.y) < 0.15) {
        // Push ball out
        if (dist2D > 0.001) {
          const nx = dx / dist2D;
          const nz = dz / dist2D;
          this.position.x = bumper.position.x + nx * minDist;
          this.position.z = bumper.position.z + nz * minDist;

          // Reflect and boost velocity
          const normal = new Vector3(nx, 0, nz);
          const dot = this.velocity.dot(normal);
          if (dot < 0) {
            this.velocity.sub(normal.multiplyScalar(2 * dot));
            this.velocity.multiplyScalar(BUMPER_BOUNCE);
            // Clamp after boost
            if (this.velocity.length() > MAX_VELOCITY) {
              this.velocity.normalize().multiplyScalar(MAX_VELOCITY);
            }
            this.audio.playBumperHit(this.velocity.length());
            if (this.onBounce) this.onBounce(Math.min(this.velocity.length() * 0.15, 0.5));
          }
        }
      }
    }
  }

  // === Trail system (object pool) ===

  private initTrailPool(count: number) {
    const geo = new SphereGeometry(BALL_RADIUS * 0.5, 4, 4);
    for (let i = 0; i < count; i++) {
      const mat = new MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
      });
      const dot = new Mesh(geo, mat);
      dot.visible = false;
      this.trailGroup.add(dot);
      this.trailPool.push(dot);
    }
  }

  private updateTrail() {
    if (this.stopped) {
      // Fade out existing trail
      for (let i = 0; i < this.trailActiveCount; i++) {
        const dot = this.trailPool[i];
        const mat = dot.material as MeshBasicMaterial;
        mat.opacity *= 0.9;
        if (mat.opacity < 0.01) {
          dot.visible = false;
        }
      }
      return;
    }

    const speed = this.velocity.length();
    if (speed < 0.1) return;

    // Add current position
    this.trailPositions.push(this.position.clone());
    if (this.trailPositions.length > this.trailPool.length) {
      this.trailPositions.shift();
    }

    // Update pool meshes
    this.trailActiveCount = this.trailPositions.length;
    for (let i = 0; i < this.trailPool.length; i++) {
      const dot = this.trailPool[i];
      if (i < this.trailPositions.length) {
        const t = i / this.trailPositions.length;
        dot.position.copy(this.trailPositions[i]);
        dot.scale.setScalar(t);
        const mat = dot.material as MeshBasicMaterial;
        mat.opacity = t * 0.4;
        mat.color.lerpColors(this.trailColor1, this.trailColor2, t);
        dot.visible = true;
      } else {
        dot.visible = false;
      }
    }
  }

  private clearTrail() {
    this.trailPositions = [];
    this.trailActiveCount = 0;
    for (const dot of this.trailPool) {
      dot.visible = false;
    }
  }
}
