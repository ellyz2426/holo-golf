/**
 * Holo Golf VR — Effects Manager
 * Visual effects: hole-in-one celebration, under-par sparkle, transitions.
 */
import {
  World,
  Vector3,
  Group,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  RingGeometry,
  DoubleSide,
  CylinderGeometry,
  PointLight,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from "@iwsdk/core";

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
}

interface ExpandingRing {
  mesh: Mesh;
  life: number;
  speed: number;
}

export class EffectsManager {
  private world: World;
  private particles: Particle[] = [];
  private rings: ExpandingRing[] = [];
  private effectsGroup: Group;
  private transitionOverlay: Mesh | null = null;
  private transitionTimer = 0;

  constructor(world: World) {
    this.world = world;
    this.effectsGroup = new Group();
    world.scene.add(this.effectsGroup);
  }

  holeInOneEffect(pos: Vector3) {
    // Massive particle burst + expanding rings + column of light
    this.spawnParticleBurst(pos, 80, [0xffff00, 0xff8800, 0x00ffff, 0xff44aa], 4.0);

    // Multiple expanding rings
    for (let i = 0; i < 5; i++) {
      this.spawnExpandingRing(
        pos.clone().add(new Vector3(0, 0.1 + i * 0.15, 0)),
        [0xffff00, 0xff8800, 0x00ffff][i % 3],
        1.5 + i * 0.3,
      );
    }

    // Light column
    this.spawnLightColumn(pos, 0xffff00, 3.0);
  }

  underParEffect(pos: Vector3) {
    this.spawnParticleBurst(pos, 40, [0x00ffff, 0x44ff88, 0x88aaff], 2.5);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.1, 0)), 0x00ffff, 1.5);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.2, 0)), 0x44ff88, 1.0);
  }

  holeCompleteEffect(pos: Vector3) {
    this.spawnParticleBurst(pos, 20, [0x00ffff, 0x4488ff], 1.5);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.1, 0)), 0x0088ff, 1.0);
  }

  holeTransition() {
    this.transitionTimer = 0.8;
  }

  teleportEffect(pos: Vector3) {
    this.spawnParticleBurst(pos, 30, [0x8844ff, 0xaa66ff, 0xcc88ff, 0x4422cc], 2.0);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.05, 0)), 0x8844ff, 1.0);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.15, 0)), 0xaa66ff, 0.8);
  }

  private spawnParticleBurst(
    center: Vector3,
    count: number,
    colors: number[],
    maxLife: number,
  ) {
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 0.01 + Math.random() * 0.025;
      const geo = new SphereGeometry(size, 4, 4);
      const mat = new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1.0,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.copy(center);

      const velocity = new Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 3,
      );

      const life = maxLife * (0.5 + Math.random() * 0.5);
      this.particles.push({ mesh, velocity, life, maxLife: life });
      this.effectsGroup.add(mesh);
    }
  }

  private spawnExpandingRing(pos: Vector3, color: number, duration: number) {
    const geo = new RingGeometry(0.01, 0.03, 32);
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.rotation.x = -Math.PI / 2;
    this.effectsGroup.add(mesh);
    this.rings.push({ mesh, life: duration, speed: 2.0 });
  }

  private spawnLightColumn(pos: Vector3, color: number, duration: number) {
    const geo = new CylinderGeometry(0.02, 0.15, 5, 8);
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 2.5;
    this.effectsGroup.add(mesh);

    // Treat as particle for lifecycle
    this.particles.push({
      mesh,
      velocity: new Vector3(0, 0, 0),
      life: duration,
      maxLife: duration,
    });
  }

  update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.effectsGroup.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Move
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
      p.velocity.y -= 3 * dt; // gravity

      // Fade
      const t = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = t;

      // Scale down
      const scale = 0.3 + t * 0.7;
      p.mesh.scale.setScalar(scale);
    }

    // Update rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;

      if (r.life <= 0) {
        this.effectsGroup.remove(r.mesh);
        this.rings.splice(i, 1);
        continue;
      }

      // Expand
      const scale = r.mesh.scale.x + r.speed * dt;
      r.mesh.scale.setScalar(scale);

      // Fade
      (r.mesh.material as MeshBasicMaterial).opacity *= 0.97;
    }

    // Transition
    if (this.transitionTimer > 0) {
      this.transitionTimer -= dt;
    }
  }
}
