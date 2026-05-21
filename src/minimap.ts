/**
 * Holo Golf VR — Mini Map
 * Overhead 2D mini-map showing hole layout, ball position, tee, and hole.
 * Rendered as an HTML overlay in the bottom-left corner.
 */
import { GameManager, GameState } from "./game";
import { BallController } from "./ball";
import { CourseManager, HoleData } from "./course";

export class MiniMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private game: GameManager;
  private ball: BallController;
  private visible = false;
  private animationFrame = 0;

  constructor(game: GameManager, ball: BallController) {
    this.game = game;
    this.ball = ball;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 160;
    this.canvas.height = 160;
    this.canvas.style.cssText = `
      position: fixed; bottom: 20px; left: 20px;
      width: 140px; height: 140px;
      background: rgba(0, 10, 25, 0.8);
      border: 1px solid #003355;
      z-index: 110;
      display: none;
      image-rendering: pixelated;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
  }

  update(dt: number) {
    const state = this.game.state;
    const shouldShow = state === GameState.AIMING || state === GameState.BALL_MOVING ||
                       state === GameState.HOLE_COMPLETE || state === GameState.PLAYING;

    if (shouldShow && !this.visible) {
      this.visible = true;
      this.canvas.style.display = "block";
    } else if (!shouldShow && this.visible) {
      this.visible = false;
      this.canvas.style.display = "none";
    }

    if (!this.visible) return;

    this.animationFrame++;
    if (this.animationFrame % 3 !== 0) return; // Render every 3rd frame for perf

    this.redraw();
  }

  private redraw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const hole = this.game.getCurrentHole();
    if (!hole) return;

    ctx.clearRect(0, 0, w, h);

    // Background with scan-line effect
    ctx.fillStyle = "rgba(0, 8, 18, 0.9)";
    ctx.fillRect(0, 0, w, h);

    // Border
    const colors = ["#00ccff", "#ff44aa", "#ff6600"];
    const themeColor = colors[this.game.currentCourseIndex] || colors[0];
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Calculate bounds from hole geometry
    const tee = hole.teePosition;
    const cup = hole.holePosition;

    // Find extent of all surfaces
    let minX = Math.min(tee.x, cup.x);
    let maxX = Math.max(tee.x, cup.x);
    let minZ = Math.min(tee.z, cup.z);
    let maxZ = Math.max(tee.z, cup.z);

    for (const s of hole.surfaces) {
      const sx = s.position.x;
      const sz = s.position.z;
      const hw = s.size[0] / 2;
      const hd = s.size[2] / 2;
      minX = Math.min(minX, sx - hw);
      maxX = Math.max(maxX, sx + hw);
      minZ = Math.min(minZ, sz - hd);
      maxZ = Math.max(maxZ, sz + hd);
    }

    // Add padding
    const padX = (maxX - minX) * 0.15 + 0.5;
    const padZ = (maxZ - minZ) * 0.15 + 0.5;
    minX -= padX; maxX += padX;
    minZ -= padZ; maxZ += padZ;

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const margin = 12;
    const drawW = w - margin * 2;
    const drawH = h - margin * 2;
    const scale = Math.min(drawW / rangeX, drawH / rangeZ);

    const toScreenX = (x: number) => margin + (x - minX) * scale;
    const toScreenZ = (z: number) => margin + (z - minZ) * scale;

    // Draw surfaces
    ctx.fillStyle = "rgba(0, 40, 60, 0.6)";
    ctx.strokeStyle = "rgba(0, 100, 140, 0.5)";
    ctx.lineWidth = 0.5;
    for (const s of hole.surfaces) {
      const sx = toScreenX(s.position.x - s.size[0] / 2);
      const sz = toScreenZ(s.position.z - s.size[2] / 2);
      const sw = s.size[0] * scale;
      const sh = s.size[2] * scale;
      ctx.fillRect(sx, sz, sw, sh);
      ctx.strokeRect(sx, sz, sw, sh);
    }

    // Draw walls
    ctx.fillStyle = "rgba(0, 80, 120, 0.8)";
    for (const wall of hole.walls) {
      const wx = toScreenX(wall.position.x - wall.size[0] / 2);
      const wz = toScreenZ(wall.position.z - wall.size[2] / 2);
      const ww = Math.max(wall.size[0] * scale, 1);
      const wh = Math.max(wall.size[2] * scale, 1);
      ctx.fillRect(wx, wz, ww, wh);
    }

    // Draw obstacles
    ctx.fillStyle = "rgba(255, 100, 50, 0.6)";
    for (const obs of hole.obstacles) {
      const ox = toScreenX(obs.position.x);
      const oz = toScreenZ(obs.position.z);
      if (obs.type === "bumper") {
        ctx.beginPath();
        ctx.arc(ox, oz, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(ox - 2, oz - 2, 4, 4);
      }
    }

    // Draw tee marker
    ctx.fillStyle = "#44ff88";
    ctx.beginPath();
    ctx.arc(toScreenX(tee.x), toScreenZ(tee.z), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("T", toScreenX(tee.x), toScreenZ(tee.z) - 6);

    // Draw hole/cup marker
    const pulse = 0.5 + Math.sin(performance.now() * 0.005) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 0, ${0.5 + pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(toScreenX(cup.x), toScreenZ(cup.z), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(toScreenX(cup.x), toScreenZ(cup.z), 5 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw ball position
    if (this.ball.isActive) {
      const bx = toScreenX(this.ball.position.x);
      const bz = toScreenZ(this.ball.position.z);
      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(bx, bz, 3, 0, Math.PI * 2);
      ctx.fill();

      // Ball glow
      ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(bx, bz, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = themeColor;
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`H${hole.index + 1}`, 4, 10);
  }
}
