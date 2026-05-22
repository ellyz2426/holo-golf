/**
 * Holo Golf VR — Ghost Ball Replay System (Round 6)
 * Records ball positions during play. Saves best run per hole.
 * Replays best-run as a translucent ghost ball for time-trial comparison.
 */
import {
  World,
  Vector3,
  Group,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  Color,
  LineBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Line,
} from "@iwsdk/core";

interface GhostFrame {
  x: number;
  y: number;
  z: number;
  t: number; // timestamp in seconds from hole start
}

interface GhostRun {
  courseIndex: number;
  holeIndex: number;
  strokes: number;
  frames: GhostFrame[];
}

const STORAGE_KEY = "holo-golf-ghosts";
const RECORD_INTERVAL = 0.033; // ~30fps recording
const GHOST_BALL_RADIUS = 0.025;

export class GhostBallSystem {
  private world: World;
  private enabled = true;

  // Recording state
  private recording = false;
  private currentFrames: GhostFrame[] = [];
  private recordTimer = 0;
  private holeStartTime = 0;

  // Playback state
  private playing = false;
  private playbackFrames: GhostFrame[] = [];
  private playbackTime = 0;
  private playbackStarted = false;

  // Ghost ball mesh
  private ghostGroup: Group;
  private ghostBall: Mesh;
  private ghostGlow: Mesh;
  private ghostTrail: Line;
  private trailPositions: Vector3[] = [];
  private maxTrailLength = 30;

  // Saved best runs: key = "c{course}_h{hole}"
  private bestRuns: Map<string, GhostRun> = new Map();

  constructor(world: World) {
    this.world = world;
    this.loadRuns();

    // Create ghost ball visuals
    this.ghostGroup = new Group();

    // Semi-transparent ball
    const ballGeo = new SphereGeometry(GHOST_BALL_RADIUS, 12, 12);
    const ballMat = new MeshBasicMaterial({
      color: new Color(0xffaa00),
      transparent: true,
      opacity: 0.35,
      blending: AdditiveBlending,
    });
    this.ghostBall = new Mesh(ballGeo, ballMat);
    this.ghostGroup.add(this.ghostBall);

    // Outer glow
    const glowGeo = new SphereGeometry(GHOST_BALL_RADIUS * 2.0, 8, 8);
    const glowMat = new MeshBasicMaterial({
      color: new Color(0xffaa00),
      transparent: true,
      opacity: 0.12,
      blending: AdditiveBlending,
    });
    this.ghostGlow = new Mesh(glowGeo, glowMat);
    this.ghostGroup.add(this.ghostGlow);

    // Trail line
    const trailGeo = new BufferGeometry();
    trailGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(this.maxTrailLength * 3), 3));
    this.ghostTrail = new Line(
      trailGeo,
      new LineBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.2,
        blending: AdditiveBlending,
      }),
    );
    this.ghostGroup.add(this.ghostTrail);

    this.ghostGroup.visible = false;
    world.scene.add(this.ghostGroup);
  }

  /** Start recording a new hole attempt */
  startRecording() {
    this.currentFrames = [];
    this.recording = true;
    this.recordTimer = 0;
    this.holeStartTime = performance.now() / 1000;
  }

  /** Stop recording and return the recorded frames */
  stopRecording(): GhostFrame[] {
    this.recording = false;
    return this.currentFrames;
  }

  /** Record ball position during play */
  recordFrame(dt: number, ballPos: Vector3) {
    if (!this.recording) return;
    this.recordTimer += dt;
    if (this.recordTimer >= RECORD_INTERVAL) {
      this.recordTimer -= RECORD_INTERVAL;
      this.currentFrames.push({
        x: ballPos.x,
        y: ballPos.y,
        z: ballPos.z,
        t: performance.now() / 1000 - this.holeStartTime,
      });
    }
  }

  /** Save a completed hole run if it's the best for this hole */
  saveIfBest(courseIndex: number, holeIndex: number, strokes: number) {
    const key = `c${courseIndex}_h${holeIndex}`;
    const existing = this.bestRuns.get(key);

    if (!existing || strokes < existing.strokes) {
      const run: GhostRun = {
        courseIndex,
        holeIndex,
        strokes,
        frames: [...this.currentFrames],
      };
      this.bestRuns.set(key, run);
      this.saveRuns();
      return true; // new best
    }
    return false;
  }

  /** Start ghost playback for a hole (if a best run exists) */
  startPlayback(courseIndex: number, holeIndex: number) {
    if (!this.enabled) return;
    const key = `c${courseIndex}_h${holeIndex}`;
    const run = this.bestRuns.get(key);
    if (!run || run.frames.length < 2) {
      this.playing = false;
      this.ghostGroup.visible = false;
      return;
    }

    this.playbackFrames = run.frames;
    this.playbackTime = 0;
    this.playing = true;
    this.playbackStarted = false;
    this.trailPositions = [];
    this.ghostGroup.visible = true;

    // Position at start
    const f = this.playbackFrames[0];
    this.ghostBall.position.set(f.x, f.y, f.z);
  }

  /** Begin playback timer (call when player makes first stroke) */
  triggerPlaybackStart() {
    if (this.playing) {
      this.playbackStarted = true;
      this.playbackTime = 0;
    }
  }

  /** Stop ghost playback */
  stopPlayback() {
    this.playing = false;
    this.ghostGroup.visible = false;
    this.trailPositions = [];
  }

  /** Update ghost ball position during playback */
  update(dt: number) {
    if (!this.playing || !this.playbackStarted) return;

    this.playbackTime += dt;

    // Find current frame by interpolation
    const frames = this.playbackFrames;
    const t = this.playbackTime;

    // Find surrounding frames
    let i = 0;
    while (i < frames.length - 1 && frames[i + 1].t < t) i++;

    if (i >= frames.length - 1) {
      // Playback finished
      this.stopPlayback();
      return;
    }

    const f0 = frames[i];
    const f1 = frames[i + 1];
    const alpha = (t - f0.t) / (f1.t - f0.t);

    const px = f0.x + (f1.x - f0.x) * alpha;
    const py = f0.y + (f1.y - f0.y) * alpha;
    const pz = f0.z + (f1.z - f0.z) * alpha;

    this.ghostBall.position.set(px, py, pz);
    this.ghostGlow.position.set(px, py, pz);

    // Pulsing opacity
    const pulse = 0.25 + Math.sin(performance.now() * 0.005) * 0.1;
    (this.ghostBall.material as MeshBasicMaterial).opacity = pulse;

    // Update trail
    this.trailPositions.push(new Vector3(px, py, pz));
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.shift();
    }
    this.updateTrailGeometry();
  }

  private updateTrailGeometry() {
    const positions = this.ghostTrail.geometry.attributes.position as any;
    const arr = positions.array as Float32Array;
    arr.fill(0);
    for (let i = 0; i < this.trailPositions.length; i++) {
      arr[i * 3] = this.trailPositions[i].x;
      arr[i * 3 + 1] = this.trailPositions[i].y;
      arr[i * 3 + 2] = this.trailPositions[i].z;
    }
    positions.needsUpdate = true;
    this.ghostTrail.geometry.setDrawRange(0, this.trailPositions.length);
  }

  /** Check if ghost data exists for a hole */
  hasGhost(courseIndex: number, holeIndex: number): boolean {
    return this.bestRuns.has(`c${courseIndex}_h${holeIndex}`);
  }

  /** Get best ghost strokes for a hole */
  getGhostStrokes(courseIndex: number, holeIndex: number): number | null {
    const run = this.bestRuns.get(`c${courseIndex}_h${holeIndex}`);
    return run ? run.strokes : null;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) this.stopPlayback();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private loadRuns() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as Record<string, GhostRun>;
        for (const [key, run] of Object.entries(parsed)) {
          this.bestRuns.set(key, run);
        }
      }
    } catch {}
  }

  private saveRuns() {
    try {
      const obj: Record<string, GhostRun> = {};
      this.bestRuns.forEach((v, k) => (obj[k] = v));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }
}
