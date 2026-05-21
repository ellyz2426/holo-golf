/**
 * Holo Golf VR — Gravity Well & Speed Boost Obstacles
 * Gravity well: circular attractor that pulls the ball toward its center.
 * Speed boost: directional pad that accelerates the ball on contact.
 */
import {
  Vector3,
  Group,
  Mesh,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Color,
  AdditiveBlending,
  DoubleSide,
  RingGeometry,
  PointLight,
  BoxGeometry,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
} from "@iwsdk/core";

// === Gravity Well ===

export interface GravityWell {
  group: Group;
  position: Vector3;
  radius: number;
  strength: number;
  innerRings: Mesh[];
  coreOrb: Mesh;
  time: number;
}

export function createGravityWell(
  pos: Vector3,
  radius = 0.5,
  strength = 3.0,
  color = 0xff44aa,
): GravityWell {
  const group = new Group();
  group.position.copy(pos);

  // Outer field ring
  const outerGeo = new RingGeometry(radius * 0.9, radius, 32);
  const outerMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const outer = new Mesh(outerGeo, outerMat);
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = 0.005;
  group.add(outer);

  // Concentric inner rings that pulse
  const innerRings: Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const r = radius * (0.25 + i * 0.2);
    const ringGeo = new RingGeometry(r - 0.01, r + 0.01, 24);
    const ringMat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15 + i * 0.1,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.006 + i * 0.002;
    group.add(ring);
    innerRings.push(ring);
  }

  // Core orb (floating, pulsing)
  const coreGeo = new SphereGeometry(0.04, 12, 12);
  const coreMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    blending: AdditiveBlending,
  });
  const coreOrb = new Mesh(coreGeo, coreMat);
  coreOrb.position.y = 0.08;
  group.add(coreOrb);

  // Wireframe torus orbiting the core
  const torusGeo = new TorusGeometry(0.06, 0.005, 8, 16);
  const torusMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
  });
  const torus = new Mesh(torusGeo, torusMat);
  torus.position.y = 0.08;
  group.add(torus);

  // Point light
  const light = new PointLight(color, 0.5, 3);
  light.position.y = 0.1;
  group.add(light);

  return {
    group,
    position: pos.clone(),
    radius,
    strength,
    innerRings,
    coreOrb,
    time: 0,
  };
}

export function updateGravityWell(well: GravityWell, dt: number): void {
  well.time += dt;

  // Pulse inner rings inward (contracting animation)
  for (let i = 0; i < well.innerRings.length; i++) {
    const ring = well.innerRings[i];
    const phase = well.time * 2 + i * 0.7;
    const scale = 0.8 + Math.sin(phase) * 0.2;
    ring.scale.setScalar(scale);
    (ring.material as MeshBasicMaterial).opacity = 0.1 + Math.sin(phase) * 0.15;
  }

  // Orbit core orb
  well.coreOrb.position.y = 0.08 + Math.sin(well.time * 3) * 0.02;
  const coreMat = well.coreOrb.material as MeshBasicMaterial;
  coreMat.opacity = 0.5 + Math.sin(well.time * 4) * 0.2;

  // Rotate torus
  const torus = well.group.children.find(
    (c) => (c as Mesh).geometry instanceof TorusGeometry,
  ) as Mesh | undefined;
  if (torus) {
    torus.rotation.x += dt * 1.5;
    torus.rotation.z += dt * 0.8;
  }
}

export function getGravityWellForce(
  well: GravityWell,
  ballPos: Vector3,
): Vector3 {
  const dx = well.position.x - ballPos.x;
  const dz = well.position.z - ballPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist > well.radius || dist < 0.03) {
    return new Vector3(0, 0, 0);
  }

  // Force increases as ball approaches center (inverse distance)
  const normalizedDist = dist / well.radius;
  const forceMag = well.strength * (1 - normalizedDist);

  return new Vector3(dx / dist, 0, dz / dist).multiplyScalar(forceMag);
}

// === Speed Boost Pad ===

export interface SpeedBoostPad {
  group: Group;
  position: Vector3;
  direction: Vector3;
  boostForce: number;
  size: Vector3;
  chevrons: Mesh[];
  time: number;
  cooldown: number;
}

export function createSpeedBoostPad(
  pos: Vector3,
  dir: Vector3,
  boostForce = 5.0,
  size = new Vector3(0.3, 0.01, 0.5),
  color = 0x44ff88,
): SpeedBoostPad {
  const group = new Group();
  group.position.copy(pos);

  // Base pad (glowing platform)
  const baseGeo = new BoxGeometry(size.x, size.y, size.z);
  const baseMat = new MeshStandardMaterial({
    color,
    emissive: new Color(color),
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.1,
    transparent: true,
    opacity: 0.4,
  });
  const base = new Mesh(baseGeo, baseMat);
  base.position.y = size.y / 2;
  group.add(base);

  // Edge wireframe
  const edges = new EdgesGeometry(baseGeo);
  const edgeMat = new LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
  });
  base.add(new LineSegments(edges, edgeMat));

  // Directional chevrons (arrows showing boost direction)
  const chevrons: Mesh[] = [];
  const normDir = dir.clone().normalize();
  const chevronCount = 4;

  for (let i = 0; i < chevronCount; i++) {
    const t = (i / chevronCount - 0.5) * size.z * 0.7;
    const chevGeo = new CylinderGeometry(0, 0.025, 0.05, 3);
    const chevMat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
    });
    const chev = new Mesh(chevGeo, chevMat);
    chev.position.set(normDir.x * t, 0.02, normDir.z * t);
    // Rotate to point in direction
    chev.rotation.x = Math.PI;
    if (normDir.z !== 0) {
      chev.rotation.z = Math.atan2(normDir.x, normDir.z);
    }
    group.add(chev);
    chevrons.push(chev);
  }

  // Point light
  const light = new PointLight(color, 0.3, 2);
  light.position.y = 0.1;
  group.add(light);

  // Rotate group to align with direction
  const angle = Math.atan2(normDir.x, normDir.z);
  group.rotation.y = angle;

  return {
    group,
    position: pos.clone(),
    direction: normDir,
    boostForce,
    size,
    chevrons,
    time: 0,
    cooldown: 0,
  };
}

export function updateSpeedBoostPad(pad: SpeedBoostPad, dt: number): void {
  pad.time += dt;
  if (pad.cooldown > 0) pad.cooldown -= dt;

  // Animate chevrons flowing in boost direction
  for (let i = 0; i < pad.chevrons.length; i++) {
    const chev = pad.chevrons[i];
    const phase = pad.time * 3 + i * 0.5;
    const wave = (Math.sin(phase) + 1) * 0.5;
    (chev.material as MeshBasicMaterial).opacity = 0.2 + wave * 0.6;
    chev.scale.setScalar(0.8 + wave * 0.4);
  }
}

export function checkSpeedBoost(
  pad: SpeedBoostPad,
  ballPos: Vector3,
): Vector3 | null {
  if (pad.cooldown > 0) return null;

  const dx = Math.abs(ballPos.x - pad.position.x);
  const dz = Math.abs(ballPos.z - pad.position.z);
  const halfW = pad.size.x / 2;
  const halfD = pad.size.z / 2;

  if (dx < halfW + 0.03 && dz < halfD + 0.03 && Math.abs(ballPos.y - pad.position.y) < 0.1) {
    pad.cooldown = 0.5; // prevent repeated triggers
    return pad.direction.clone().multiplyScalar(pad.boostForce);
  }

  return null;
}
