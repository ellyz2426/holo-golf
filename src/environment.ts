/**
 * Holo Golf VR — Environment Builder (Round 3 Overhaul)
 * Holodeck-style environment with course-specific theming.
 * Each course gets distinct grid color, fog, starfield, and ambient geometry.
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
  ConeGeometry,
  TorusGeometry,
} from "@iwsdk/core";

interface CourseTheme {
  fogColor: number;
  gridColor: number;
  gridOpacity: number;
  starColors: number[][];
  ambientShapes: { pos: number[]; size: number; color: number; speed: number; geo: "box" | "sphere" | "torus" | "cone" }[];
  pointLights: { pos: number[]; color: number; intensity: number }[];
}

const COURSE_THEMES: CourseTheme[] = [
  // Neon Circuit — clean cyan/green
  {
    fogColor: 0x000811,
    gridColor: 0x003344,
    gridOpacity: 0.4,
    starColors: [[0, 0.8, 1], [0.5, 0.5, 1], [1, 1, 1], [1, 0.3, 0.6]],
    ambientShapes: [
      { pos: [-8, 5, -12], size: 0.8, color: 0x00ffff, speed: 0.3, geo: "box" },
      { pos: [10, 7, -15], size: 1.2, color: 0x44ff88, speed: 0.2, geo: "box" },
      { pos: [-12, 3, 8], size: 0.6, color: 0x0088ff, speed: 0.4, geo: "sphere" },
      { pos: [6, 8, 10], size: 1.0, color: 0x00ccff, speed: 0.25, geo: "box" },
      { pos: [-5, 6, -20], size: 1.5, color: 0x44ffaa, speed: 0.15, geo: "torus" },
    ],
    pointLights: [
      { pos: [-5, 4, -5], color: 0x00ffff, intensity: 0.4 },
      { pos: [5, 3, 5], color: 0x44ff88, intensity: 0.3 },
    ],
  },
  // Quantum Field — purple/pink
  {
    fogColor: 0x080011,
    gridColor: 0x330044,
    gridOpacity: 0.35,
    starColors: [[0.8, 0.2, 0.6], [0.5, 0.2, 1], [1, 0.5, 0.8], [0.3, 0.3, 1]],
    ambientShapes: [
      { pos: [-10, 5, -12], size: 0.9, color: 0xff44aa, speed: 0.2, geo: "sphere" },
      { pos: [8, 7, -18], size: 1.3, color: 0x8844ff, speed: 0.15, geo: "torus" },
      { pos: [-15, 4, 6], size: 0.7, color: 0xaa66ff, speed: 0.35, geo: "box" },
      { pos: [12, 6, 8], size: 1.1, color: 0xff88cc, speed: 0.25, geo: "cone" },
      { pos: [-3, 8, -22], size: 1.6, color: 0xcc44ff, speed: 0.1, geo: "sphere" },
    ],
    pointLights: [
      { pos: [-5, 4, -5], color: 0xff44aa, intensity: 0.4 },
      { pos: [5, 3, 5], color: 0x8844ff, intensity: 0.3 },
    ],
  },
  // Cosmic Abyss — orange/red, ominous
  {
    fogColor: 0x0a0400,
    gridColor: 0x331100,
    gridOpacity: 0.3,
    starColors: [[1, 0.4, 0], [1, 0.6, 0.2], [1, 0.2, 0], [1, 0.8, 0.4]],
    ambientShapes: [
      { pos: [-12, 6, -14], size: 1.0, color: 0xff6600, speed: 0.15, geo: "sphere" },
      { pos: [9, 5, -16], size: 0.8, color: 0xff4400, speed: 0.25, geo: "cone" },
      { pos: [-8, 4, 10], size: 1.4, color: 0xffaa00, speed: 0.1, geo: "torus" },
      { pos: [14, 8, 6], size: 0.6, color: 0xff8800, speed: 0.3, geo: "box" },
      { pos: [-6, 7, -25], size: 2.0, color: 0xff2200, speed: 0.08, geo: "sphere" },
    ],
    pointLights: [
      { pos: [-5, 4, -5], color: 0xff6600, intensity: 0.5 },
      { pos: [5, 3, 5], color: 0xff4400, intensity: 0.35 },
    ],
  },
];

export class EnvironmentBuilder {
  private world: World;
  private starfield: Points | null = null;
  private gridPulseTime = 0;
  private gridLines: LineSegments | null = null;
  private ambientOrbs: Mesh[] = [];
  private dynamicPointLights: PointLight[] = [];
  private currentThemeIndex = -1;

  // Keep references for theme switching
  private themeGroup: Group;
  private gridGroup: Group;
  private starfieldGroup: Group;

  constructor(world: World) {
    this.world = world;
    this.themeGroup = new Group();
    this.gridGroup = new Group();
    this.starfieldGroup = new Group();
    world.scene.add(this.themeGroup);
    world.scene.add(this.gridGroup);
    world.scene.add(this.starfieldGroup);
  }

  build() {
    const scene = this.world.scene;

    // Base lighting (constant across themes)
    const ambient = new AmbientLight(0x112233, 0.4);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0x4488cc, 0.6);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Build ground plane (constant)
    const gridSize = 40;
    const groundGeo = new PlaneGeometry(gridSize, gridSize);
    const groundMat = new MeshStandardMaterial({
      color: 0x000a11,
      roughness: 1,
      metalness: 0,
    });
    const ground = new Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    // Apply default theme
    this.applyTheme(0);
  }

  applyTheme(courseIndex: number) {
    if (courseIndex === this.currentThemeIndex) return;
    this.currentThemeIndex = courseIndex;
    const theme = COURSE_THEMES[courseIndex] || COURSE_THEMES[0];

    // Clear previous theme elements
    this.clearThemeElements();

    // Fog
    this.world.scene.fog = new Fog(theme.fogColor, 10, 80);

    // Grid
    this.buildGrid(theme);

    // Starfield
    this.buildStarfield(theme);

    // Ambient geometry
    this.buildAmbientGeometry(theme);

    // Point lights
    for (const lightDef of theme.pointLights) {
      const light = new PointLight(lightDef.color, lightDef.intensity, 20);
      light.position.set(lightDef.pos[0], lightDef.pos[1], lightDef.pos[2]);
      this.themeGroup.add(light);
      this.dynamicPointLights.push(light);
    }
  }

  private clearThemeElements() {
    // Clear grid
    while (this.gridGroup.children.length > 0) {
      const child = this.gridGroup.children[0];
      this.gridGroup.remove(child);
    }
    this.gridLines = null;

    // Clear starfield
    while (this.starfieldGroup.children.length > 0) {
      const child = this.starfieldGroup.children[0];
      this.starfieldGroup.remove(child);
    }
    this.starfield = null;

    // Clear theme decorations
    while (this.themeGroup.children.length > 0) {
      const child = this.themeGroup.children[0];
      this.themeGroup.remove(child);
    }
    this.ambientOrbs = [];
    this.dynamicPointLights = [];
  }

  private buildGrid(theme: CourseTheme) {
    const gridSize = 40;
    const divisions = 40;
    const step = gridSize / divisions;
    const halfSize = gridSize / 2;

    const vertices: number[] = [];
    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      vertices.push(pos, -0.01, -halfSize, pos, -0.01, halfSize);
      vertices.push(-halfSize, -0.01, pos, halfSize, -0.01, pos);
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));

    const mat = new LineBasicMaterial({
      color: theme.gridColor,
      transparent: true,
      opacity: theme.gridOpacity,
    });

    this.gridLines = new LineSegments(geo, mat);
    this.gridGroup.add(this.gridLines);
  }

  private buildStarfield(theme: CourseTheme) {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = Math.abs(r * Math.cos(phi)) + 2;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const colorSet = theme.starColors[Math.floor(Math.random() * theme.starColors.length)];
      colors[i3] = colorSet[0];
      colors[i3 + 1] = colorSet[1];
      colors[i3 + 2] = colorSet[2];
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
    this.starfieldGroup.add(this.starfield);
  }

  private buildAmbientGeometry(theme: CourseTheme) {
    for (const s of theme.ambientShapes) {
      let geo: any;
      switch (s.geo) {
        case "sphere":
          geo = new SphereGeometry(s.size, 12, 12);
          break;
        case "cone":
          geo = new ConeGeometry(s.size * 0.6, s.size * 1.2, 6);
          break;
        case "torus":
          geo = new TorusGeometry(s.size, s.size * 0.2, 8, 16);
          break;
        default:
          geo = new BoxGeometry(s.size, s.size, s.size);
      }

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
      this.themeGroup.add(mesh);
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
    if (this.gridLines) {
      this.gridPulseTime += dt;
      const pulse = 0.3 + Math.sin(this.gridPulseTime * 0.5) * 0.1;
      (this.gridLines.material as LineBasicMaterial).opacity = pulse;
    }

    // Slow starfield rotation
    if (this.starfield) {
      this.starfield.rotation.y += dt * 0.005;
    }
  }
}
