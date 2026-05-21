/**
 * Holo Golf VR — Course Manager
 * Defines hole layouts and builds geometry. Each hole is a neon wireframe platform.
 * Now supports bumper collision, teleporters, wind zones, and ice surfaces.
 */
import {
  World,
  Vector3,
  Group,
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  Color,
  DoubleSide,
  AdditiveBlending,
  RingGeometry,
  TorusGeometry,
  SphereGeometry,
  PointLight,
  Float32BufferAttribute,
  BufferGeometry,
  Line,
} from "@iwsdk/core";
import { QUANTUM_FIELD_COURSE } from "./course2";
import { COSMIC_ABYSS_COURSE } from "./course3";
import type { BumperCollider } from "./ball";
import {
  createTeleportPad,
  createWindZone,
  createIceSurface,
  TeleportPad,
  WindZone,
  IceSurface,
} from "./specialobstacles";
import {
  createWaterHazard,
  updateWaterHazard,
  isInWaterHazard,
  WaterHazard,
} from "./waterhazard";

export interface WallDef {
  normal: Vector3;
  point: Vector3;
  min: Vector3;
  max: Vector3;
}

export interface HoleData {
  index: number;
  name: string;
  par: number;
  teePosition: Vector3;
  holePosition: Vector3;
  surfaces: SurfaceDef[];
  walls: WallSegment[];
  obstacles: ObstacleDef[];
  decorations: DecorationDef[];
  specialObstacles?: SpecialObstacleDef[];
}

export interface SurfaceDef {
  position: Vector3;
  size: [number, number, number]; // width, height(thickness), depth
  color?: number;
  slope?: { axis: "x" | "z"; angle: number };
}

export interface WallSegment {
  position: Vector3;
  size: [number, number, number];
  color?: number;
}

export interface ObstacleDef {
  type: "windmill" | "bumper" | "spinner" | "moving_wall" | "ramp";
  position: Vector3;
  params: Record<string, any>;
}

export interface SpecialObstacleDef {
  type: "teleporter" | "wind_zone" | "ice_surface" | "water_hazard";
  position: Vector3;
  params: Record<string, any>;
}

export interface DecorationDef {
  type: "pillar" | "ring" | "orb" | "arrow";
  position: Vector3;
  params?: Record<string, any>;
}

export interface CourseData {
  name: string;
  description: string;
  holes: HoleData[];
  themeColor: number;
}

export class CourseManager {
  private world: World;
  private holeGroup: Group;
  private obstacleAnims: Array<{ mesh: any; update: (dt: number) => void }> = [];

  // Special obstacle state
  teleporters: TeleportPad[] = [];
  windZones: WindZone[] = [];
  iceSurfaces: IceSurface[] = [];
  waterHazards: WaterHazard[] = [];

  constructor(world: World) {
    this.world = world;
    this.holeGroup = new Group();
    world.scene.add(this.holeGroup);
  }

  getCourse(index: number): CourseData {
    return COURSES[Math.min(index, COURSES.length - 1)];
  }

  getCourseCount(): number {
    return COURSES.length;
  }

  clearCurrentHole() {
    while (this.holeGroup.children.length > 0) {
      this.holeGroup.remove(this.holeGroup.children[0]);
    }
    this.obstacleAnims = [];
    (this.world as any).__holoGolfWalls = [];
    (this.world as any).__holoGolfBumpers = [];
    this.teleporters = [];
    this.windZones = [];
    this.iceSurfaces = [];
    this.waterHazards = [];
  }

  buildHole(hole: HoleData) {
    const walls: WallDef[] = [];
    const bumpers: BumperCollider[] = [];

    // Build surfaces (floor panels)
    for (const surf of hole.surfaces) {
      const panel = this.createPanel(surf);
      this.holeGroup.add(panel);
    }

    // Build walls
    for (const wallSeg of hole.walls) {
      const { mesh, wallDef } = this.createWall(wallSeg);
      this.holeGroup.add(mesh);
      walls.push(wallDef);
    }

    // Build obstacles
    for (const obs of hole.obstacles) {
      const { mesh, update, bumperCollider } = this.createObstacle(obs);
      this.holeGroup.add(mesh);
      if (update) {
        this.obstacleAnims.push({ mesh, update });
      }
      if (bumperCollider) {
        bumpers.push(bumperCollider);
      }
    }

    // Build special obstacles
    if (hole.specialObstacles) {
      for (const special of hole.specialObstacles) {
        this.buildSpecialObstacle(special);
      }
    }

    // Build decorations
    for (const dec of hole.decorations) {
      const mesh = this.createDecoration(dec);
      this.holeGroup.add(mesh);
    }

    // Tee marker
    this.holeGroup.add(this.createTeeMarker(hole.teePosition));

    // Hole cup
    this.holeGroup.add(this.createHoleCup(hole.holePosition));

    // Register colliders
    (this.world as any).__holoGolfWalls = walls;
    (this.world as any).__holoGolfBumpers = bumpers;
  }

  private buildSpecialObstacle(special: SpecialObstacleDef) {
    switch (special.type) {
      case "teleporter": {
        const target = special.params.target as Vector3;
        const pad = createTeleportPad(special.position, target, special.params.color);
        this.holeGroup.add(pad.group);
        this.teleporters.push(pad);
        break;
      }
      case "wind_zone": {
        const dir = special.params.direction as Vector3;
        const force = special.params.force || 2;
        const size = special.params.size as Vector3 || new Vector3(1, 0.5, 1);
        const zone = createWindZone(special.position, dir, force, size);
        this.holeGroup.add(zone.group);
        this.windZones.push(zone);
        break;
      }
      case "ice_surface": {
        const size = special.params.size as Vector3 || new Vector3(1, 0.01, 1);
        const ice = createIceSurface(special.position, size);
        this.holeGroup.add(ice.group);
        this.iceSurfaces.push(ice);
        break;
      }
      case "water_hazard": {
        const wSize = special.params.size as Vector3 || new Vector3(0.5, 0.01, 0.5);
        const wColor = special.params.color || 0x0044aa;
        const water = createWaterHazard(special.position, wSize, wColor);
        this.holeGroup.add(water.group);
        this.waterHazards.push(water);
        break;
      }
    }
  }

  updateObstacles(dt: number) {
    for (const anim of this.obstacleAnims) {
      anim.update(dt);
    }

    // Animate teleporter pads
    for (const tp of this.teleporters) {
      if (tp.cooldown > 0) {
        tp.cooldown -= dt;
        if (tp.cooldown <= 0) tp.active = true;
      }
      // Rotate orbiting particles
      const children = tp.group.children;
      for (let i = 2; i < 6 && i < children.length; i++) {
        const child = children[i];
        const angle = performance.now() * 0.002 + (i - 2) * Math.PI * 0.5;
        child.position.x = Math.cos(angle) * 0.1;
        child.position.z = Math.sin(angle) * 0.1;
      }
    }

    // Animate water hazards
    for (const water of this.waterHazards) {
      updateWaterHazard(water, dt);
    }
  }

  // Check special zone interactions with ball
  checkBallZones(ballPos: Vector3, ballVelocity: Vector3): {
    teleported: boolean;
    teleportTarget?: Vector3;
    windForce: Vector3;
    frictionOverride: number | null;
    inWater: boolean;
  } {
    let teleported = false;
    let teleportTarget: Vector3 | undefined;
    const windForce = new Vector3();
    let frictionOverride: number | null = null;
    let inWater = false;

    // Check teleporters
    for (const tp of this.teleporters) {
      if (!tp.active) continue;
      const dist = ballPos.distanceTo(tp.position);
      if (dist < tp.radius) {
        teleported = true;
        teleportTarget = tp.targetPosition.clone();
        tp.active = false;
        tp.cooldown = 1.5;
        break;
      }
    }

    // Check wind zones
    for (const wz of this.windZones) {
      const dx = Math.abs(ballPos.x - wz.position.x);
      const dz = Math.abs(ballPos.z - wz.position.z);
      if (dx < wz.size.x / 2 && dz < wz.size.z / 2) {
        windForce.add(wz.direction.clone().multiplyScalar(wz.force));
      }
    }

    // Check ice surfaces
    for (const ice of this.iceSurfaces) {
      const dx = Math.abs(ballPos.x - ice.position.x);
      const dz = Math.abs(ballPos.z - ice.position.z);
      if (dx < ice.size.x / 2 && dz < ice.size.z / 2) {
        frictionOverride = ice.friction;
      }
    }

    // Check water hazards
    for (const water of this.waterHazards) {
      if (isInWaterHazard(water, ballPos)) {
        inWater = true;
        break;
      }
    }

    return { teleported, teleportTarget, windForce, frictionOverride, inWater };
  }

  private createPanel(surf: SurfaceDef): Group {
    const group = new Group();
    const [w, h, d] = surf.size;
    const color = surf.color || 0x004466;

    const geo = new BoxGeometry(w, h, d);
    const mat = new MeshStandardMaterial({
      color: new Color(color),
      emissive: new Color(color).multiplyScalar(0.3),
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new Mesh(geo, mat);

    const edges = new EdgesGeometry(geo);
    const edgeMat = new LineBasicMaterial({
      color: new Color(color).multiplyScalar(2),
      transparent: true,
      opacity: 0.9,
    });
    const wire = new LineSegments(edges, edgeMat);
    mesh.add(wire);

    mesh.position.copy(surf.position);

    if (surf.slope) {
      if (surf.slope.axis === "x") {
        mesh.rotation.z = surf.slope.angle;
      } else {
        mesh.rotation.x = surf.slope.angle;
      }
    }

    group.add(mesh);
    return group;
  }

  private createWall(wallSeg: WallSegment): { mesh: Group; wallDef: WallDef } {
    const group = new Group();
    const [w, h, d] = wallSeg.size;
    const color = wallSeg.color || 0x0088aa;

    const geo = new BoxGeometry(w, h, d);
    const mat = new MeshStandardMaterial({
      color: new Color(color),
      emissive: new Color(color).multiplyScalar(0.4),
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.6,
    });
    const mesh = new Mesh(geo, mat);

    const edges = new EdgesGeometry(geo);
    const edgeMat = new LineBasicMaterial({ color: 0x00ddff, transparent: true, opacity: 0.9 });
    mesh.add(new LineSegments(edges, edgeMat));

    mesh.position.copy(wallSeg.position);
    group.add(mesh);

    let normal: Vector3;
    if (w < d) {
      normal = new Vector3(1, 0, 0);
    } else {
      normal = new Vector3(0, 0, 1);
    }

    const wallDef: WallDef = {
      normal,
      point: wallSeg.position.clone(),
      min: new Vector3(
        wallSeg.position.x - w / 2,
        wallSeg.position.y - h / 2,
        wallSeg.position.z - d / 2,
      ),
      max: new Vector3(
        wallSeg.position.x + w / 2,
        wallSeg.position.y + h / 2,
        wallSeg.position.z + d / 2,
      ),
    };

    return { mesh: group, wallDef };
  }

  private createObstacle(obs: ObstacleDef): {
    mesh: Group;
    update?: (dt: number) => void;
    bumperCollider?: BumperCollider;
  } {
    const group = new Group();
    group.position.copy(obs.position);

    switch (obs.type) {
      case "windmill": {
        const armGeo = new BoxGeometry(obs.params.length || 1.0, 0.04, 0.06);
        const armMat = new MeshStandardMaterial({
          color: 0xff4488,
          emissive: new Color(0xff2266),
          emissiveIntensity: 0.8,
        });
        const arm = new Mesh(armGeo, armMat);
        arm.position.y = 0.08;
        const armEdges = new LineSegments(
          new EdgesGeometry(armGeo),
          new LineBasicMaterial({ color: 0xff88aa }),
        );
        arm.add(armEdges);

        const postGeo = new CylinderGeometry(0.03, 0.03, 0.2, 8);
        const postMat = new MeshStandardMaterial({
          color: 0xff4488,
          emissive: new Color(0xff2266),
          emissiveIntensity: 0.6,
        });
        const post = new Mesh(postGeo, postMat);
        post.position.y = 0.1;

        group.add(post);
        group.add(arm);

        const speed = obs.params.speed || 1.5;
        let angle = 0;
        return {
          mesh: group,
          update: (dt: number) => {
            angle += speed * dt;
            arm.rotation.y = angle;
          },
        };
      }

      case "bumper": {
        const radius = obs.params.radius || 0.1;
        const bGeo = new CylinderGeometry(radius, radius, 0.12, 16);
        const bMat = new MeshStandardMaterial({
          color: 0xffaa00,
          emissive: new Color(0xff8800),
          emissiveIntensity: 1.0,
        });
        const bumper = new Mesh(bGeo, bMat);
        bumper.position.y = 0.06;
        const bEdges = new LineSegments(
          new EdgesGeometry(bGeo),
          new LineBasicMaterial({ color: 0xffcc44 }),
        );
        bumper.add(bEdges);
        group.add(bumper);

        const pulseSpeed = 3;
        return {
          mesh: group,
          update: (dt: number) => {
            const s = 1 + Math.sin(performance.now() * 0.005 * pulseSpeed) * 0.08;
            bumper.scale.set(s, 1, s);
          },
          bumperCollider: {
            position: obs.position.clone(),
            radius,
            mesh: bumper,
          },
        };
      }

      case "spinner": {
        const ringGeo = new TorusGeometry(obs.params.radius || 0.3, 0.02, 8, 24);
        const ringMat = new MeshStandardMaterial({
          color: 0x44ff88,
          emissive: new Color(0x22cc66),
          emissiveIntensity: 0.8,
        });
        const ring = new Mesh(ringGeo, ringMat);
        ring.position.y = 0.1;
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const speed = obs.params.speed || 2;
        return {
          mesh: group,
          update: (dt: number) => {
            ring.rotation.z += speed * dt;
          },
        };
      }

      case "moving_wall": {
        const mwGeo = new BoxGeometry(
          obs.params.width || 0.3,
          obs.params.height || 0.15,
          0.04,
        );
        const mwMat = new MeshStandardMaterial({
          color: 0xff6644,
          emissive: new Color(0xcc4422),
          emissiveIntensity: 0.7,
        });
        const mw = new Mesh(mwGeo, mwMat);
        const mwEdges = new LineSegments(
          new EdgesGeometry(mwGeo),
          new LineBasicMaterial({ color: 0xff8866 }),
        );
        mw.add(mwEdges);
        group.add(mw);

        const range = obs.params.range || 0.5;
        const speed = obs.params.speed || 1.0;
        const axis = obs.params.axis || "x";
        let t = 0;
        return {
          mesh: group,
          update: (dt: number) => {
            t += speed * dt;
            if (axis === "x") {
              mw.position.x = Math.sin(t) * range;
            } else {
              mw.position.z = Math.sin(t) * range;
            }
          },
        };
      }

      case "ramp": {
        const rGeo = new BoxGeometry(obs.params.width || 0.4, 0.02, obs.params.depth || 0.3);
        const rMat = new MeshStandardMaterial({
          color: 0x4488ff,
          emissive: new Color(0x2266dd),
          emissiveIntensity: 0.6,
        });
        const ramp = new Mesh(rGeo, rMat);
        ramp.rotation.x = -(obs.params.angle || 0.2);
        const rEdges = new LineSegments(
          new EdgesGeometry(rGeo),
          new LineBasicMaterial({ color: 0x66aaff }),
        );
        ramp.add(rEdges);
        group.add(ramp);
        return { mesh: group };
      }
    }

    return { mesh: group };
  }

  private createDecoration(dec: DecorationDef): Group {
    const group = new Group();
    group.position.copy(dec.position);

    switch (dec.type) {
      case "pillar": {
        const h = dec.params?.height || 1.0;
        const pGeo = new CylinderGeometry(0.03, 0.03, h, 6);
        const pMat = new MeshStandardMaterial({
          color: 0x004466,
          emissive: new Color(0x003355),
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.7,
        });
        const pillar = new Mesh(pGeo, pMat);
        pillar.position.y = h / 2;
        const pEdges = new LineSegments(
          new EdgesGeometry(pGeo),
          new LineBasicMaterial({ color: 0x0088cc, transparent: true, opacity: 0.8 }),
        );
        pillar.add(pEdges);
        group.add(pillar);

        const orbGeo = new SphereGeometry(0.04, 8, 8);
        const orbMat = new MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.6,
          blending: AdditiveBlending,
        });
        const orb = new Mesh(orbGeo, orbMat);
        orb.position.y = h + 0.04;
        group.add(orb);
        break;
      }

      case "ring": {
        const r = dec.params?.radius || 0.3;
        const rGeo = new TorusGeometry(r, 0.01, 6, 24);
        const rMat = new MeshBasicMaterial({
          color: dec.params?.color || 0x00ffff,
          transparent: true,
          opacity: 0.4,
          blending: AdditiveBlending,
        });
        const ring = new Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        break;
      }

      case "orb": {
        const oGeo = new SphereGeometry(dec.params?.radius || 0.06, 12, 12);
        const oMat = new MeshBasicMaterial({
          color: dec.params?.color || 0x00ffff,
          transparent: true,
          opacity: 0.5,
          blending: AdditiveBlending,
        });
        group.add(new Mesh(oGeo, oMat));
        break;
      }

      case "arrow": {
        const arrowGeo = new BufferGeometry();
        const verts = new Float32Array([
          0, 0.01, -0.1, -0.04, 0.01, 0.05, 0.04, 0.01, 0.05,
        ]);
        arrowGeo.setAttribute("position", new Float32BufferAttribute(verts, 3));
        const arrowMat = new MeshBasicMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.6,
          side: DoubleSide,
          blending: AdditiveBlending,
        });
        const arrow = new Mesh(arrowGeo, arrowMat);
        if (dec.params?.rotation) {
          arrow.rotation.y = dec.params.rotation;
        }
        group.add(arrow);
        break;
      }
    }

    return group;
  }

  private createTeeMarker(pos: Vector3): Group {
    const group = new Group();
    group.position.copy(pos);

    const padGeo = new CylinderGeometry(0.08, 0.08, 0.005, 16);
    const padMat = new MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
    });
    const pad = new Mesh(padGeo, padMat);
    group.add(pad);

    const ringGeo = new RingGeometry(0.07, 0.09, 24);
    const ringMat = new MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    group.add(ring);

    return group;
  }

  private createHoleCup(pos: Vector3): Group {
    const group = new Group();
    group.position.copy(pos);

    const cupGeo = new CylinderGeometry(0.06, 0.06, 0.08, 16);
    const cupMat = new MeshStandardMaterial({
      color: 0x001122,
      emissive: new Color(0x000811),
      emissiveIntensity: 0.3,
    });
    const cup = new Mesh(cupGeo, cupMat);
    cup.position.y = -0.04;
    group.add(cup);

    const rimGeo = new TorusGeometry(0.06, 0.008, 8, 24);
    const rimMat = new MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
    });
    const rim = new Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    const beaconGeo = new CylinderGeometry(0.002, 0.002, 0.8, 4);
    const beaconMat = new MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
    });
    const beacon = new Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.4;
    group.add(beacon);

    const light = new PointLight(0xffff00, 0.5, 2);
    light.position.y = 0.1;
    group.add(light);

    const poleGeo = new CylinderGeometry(0.004, 0.004, 0.5, 6);
    const poleMat = new MeshStandardMaterial({
      color: 0xffffff,
      emissive: new Color(0x888888),
      emissiveIntensity: 0.5,
    });
    const pole = new Mesh(poleGeo, poleMat);
    pole.position.y = 0.25;
    pole.position.x = 0.04;
    group.add(pole);

    const flagGeo = new PlaneGeometry(0.08, 0.05);
    const flagMat = new MeshBasicMaterial({
      color: 0xff4488,
      transparent: true,
      opacity: 0.8,
      side: DoubleSide,
    });
    const flag = new Mesh(flagGeo, flagMat);
    flag.position.set(0.08, 0.48, 0);
    group.add(flag);

    return group;
  }
}

// ============================================================
// COURSE DEFINITIONS
// ============================================================

const COURSES: CourseData[] = [
  {
    name: "Neon Circuit",
    description: "9 holes of holographic mini golf through a neon data-stream",
    themeColor: 0x00ffff,
    holes: [
      {
        index: 0,
        name: "Straight Line",
        par: 2,
        teePosition: new Vector3(0, 0, 2),
        holePosition: new Vector3(0, 0, -2),
        surfaces: [
          { position: new Vector3(0, -0.025, 0), size: [0.6, 0.05, 5] },
        ],
        walls: [
          { position: new Vector3(-0.32, 0.05, 0), size: [0.04, 0.15, 5] },
          { position: new Vector3(0.32, 0.05, 0), size: [0.04, 0.15, 5] },
        ],
        obstacles: [],
        decorations: [
          { type: "pillar", position: new Vector3(-0.5, 0, 2), params: { height: 0.6 } },
          { type: "pillar", position: new Vector3(0.5, 0, 2), params: { height: 0.6 } },
          { type: "arrow", position: new Vector3(0, 0, 1), params: { rotation: Math.PI } },
          { type: "arrow", position: new Vector3(0, 0, 0), params: { rotation: Math.PI } },
        ],
      },
      {
        index: 1,
        name: "The Bend",
        par: 3,
        teePosition: new Vector3(0, 0, 2),
        holePosition: new Vector3(2, 0, -1.5),
        surfaces: [
          { position: new Vector3(0, -0.025, 1), size: [0.6, 0.05, 3] },
          { position: new Vector3(0.7, -0.025, -0.5), size: [2, 0.05, 0.6] },
          { position: new Vector3(2, -0.025, -1.2), size: [0.6, 0.05, 1.2] },
        ],
        walls: [
          { position: new Vector3(-0.32, 0.05, 1), size: [0.04, 0.15, 3] },
          { position: new Vector3(0.32, 0.05, 1.5), size: [0.04, 0.15, 2] },
          { position: new Vector3(0.32, 0.05, -0.25), size: [0.04, 0.15, 0.6], color: 0x0088aa },
          { position: new Vector3(0.7, 0.05, -0.78), size: [2, 0.15, 0.04] },
          { position: new Vector3(0.7, 0.05, -0.22), size: [1.0, 0.15, 0.04] },
          { position: new Vector3(2.32, 0.05, -1.2), size: [0.04, 0.15, 1.2] },
          { position: new Vector3(1.68, 0.05, -1.2), size: [0.04, 0.15, 1.2] },
        ],
        obstacles: [],
        decorations: [
          { type: "arrow", position: new Vector3(0, 0, 0.5), params: { rotation: Math.PI } },
          { type: "arrow", position: new Vector3(0.5, 0, -0.5), params: { rotation: -Math.PI / 2 } },
          { type: "pillar", position: new Vector3(-0.5, 0, 2.5), params: { height: 0.8 } },
        ],
      },
      {
        index: 2,
        name: "Windmill Alley",
        par: 3,
        teePosition: new Vector3(0, 0, 3),
        holePosition: new Vector3(0, 0, -2),
        surfaces: [
          { position: new Vector3(0, -0.025, 0.5), size: [0.8, 0.05, 6] },
        ],
        walls: [
          { position: new Vector3(-0.42, 0.05, 0.5), size: [0.04, 0.15, 6] },
          { position: new Vector3(0.42, 0.05, 0.5), size: [0.04, 0.15, 6] },
        ],
        obstacles: [
          { type: "windmill", position: new Vector3(0, 0, 0.5), params: { length: 0.7, speed: 2.0 } },
        ],
        decorations: [
          { type: "ring", position: new Vector3(0, 0.5, 0.5), params: { radius: 0.3, color: 0xff4488 } },
          { type: "pillar", position: new Vector3(-0.6, 0, 3), params: { height: 0.5 } },
          { type: "pillar", position: new Vector3(0.6, 0, 3), params: { height: 0.5 } },
        ],
      },
      {
        index: 3,
        name: "Bumper Run",
        par: 3,
        teePosition: new Vector3(0, 0, 3),
        holePosition: new Vector3(0, 0, -2.5),
        surfaces: [
          { position: new Vector3(0, -0.025, 0.25), size: [1.2, 0.05, 6.5] },
        ],
        walls: [
          { position: new Vector3(-0.62, 0.05, 0.25), size: [0.04, 0.15, 6.5] },
          { position: new Vector3(0.62, 0.05, 0.25), size: [0.04, 0.15, 6.5] },
        ],
        obstacles: [
          { type: "bumper", position: new Vector3(-0.25, 0, 1.5), params: { radius: 0.12 } },
          { type: "bumper", position: new Vector3(0.25, 0, 0.5), params: { radius: 0.12 } },
          { type: "bumper", position: new Vector3(-0.15, 0, -0.5), params: { radius: 0.1 } },
          { type: "bumper", position: new Vector3(0.3, 0, -1.5), params: { radius: 0.1 } },
        ],
        decorations: [
          { type: "orb", position: new Vector3(-0.25, 0.3, 1.5), params: { color: 0xffaa00 } },
          { type: "orb", position: new Vector3(0.25, 0.3, 0.5), params: { color: 0xffaa00 } },
        ],
      },
      {
        index: 4,
        name: "The S-Curve",
        par: 3,
        teePosition: new Vector3(-0.8, 0, 2.5),
        holePosition: new Vector3(0.8, 0, -2.5),
        surfaces: [
          { position: new Vector3(-0.8, -0.025, 2), size: [0.6, 0.05, 1.5] },
          { position: new Vector3(0, -0.025, 1), size: [2.2, 0.05, 0.6] },
          { position: new Vector3(0.8, -0.025, 0), size: [0.6, 0.05, 1.5] },
          { position: new Vector3(0, -0.025, -1), size: [2.2, 0.05, 0.6] },
          { position: new Vector3(-0.8, -0.025, -1.75), size: [0.6, 0.05, 1] },
          { position: new Vector3(0, -0.025, -2.25), size: [2.2, 0.05, 0.6] },
          { position: new Vector3(0.8, -0.025, -2.5), size: [0.6, 0.05, 0.6] },
        ],
        walls: [
          { position: new Vector3(-1.12, 0.05, 2), size: [0.04, 0.15, 1.5] },
          { position: new Vector3(-0.48, 0.05, 2), size: [0.04, 0.15, 1.5] },
          { position: new Vector3(1.12, 0.05, 0), size: [0.04, 0.15, 1.5] },
          { position: new Vector3(0.48, 0.05, 0), size: [0.04, 0.15, 1.5] },
        ],
        obstacles: [],
        specialObstacles: [
          { type: "water_hazard", position: new Vector3(0, -0.03, 0), params: { size: new Vector3(0.5, 0.01, 0.5) } },
        ],
        decorations: [
          { type: "arrow", position: new Vector3(-0.8, 0, 1.5), params: { rotation: Math.PI } },
          { type: "arrow", position: new Vector3(0.3, 0, 1), params: { rotation: -Math.PI / 2 } },
          { type: "arrow", position: new Vector3(0.8, 0, 0), params: { rotation: Math.PI } },
        ],
      },
      {
        index: 5,
        name: "Gauntlet",
        par: 4,
        teePosition: new Vector3(0, 0, 3),
        holePosition: new Vector3(0, 0, -3),
        surfaces: [
          { position: new Vector3(0, -0.025, 0), size: [0.8, 0.05, 7] },
        ],
        walls: [
          { position: new Vector3(-0.42, 0.05, 0), size: [0.04, 0.15, 7] },
          { position: new Vector3(0.42, 0.05, 0), size: [0.04, 0.15, 7] },
        ],
        obstacles: [
          { type: "moving_wall", position: new Vector3(0, 0, 1.5), params: { width: 0.5, height: 0.12, range: 0.3, speed: 1.5, axis: "x" } },
          { type: "moving_wall", position: new Vector3(0, 0, 0), params: { width: 0.5, height: 0.12, range: 0.3, speed: 2.0, axis: "x" } },
          { type: "moving_wall", position: new Vector3(0, 0, -1.5), params: { width: 0.5, height: 0.12, range: 0.3, speed: 1.0, axis: "x" } },
        ],
        decorations: [
          { type: "pillar", position: new Vector3(-0.6, 0, 3.5), params: { height: 1.0 } },
          { type: "pillar", position: new Vector3(0.6, 0, 3.5), params: { height: 1.0 } },
          { type: "pillar", position: new Vector3(-0.6, 0, -3.5), params: { height: 1.0 } },
          { type: "pillar", position: new Vector3(0.6, 0, -3.5), params: { height: 1.0 } },
        ],
      },
      {
        index: 6,
        name: "Ramp Shot",
        par: 3,
        teePosition: new Vector3(0, 0, 2.5),
        holePosition: new Vector3(0, 0.3, -2),
        surfaces: [
          { position: new Vector3(0, -0.025, 1.5), size: [0.7, 0.05, 2.5] },
          { position: new Vector3(0, 0.15, 0), size: [0.7, 0.05, 0.8], slope: { axis: "z", angle: -0.25 } },
          { position: new Vector3(0, 0.275, -1.2), size: [0.7, 0.05, 2] },
        ],
        walls: [
          { position: new Vector3(-0.37, 0.15, 0.5), size: [0.04, 0.3, 5] },
          { position: new Vector3(0.37, 0.15, 0.5), size: [0.04, 0.3, 5] },
        ],
        obstacles: [],
        decorations: [
          { type: "ring", position: new Vector3(0, 0.6, -2), params: { radius: 0.25, color: 0xffff00 } },
          { type: "pillar", position: new Vector3(-0.55, 0, 2.5), params: { height: 0.8 } },
          { type: "pillar", position: new Vector3(0.55, 0, 2.5), params: { height: 0.8 } },
        ],
      },
      {
        index: 7,
        name: "Spinner's Lair",
        par: 4,
        teePosition: new Vector3(0, 0, 3),
        holePosition: new Vector3(0, 0, -3),
        surfaces: [
          { position: new Vector3(0, -0.025, 0), size: [1.0, 0.05, 7.5] },
        ],
        walls: [
          { position: new Vector3(-0.52, 0.05, 0), size: [0.04, 0.15, 7.5] },
          { position: new Vector3(0.52, 0.05, 0), size: [0.04, 0.15, 7.5] },
        ],
        obstacles: [
          { type: "windmill", position: new Vector3(-0.2, 0, 1.5), params: { length: 0.4, speed: 1.5 } },
          { type: "windmill", position: new Vector3(0.2, 0, 0), params: { length: 0.4, speed: -2.0 } },
          { type: "windmill", position: new Vector3(0, 0, -1.5), params: { length: 0.5, speed: 1.0 } },
          { type: "bumper", position: new Vector3(-0.3, 0, -2.2), params: { radius: 0.08 } },
          { type: "bumper", position: new Vector3(0.3, 0, -2.2), params: { radius: 0.08 } },
        ],
        decorations: [
          { type: "ring", position: new Vector3(0, 0.4, 1.5), params: { radius: 0.2, color: 0x44ff88 } },
          { type: "ring", position: new Vector3(0, 0.4, 0), params: { radius: 0.2, color: 0x44ff88 } },
          { type: "ring", position: new Vector3(0, 0.4, -1.5), params: { radius: 0.2, color: 0x44ff88 } },
        ],
      },
      {
        index: 8,
        name: "Grand Finale",
        par: 5,
        teePosition: new Vector3(0, 0, 4),
        holePosition: new Vector3(0, 0.3, -4),
        surfaces: [
          { position: new Vector3(0, -0.025, 3), size: [0.8, 0.05, 2.5] },
          { position: new Vector3(0, -0.025, 1), size: [1.2, 0.05, 1] },
          { position: new Vector3(0, -0.025, -0.5), size: [0.6, 0.05, 2] },
          { position: new Vector3(0, 0.15, -2), size: [0.8, 0.05, 1], slope: { axis: "z", angle: -0.2 } },
          { position: new Vector3(0, 0.275, -3.5), size: [0.8, 0.05, 2] },
        ],
        walls: [
          { position: new Vector3(-0.42, 0.15, 1), size: [0.04, 0.3, 7.5] },
          { position: new Vector3(0.42, 0.15, 1), size: [0.04, 0.3, 7.5] },
          { position: new Vector3(-0.62, 0.05, 1), size: [0.04, 0.15, 1] },
          { position: new Vector3(0.62, 0.05, 1), size: [0.04, 0.15, 1] },
        ],
        obstacles: [
          { type: "windmill", position: new Vector3(0, 0, 2), params: { length: 0.6, speed: 1.5 } },
          { type: "bumper", position: new Vector3(-0.2, 0, 0.5), params: { radius: 0.1 } },
          { type: "bumper", position: new Vector3(0.2, 0, 0.5), params: { radius: 0.1 } },
          { type: "moving_wall", position: new Vector3(0, 0, -0.5), params: { width: 0.4, height: 0.12, range: 0.2, speed: 1.5, axis: "x" } },
        ],
        decorations: [
          { type: "pillar", position: new Vector3(-0.6, 0, 4.5), params: { height: 1.2 } },
          { type: "pillar", position: new Vector3(0.6, 0, 4.5), params: { height: 1.2 } },
          { type: "ring", position: new Vector3(0, 0.8, -4), params: { radius: 0.35, color: 0xffff00 } },
          { type: "orb", position: new Vector3(0, 1.2, -4), params: { radius: 0.08, color: 0xffff00 } },
        ],
      },
    ],
  },
  QUANTUM_FIELD_COURSE,
  COSMIC_ABYSS_COURSE,
];
