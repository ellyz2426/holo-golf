/**
 * Holo Golf VR — Environment Builder
 * Creates holodeck-style environment with grid floor, starfield, ambient lighting.
 */
import {
  World,
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Color,
  DoubleSide,
  AdditiveBlending,
  AmbientLight,
  DirectionalLight,
  PointLight,
  Fog,
  SphereGeometry,
  BoxGeometry,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from "@iwsdk/core";

export class EnvironmentBuilder {
  private world: World;
  private starfield: Points;
  private gridPulseTime = 0;
  private gridLines: LineSegments;
  private ambientOrbs: Mesh[] = [];

  constructor(world: World) {
    this.world = world;
  }

  build() {
    const scene = this.world.scene;

    // Fog — deep space feel
    scene.fog = new Fog(0x000811, 10, 80);

    // Ambient light
    const ambient = new AmbientLight(0x112233, 0.4);
    scene.add(ambient);

    // Directional light (moonlight feel)
    const dirLight = new DirectionalLight(0x4488cc, 0.6);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Point lights for atmosphere
    const light1 = new PointLight(0x00ffff, 0.4, 20);
    light1.position.set(-5, 4, -5);
    scene.add(light1);

    const light2 = new PointLight(0xff4488, 0.3, 20);
    light2.position.set(5, 3, 5);
    scene.add(light2);

    // Ground grid
    this.buildGrid();

    // Starfield
    this.buildStarfield();

    // Floating geometric decorations
    this.buildAmbientGeometry();
  }

  private buildGrid() {
    const gridSize = 40;
    const divisions = 40;
    const step = gridSize / divisions;
    const halfSize = gridSize / 2;

    const vertices: number[] = [];
    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      // X lines
      vertices.push(pos, -0.01, -halfSize, pos, -0.01, halfSize);
      // Z lines
      vertices.push(-halfSize, -0.01, pos, halfSize, -0.01, pos);
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));

    const mat = new LineBasicMaterial({
      color: 0x003344,
      transparent: true,
      opacity: 0.4,
    });

    this.gridLines = new LineSegments(geo, mat);
    this.world.scene.add(this.gridLines);

    // Solid dark ground plane
    const groundGeo = new PlaneGeometry(gridSize, gridSize);
    const groundMat = new MeshStandardMaterial({
      color: 0x000a11,
      roughness: 1,
      metalness: 0,
    });
    const ground = new Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.world.scene.add(ground);
  }

  private buildStarfield() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = Math.abs(r * Math.cos(phi)) + 2; // keep above ground
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Color variation: cyan, blue, white, pink
      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        colors[i3] = 0; colors[i3 + 1] = 0.8; colors[i3 + 2] = 1;
      } else if (colorChoice < 0.6) {
        colors[i3] = 0.5; colors[i3 + 1] = 0.5; colors[i3 + 2] = 1;
      } else if (colorChoice < 0.85) {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1;
      } else {
        colors[i3] = 1; colors[i3 + 1] = 0.3; colors[i3 + 2] = 0.6;
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));

    const mat = new PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });

    this.starfield = new Points(geo, mat);
    this.world.scene.add(this.starfield);
  }

  private buildAmbientGeometry() {
    // Floating holographic shapes in the distance
    const shapes = [
      { pos: [-8, 5, -12], size: 0.8, color: 0x00ffff, speed: 0.3 },
      { pos: [10, 7, -15], size: 1.2, color: 0xff4488, speed: 0.2 },
      { pos: [-12, 3, 8], size: 0.6, color: 0x44ff88, speed: 0.4 },
      { pos: [6, 8, 10], size: 1.0, color: 0x8844ff, speed: 0.25 },
      { pos: [-5, 6, -20], size: 1.5, color: 0xffaa00, speed: 0.15 },
    ];

    for (const s of shapes) {
      const geo = new BoxGeometry(s.size, s.size, s.size);
      const mat = new MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: 0.08,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);

      const edges = new EdgesGeometry(geo);
      const edgeMat = new LineBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: 0.3,
      });
      mesh.add(new LineSegments(edges, edgeMat));

      (mesh as any).__rotSpeed = s.speed;
      this.ambientOrbs.push(mesh);
      this.world.scene.add(mesh);
    }
  }

  update(dt: number) {
    // Rotate ambient geometry
    for (const orb of this.ambientOrbs) {
      const speed = (orb as any).__rotSpeed || 0.2;
      orb.rotation.x += speed * dt * 0.5;
      orb.rotation.y += speed * dt;
    }

    // Grid pulse
    this.gridPulseTime += dt;
    const pulse = 0.3 + Math.sin(this.gridPulseTime * 0.5) * 0.1;
    (this.gridLines.material as LineBasicMaterial).opacity = pulse;

    // Slow starfield rotation
    if (this.starfield) {
      this.starfield.rotation.y += dt * 0.005;
    }
  }
}
