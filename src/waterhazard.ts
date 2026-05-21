/**
 * Holo Golf VR — Water Hazard
 * Animated water surface obstacle. Ball entering the water triggers
 * a splash effect, penalty stroke, and reset to last position.
 */
import {
  Group,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Color,
  DoubleSide,
  AdditiveBlending,
  Vector3,
  PointLight,
} from "@iwsdk/core";

export interface WaterHazard {
  group: Group;
  position: Vector3;
  size: Vector3;
  animTime: number;
  surfaceMesh: Mesh;
  rippleMeshes: Mesh[];
}

export function createWaterHazard(pos: Vector3, size: Vector3, color = 0x0044aa): WaterHazard {
  const group = new Group();
  group.position.copy(pos);

  // Water surface
  const surfGeo = new PlaneGeometry(size.x, size.z, 8, 8);
  const surfMat = new MeshStandardMaterial({
    color: new Color(color),
    emissive: new Color(color).multiplyScalar(0.3),
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const surfMesh = new Mesh(surfGeo, surfMat);
  surfMesh.rotation.x = -Math.PI / 2;
  surfMesh.position.y = 0.005;
  group.add(surfMesh);

  // Danger border glow
  const borderGeo = new PlaneGeometry(size.x + 0.04, size.z + 0.04);
  const borderMat = new MeshBasicMaterial({
    color: 0xff2200,
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const border = new Mesh(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.y = 0.002;
  group.add(border);

  // Animated ripple rings
  const rippleMeshes: Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const rippleGeo = new PlaneGeometry(0.08, 0.08);
    const rippleMat = new MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.3,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const ripple = new Mesh(rippleGeo, rippleMat);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.008;
    ripple.position.x = (Math.random() - 0.5) * size.x * 0.6;
    ripple.position.z = (Math.random() - 0.5) * size.z * 0.6;
    group.add(ripple);
    rippleMeshes.push(ripple);
  }

  // Subtle light
  const light = new PointLight(0x0066cc, 0.3, 2);
  light.position.y = 0.2;
  group.add(light);

  // Warning icon markers at corners
  const corners = [
    [-size.x / 2, -size.z / 2],
    [size.x / 2, -size.z / 2],
    [-size.x / 2, size.z / 2],
    [size.x / 2, size.z / 2],
  ];
  for (const [cx, cz] of corners) {
    const markerGeo = new PlaneGeometry(0.04, 0.04);
    const markerMat = new MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.6,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const marker = new Mesh(markerGeo, markerMat);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(cx, 0.01, cz);
    group.add(marker);
  }

  return {
    group,
    position: pos.clone(),
    size: size.clone(),
    animTime: Math.random() * Math.PI * 2,
    surfaceMesh: surfMesh,
    rippleMeshes,
  };
}

export function updateWaterHazard(water: WaterHazard, dt: number) {
  water.animTime += dt;

  // Animate surface vertices for wave effect
  const geo = water.surfaceMesh.geometry;
  const posAttr = geo.getAttribute("position");
  if (posAttr) {
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < posAttr.count; i++) {
      const x = arr[i * 3];
      const z = arr[i * 3 + 1]; // Note: plane is rotated, so local Y is world Z
      arr[i * 3 + 2] = Math.sin(water.animTime * 2 + x * 5 + z * 3) * 0.003
        + Math.cos(water.animTime * 1.5 + x * 3 - z * 4) * 0.002;
    }
    posAttr.needsUpdate = true;
  }

  // Animate ripple rings
  for (let i = 0; i < water.rippleMeshes.length; i++) {
    const r = water.rippleMeshes[i];
    const phase = water.animTime * 0.8 + i * 2.1;
    const scale = 0.5 + (phase % 3) * 0.5;
    r.scale.setScalar(scale);
    (r.material as MeshBasicMaterial).opacity = Math.max(0, 0.4 - (phase % 3) * 0.15);
  }

  // Pulse border glow
  const border = water.group.children[1];
  if (border) {
    (border as Mesh).material &&
      ((border as Mesh).material as MeshBasicMaterial).opacity !== undefined &&
      (((border as Mesh).material as MeshBasicMaterial).opacity =
        0.15 + Math.sin(water.animTime * 2) * 0.05);
  }
}

export function isInWaterHazard(water: WaterHazard, ballPos: Vector3): boolean {
  const dx = Math.abs(ballPos.x - water.position.x);
  const dz = Math.abs(ballPos.z - water.position.z);
  return dx < water.size.x / 2 && dz < water.size.z / 2 && ballPos.y < water.position.y + 0.08;
}
