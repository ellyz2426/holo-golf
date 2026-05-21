/**
 * Holo Golf VR — Teleporter Pad
 * Interactive teleport pads that warp the ball between locations.
 * Also handles wind zone and ice surface behaviors.
 */
import {
  Mesh,
  CylinderGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Color,
  AdditiveBlending,
  Group,
  RingGeometry,
  DoubleSide,
  PointLight,
  TorusGeometry,
  Vector3,
} from "@iwsdk/core";

export interface TeleportPad {
  group: Group;
  position: Vector3;
  targetPosition: Vector3;
  radius: number;
  active: boolean;
  cooldown: number;
}

export function createTeleportPad(
  pos: Vector3,
  target: Vector3,
  color = 0x8844ff,
): TeleportPad {
  const group = new Group();
  group.position.copy(pos);

  // Base ring
  const baseGeo = new CylinderGeometry(0.12, 0.12, 0.01, 24);
  const baseMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
  });
  group.add(new Mesh(baseGeo, baseMat));

  // Inner ring
  const innerGeo = new RingGeometry(0.04, 0.08, 16);
  const innerMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const inner = new Mesh(innerGeo, innerMat);
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.01;
  group.add(inner);

  // Orbiting particles
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const dotGeo = new CylinderGeometry(0.01, 0.01, 0.03, 4);
    const dotMat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
    });
    const dot = new Mesh(dotGeo, dotMat);
    dot.position.set(Math.cos(angle) * 0.1, 0.05, Math.sin(angle) * 0.1);
    group.add(dot);
  }

  // Vertical beam
  const beamGeo = new CylinderGeometry(0.008, 0.008, 0.4, 4);
  const beamMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.25,
    blending: AdditiveBlending,
  });
  const beam = new Mesh(beamGeo, beamMat);
  beam.position.y = 0.2;
  group.add(beam);

  // Light
  const light = new PointLight(color, 0.4, 2);
  light.position.y = 0.1;
  group.add(light);

  return {
    group,
    position: pos.clone(),
    targetPosition: target.clone(),
    radius: 0.12,
    active: true,
    cooldown: 0,
  };
}

export interface WindZone {
  group: Group;
  position: Vector3;
  direction: Vector3;
  force: number;
  size: Vector3;
}

export function createWindZone(
  pos: Vector3,
  dir: Vector3,
  force: number,
  size: Vector3,
): WindZone {
  const group = new Group();
  group.position.copy(pos);

  // Visual: directional arrows/particles
  const arrowCount = 5;
  for (let i = 0; i < arrowCount; i++) {
    const t = i / arrowCount;
    const arrowGeo = new CylinderGeometry(0, 0.02, 0.06, 3);
    const arrowMat = new MeshBasicMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.3 + t * 0.2,
      blending: AdditiveBlending,
    });
    const arrow = new Mesh(arrowGeo, arrowMat);
    arrow.position.set(
      dir.x * t * size.x * 0.4,
      0.03,
      dir.z * t * size.z * 0.4,
    );
    // Point arrow in wind direction
    arrow.rotation.x = Math.PI;
    if (dir.z < 0) arrow.rotation.z = Math.PI;
    group.add(arrow);
  }

  return { group, position: pos.clone(), direction: dir.clone().normalize(), force, size };
}

export interface IceSurface {
  group: Group;
  position: Vector3;
  size: Vector3;
  friction: number;
}

export function createIceSurface(pos: Vector3, size: Vector3): IceSurface {
  const group = new Group();
  group.position.copy(pos);

  // Ice-like surface overlay
  const iceGeo = new CylinderGeometry(size.x / 2, size.x / 2, 0.005, 16);
  const iceMat = new MeshStandardMaterial({
    color: 0x88ccff,
    emissive: new Color(0x4488cc),
    emissiveIntensity: 0.5,
    metalness: 1.0,
    roughness: 0.0,
    transparent: true,
    opacity: 0.4,
  });
  const ice = new Mesh(iceGeo, iceMat);
  ice.position.y = 0.003;
  group.add(ice);

  return { group, position: pos.clone(), size, friction: 0.995 };
}
