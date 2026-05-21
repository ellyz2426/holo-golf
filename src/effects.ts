/**
 * Holo Golf VR — Effects Manager (Round 3 Overhaul)
 * Visual effects: hole-in-one celebration, under-par sparkle, transitions,
 * stroke limit, course-specific particle palettes.
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
  TorusGeometry,
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

interface PulsingOrb {
  mesh: Mesh;
  life: number;
  maxLife: number;
  baseScale: number;
  pulseRate: number;
}

// Course-specific particle palettes
const COURSE_PALETTES = [
  [0x00ffff, 0x44ff88, 0x0088ff, 0x88aaff], // Neon Circuit
  [0xff44aa, 0x8844ff, 0xaa66ff, 0xff88cc], // Quantum Field
  [0xff6600, 0xffaa00, 0xff4400, 0xffcc44], // Cosmic Abyss
];

export class EffectsManager {
  private world: World;
  private particles: Particle[] = [];
  private rings: ExpandingRing[] = [];
  private orbs: PulsingOrb[] = [];
  private effectsGroup: Group;
  private transitionTimer = 0;
  private currentCourseIndex = 0;

  constructor(world: World) {
    this.world = world;
    this.effectsGroup = new Group();
    world.scene.add(this.effectsGroup);
  }

  setCourseIndex(index: number) {
    this.currentCourseIndex = index;
  }

  private getPalette(): number[] {
    return COURSE_PALETTES[this.currentCourseIndex] || COURSE_PALETTES[0];
  }

  holeInOneEffect(pos: Vector3) {
    // Massive particle burst + expanding rings + column of light + orbiting torus
    this.spawnParticleBurst(pos, 100, [0xffff00, 0xff8800, 0x00ffff, 0xff44aa, 0xffffff], 4.0);

    // Multiple expanding rings
    for (let i = 0; i < 6; i++) {
      this.spawnExpandingRing(
        pos.clone().add(new Vector3(0, 0.1 + i * 0.12, 0)),
        [0xffff00, 0xff8800, 0x00ffff, 0xffffff][i % 4],
        2.0 + i * 0.2,
      );
    }

    // Light column
    this.spawnLightColumn(pos, 0xffff00, 3.5);
    this.spawnLightColumn(pos.clone().add(new Vector3(0, 0, 0)), 0xffffff, 2.5);

    // Pulsing celebration orb
    this.spawnPulsingOrb(pos.clone().add(new Vector3(0, 0.5, 0)), 0xffff00, 3.0, 0.2);
  }

  underParEffect(pos: Vector3) {
    const palette = this.getPalette();
    this.spawnParticleBurst(pos, 50, [...palette, 0xffffff], 2.5);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.1, 0)), palette[0], 1.5);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.2, 0)), palette[1], 1.0);
    this.spawnPulsingOrb(pos.clone().add(new Vector3(0, 0.3, 0)), palette[0], 2.0, 0.15);
  }

  holeCompleteEffect(pos: Vector3) {
    const palette = this.getPalette();
    this.spawnParticleBurst(pos, 25, palette, 1.5);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.1, 0)), palette[2], 1.0);
  }

  holeTransition() {
    this.transitionTimer = 0.8;
  }

  teleportEffect(pos: Vector3) {
    this.spawnParticleBurst(pos, 40, [0x8844ff, 0xaa66ff, 0xcc88ff, 0x4422cc, 0xffffff], 2.0);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.05, 0)), 0x8844ff, 1.2);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.15, 0)), 0xaa66ff, 0.8);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.25, 0)), 0xcc88ff, 0.6);
  }

  strokeLimitEffect(pos: Vector3) {
    // Subdued red/orange "failed" effect
    this.spawnParticleBurst(pos, 15, [0xff2200, 0xff4400, 0xff6600], 1.5);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.1, 0)), 0xff4400, 1.0);
  }

  splashEffect(pos: Vector3) {
    // Water splash — blue/cyan particles bursting upward
    this.spawnParticleBurst(pos, 35, [0x0044ff, 0x0088ff, 0x44aaff, 0x88ccff, 0xffffff], 2.0);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.02, 0)), 0x0066ff, 1.2);
    this.spawnExpandingRing(pos.clone().add(new Vector3(0, 0.05, 0)), 0x44aaff, 0.8);
  }

  // Spawn a short-lived pulsing orb for celebration
  private spawnPulsingOrb(pos: Vector3, color: number, duration: number, size: number) {
    const geo = new SphereGeometry(size, 16, 16);
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(pos);
    this.effectsGroup.add(mesh);
    this.orbs.push({ mesh, life: duration, maxLife: duration, baseScale: 1, pulseRate: 8 });
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
        p.mesh.geometry.dispose();
        (p.mesh.material as MeshBasicMaterial).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
      p.velocity.y -= 3 * dt;

      const t = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = t;
      const scale = 0.3 + t * 0.7;
      p.mesh.scale.setScalar(scale);
    }

    // Update rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;

      if (r.life <= 0) {
        this.effectsGroup.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as MeshBasicMaterial).dispose();
        this.rings.splice(i, 1);
        continue;
      }

      const scale = r.mesh.scale.x + r.speed * dt;
      r.mesh.scale.setScalar(scale);
      (r.mesh.material as MeshBasicMaterial).opacity *= 0.97;
    }

    // Update pulsing orbs
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i];
      o.life -= dt;

      if (o.life <= 0) {
        this.effectsGroup.remove(o.mesh);
        o.mesh.geometry.dispose();
        (o.mesh.material as MeshBasicMaterial).dispose();
        this.orbs.splice(i, 1);
        continue;
      }

      const t = o.life / o.maxLife;
      const pulse = 1 + Math.sin(performance.now() * 0.001 * o.pulseRate) * 0.3;
      o.mesh.scale.setScalar(o.baseScale * pulse * (0.5 + t * 0.5));
      (o.mesh.material as MeshBasicMaterial).opacity = t * 0.5;
      o.mesh.position.y += dt * 0.3; // float upward
    }

    // Transition
    if (this.transitionTimer > 0) {
      this.transitionTimer -= dt;
    }
  }
}
