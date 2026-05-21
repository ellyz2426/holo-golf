/**
 * Holo Golf VR — HUD Manager
 * In-world heads-up display: hole info, scorecard, power meter.
 */
import {
  World,
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  Color,
  DoubleSide,
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
} from "@iwsdk/core";
import { GameManager, GameState } from "./game";

export class HUDManager {
  private world: World;
  private game: GameManager;
  private hudGroup: Group;

  // Canvas-based HUD
  private canvas: HTMLCanvasElement;
  private ctx2d: CanvasRenderingContext2D;
  private texture: CanvasTexture;
  private hudMesh: Mesh;
  private dirty = true;
  private lastState: GameState = GameState.LOADING;

  constructor(world: World, game: GameManager) {
    this.world = world;
    this.game = game;
    this.hudGroup = new Group();

    // Create canvas for text rendering
    this.canvas = document.createElement("canvas");
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx2d = this.canvas.getContext("2d")!;

    this.texture = new CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    const hudGeo = new PlaneGeometry(1.6, 0.8);
    const hudMat = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.9,
      side: DoubleSide,
    });
    this.hudMesh = new Mesh(hudGeo, hudMat);
    this.hudMesh.position.set(0, 2.2, -3);
    this.hudGroup.add(this.hudMesh);

    world.scene.add(this.hudGroup);

    // Listen for state changes
    game.onStateChange(() => {
      this.dirty = true;
    });
  }

  update(dt: number) {
    if (this.dirty || this.game.state !== this.lastState) {
      this.redraw();
      this.lastState = this.game.state;
      this.dirty = false;
    }
  }

  private redraw() {
    const ctx = this.ctx2d;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "rgba(0, 8, 20, 0.75)";
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = "#00ccff";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Corner accents
    const cornerSize = 15;
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(2, cornerSize + 2);
    ctx.lineTo(2, 2);
    ctx.lineTo(cornerSize + 2, 2);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - cornerSize - 2, 2);
    ctx.lineTo(w - 2, 2);
    ctx.lineTo(w - 2, cornerSize + 2);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(2, h - cornerSize - 2);
    ctx.lineTo(2, h - 2);
    ctx.lineTo(cornerSize + 2, h - 2);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - cornerSize - 2, h - 2);
    ctx.lineTo(w - 2, h - 2);
    ctx.lineTo(w - 2, h - cornerSize - 2);
    ctx.stroke();

    const state = this.game.state;

    if (
      state === GameState.PLAYING ||
      state === GameState.AIMING ||
      state === GameState.BALL_MOVING ||
      state === GameState.HOLE_COMPLETE
    ) {
      const hole = this.game.getCurrentHole();
      if (!hole) return;

      // Hole name
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 28px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`HOLE ${hole.index + 1}`, w / 2, 40);

      // Hole name subtitle
      ctx.fillStyle = "#6688aa";
      ctx.font = "18px monospace";
      ctx.fillText(hole.name, w / 2, 65);

      // Par info
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`PAR ${hole.par}`, 25, 110);

      // Strokes
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`STROKES: ${this.game.currentStrokes}`, 25, 140);

      // Score relative to par
      if (this.game.currentStrokes > 0) {
        const diff = this.game.currentStrokes - hole.par;
        const scoreName = this.game.getScoreName(this.game.currentStrokes, hole.par);
        ctx.fillStyle = diff <= 0 ? "#00ff88" : "#ff4488";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "right";
        ctx.fillText(scoreName, w - 25, 110);
      }

      // Total course score
      const totalStrokes = this.game.courseScore.totalStrokes + this.game.currentStrokes;
      ctx.fillStyle = "#8888cc";
      ctx.font = "16px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`TOTAL: ${totalStrokes}`, w - 25, 140);

      // Mini scorecard (bottom)
      this.drawMiniScorecard(ctx, w, h);

      // Hole complete overlay
      if (state === GameState.HOLE_COMPLETE) {
        const scoreName = this.game.getScoreName(this.game.currentStrokes, hole.par);
        ctx.fillStyle = "rgba(0, 20, 40, 0.6)";
        ctx.fillRect(50, 85, w - 100, 60);
        ctx.fillStyle = this.game.currentStrokes <= hole.par ? "#00ff88" : "#ffaa00";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.fillText(scoreName, w / 2, 125);
      }
    } else if (state === GameState.COURSE_COMPLETE) {
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillText("COURSE COMPLETE!", w / 2, 50);

      const score = this.game.courseScore;
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px monospace";
      ctx.fillText(`Total: ${score.totalStrokes} strokes`, w / 2, 95);

      const totalPar = score.holes.reduce((s, h) => s + h.par, 0);
      const diff = score.totalStrokes - totalPar;
      ctx.fillStyle = diff <= 0 ? "#00ff88" : "#ff8844";
      ctx.fillText(
        diff === 0 ? "Even Par!" : diff < 0 ? `${diff} Under Par!` : `+${diff} Over Par`,
        w / 2,
        130,
      );

      // Hole-in-ones
      const holeInOnes = score.holes.filter((h) => h.holeInOne).length;
      if (holeInOnes > 0) {
        ctx.fillStyle = "#ffff00";
        ctx.font = "20px monospace";
        ctx.fillText(`⭐ ${holeInOnes} Hole-in-One${holeInOnes > 1 ? "s" : ""}!`, w / 2, 165);
      }

      ctx.fillStyle = "#6688aa";
      ctx.font = "16px monospace";
      ctx.fillText("Click or press A to return to menu", w / 2, h - 25);
    }

    this.texture.needsUpdate = true;
  }

  private drawMiniScorecard(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const score = this.game.courseScore;
    const startX = 20;
    const startY = h - 70;
    const cellW = (w - 40) / 9;
    const cellH = 25;

    // Hole numbers
    ctx.fillStyle = "#445566";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < 9; i++) {
      const x = startX + i * cellW + cellW / 2;
      ctx.fillText(`${i + 1}`, x, startY);
    }

    // Pars
    ctx.fillStyle = "#667788";
    for (let i = 0; i < 9; i++) {
      const x = startX + i * cellW + cellW / 2;
      ctx.fillText(`P${score.holes[i].par}`, x, startY + 15);
    }

    // Scores
    for (let i = 0; i < 9; i++) {
      const holeScore = score.holes[i];
      if (holeScore.strokes === 0 && i > this.game.currentHoleIndex) continue;

      const strokes = i === this.game.currentHoleIndex && holeScore.strokes === 0
        ? this.game.currentStrokes
        : holeScore.strokes;

      if (strokes === 0) continue;

      const diff = strokes - holeScore.par;
      ctx.fillStyle =
        strokes === 1 ? "#ffff00" : diff < 0 ? "#00ff88" : diff === 0 ? "#ffffff" : "#ff6644";
      ctx.font = "bold 14px monospace";
      const x = startX + i * cellW + cellW / 2;
      ctx.fillText(`${strokes}`, x, startY + 35);
    }

    // Current hole indicator
    const currentX = startX + this.game.currentHoleIndex * cellW;
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(currentX, startY - 8, cellW, cellH + 25);
  }
}
