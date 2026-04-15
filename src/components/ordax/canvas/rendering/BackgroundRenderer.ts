/**
 * Background Renderer - Handles rendering of background layers (starfield, gradients, nebula, racing road)
 */

import { hslToHsla, normalizeCssColor } from "../colorUtils";
import { WORLD } from "../constants";
import type { OrdaxSpec, OrdaxEntity } from "@/lib/ordax/types";

type Star = { x: number; y: number; s: number; brightness?: number; pulsePhase?: number; pulseSpeed?: number; colorIdx?: number };

type ShootingStar = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  length: number; brightness: number;
};

type RenderContext = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  ox: number;
  oy: number;
  w: number;
  h: number;
  theme: OrdaxSpec["visual"]["theme"];
  gameType: string;
  bgLayers: Record<string, unknown>[];
  bgConfig?: OrdaxSpec["visual"]["background"]; // ✅ NEW: Background config from spec
  stars: Star[];
  t: number;
  dt: number;
  getPlayerEntity: () => OrdaxEntity | undefined;
};

export class BackgroundRenderer {
  private context: RenderContext;

  private shootingStars: ShootingStar[] = [];
  private nextShootingStarTime: number = 0;

  constructor(context: RenderContext) {
    this.context = context;
  }

  updateContext(context: Partial<RenderContext>) {
    this.context = { ...this.context, ...context };
  }

  renderBackground() {
    this.renderBaseBackground();
    this.renderLetterbox();
    this.renderParallaxLayers();
    this.updateAndRenderShootingStars();
  }

  private renderBaseBackground() {
    const { ctx, theme, w, h } = this.context;
    const bgColor = normalizeCssColor(theme?.background, "hsl(0, 0%, 4%)");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  private renderLetterbox() {
    const { ctx, ox, oy, scale, w, h } = this.context;
    
    // Subtle letterbox shading so the world frame feels intentional
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, w, Math.max(0, oy));
    ctx.fillRect(0, oy + WORLD.h * scale, w, Math.max(0, h - (oy + WORLD.h * scale)));
    ctx.fillRect(0, oy, Math.max(0, ox), WORLD.h * scale);
    ctx.fillRect(ox + WORLD.w * scale, oy, Math.max(0, w - (ox + WORLD.w * scale)), WORLD.h * scale);
  }

  private renderParallaxLayers() {
    const { bgLayers, ox, oy, scale, getPlayerEntity } = this.context;

    for (const layer of bgLayers) {
      const par = layer.parallax ?? 0;
      const player = getPlayerEntity();
      const camX = (player?.x ?? WORLD.w / 2) - WORLD.w / 2;
      const camY = (player?.y ?? WORLD.h / 2) - WORLD.h / 2;
      const px = ox - camX * par * scale;
      const py = oy - camY * par * scale;

      if (layer.type === "starfield") {
        this.renderStarfield(layer, px, py);
      } else if (layer.type === "gradient") {
        this.renderGradient(px, py);
      } else if (layer.type === "nebula") {
        this.renderNebula();
      }
    }
  }

  private renderStarfield(layer: Record<string, unknown>, px: number, py: number) {
    const { ctx, stars, dt, scale, w, h, t } = this.context;
    const worldPxW = WORLD.w * scale;
    const worldPxH = WORLD.h * scale;
    const time = t / 1000;

    const STAR_COLORS = [
      "255,255,255",   // white
      "255,255,204",   // warm yellow
      "204,235,255",   // cool blue
      "255,210,230",   // soft pink
    ];

    const speedY = layer.speedY ?? 0;
    stars.forEach((st) => {
      st.y += speedY * dt;
      if (st.y > WORLD.h) st.y = 0;
      if (st.y < 0) st.y = WORLD.h;
    });

    // Tile the starfield to cover the whole canvas
    for (let tx = -worldPxW; tx <= w + worldPxW; tx += worldPxW) {
      for (let ty = -worldPxH; ty <= h + worldPxH; ty += worldPxH) {
        for (const st of stars) {
          const sx = px + tx + st.x * scale;
          const sy = py + ty + st.y * scale;
          if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

          const pulse = st.pulseSpeed
            ? 0.5 + 0.5 * Math.sin(time * st.pulseSpeed + (st.pulsePhase ?? 0))
            : 1;
          const alpha = (st.brightness ?? 0.8) * (0.4 + 0.6 * pulse);
          const color = STAR_COLORS[st.colorIdx ?? 0] ?? STAR_COLORS[0];
          const size = st.s * scale;

          // Large stars get a soft glow
          if (st.s > 2.2) {
            const glowR = size * 2.5;
            ctx.globalAlpha = alpha * 0.15;
            const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
            grad.addColorStop(0, `rgba(${color},0.6)`);
            grad.addColorStop(1, `rgba(${color},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
            ctx.globalAlpha = 1;
          }

          ctx.fillStyle = `rgba(${color},${alpha.toFixed(2)})`;
          ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
        }
      }
    }
  }

  private renderGradient(px: number, py: number) {
    const { gameType } = this.context;

    if (gameType === "racing") {
      this.renderRacingRoad(px, py);
    } else if (gameType === "platformer") {
      this.renderPlatformerGradient(px, py);
    } else {
      this.renderGenericGradient(px, py);
    }
  }

  private renderRacingRoad(px: number, py: number) {
    const { ctx, scale, t } = this.context;
    
    const bgConfig = this.context.bgConfig;
    const racingRoadConfig = bgConfig?.racingRoad;
    
    const roadWidth = racingRoadConfig?.roadWidth ?? 0.52;
    const scrollSpeed = racingRoadConfig?.scrollSpeed ?? 260;
    
    const roadW = WORLD.w * roadWidth;
    const roadX = (WORLD.w - roadW) / 2;
    const scroll = (t / 1000) * scrollSpeed;
    const wPx = WORLD.w * scale;
    const hPx = WORLD.h * scale;
    const roadXpx = px + roadX * scale;
    const roadWpx = roadW * scale;

    // ── Grass with striped texture ──
    ctx.fillStyle = "rgba(18, 82, 38, 0.5)";
    ctx.fillRect(px, py, wPx, hPx);
    // Grass stripes scrolling
    ctx.fillStyle = "rgba(30, 110, 50, 0.25)";
    const grassStripeH = 32;
    for (let y0 = -grassStripeH * 2; y0 < WORLD.h + grassStripeH * 2; y0 += grassStripeH * 2) {
      const yy = y0 + (scroll % (grassStripeH * 2));
      ctx.fillRect(px, py + yy * scale, wPx, grassStripeH * scale);
    }

    // ── Rumble strips (red/white kerbs) ──
    const kerbW = 10 * scale;
    const kerbH = 18;
    const kerbGap = 18;
    for (let y0 = -kerbH * 2; y0 < WORLD.h + kerbH * 2; y0 += kerbH + kerbGap) {
      const yy = y0 + (scroll % (kerbH + kerbGap));
      const idx = Math.floor((y0 + 10000) / (kerbH + kerbGap));
      const isRed = idx % 2 === 0;
      ctx.fillStyle = isRed ? "rgba(220, 40, 40, 0.7)" : "rgba(255, 255, 255, 0.7)";
      // Left kerb
      ctx.fillRect(roadXpx - kerbW, py + yy * scale, kerbW, kerbH * scale);
      // Right kerb
      ctx.fillRect(roadXpx + roadWpx, py + yy * scale, kerbW, kerbH * scale);
    }

    // ── Road surface ──
    const roadGrad = ctx.createLinearGradient(roadXpx, py, roadXpx + roadWpx, py);
    roadGrad.addColorStop(0, "rgba(40, 40, 48, 0.92)");
    roadGrad.addColorStop(0.15, "rgba(52, 52, 60, 0.92)");
    roadGrad.addColorStop(0.5, "rgba(58, 58, 66, 0.92)");
    roadGrad.addColorStop(0.85, "rgba(52, 52, 60, 0.92)");
    roadGrad.addColorStop(1, "rgba(40, 40, 48, 0.92)");
    ctx.fillStyle = roadGrad;
    ctx.fillRect(roadXpx, py, roadWpx, hPx);

    // ── Lane dividers (two lanes, dashed white) ──
    const laneCount = 3;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    const dashH = 28;
    const gap = 20;
    const lineW = 3;
    for (let lane = 1; lane < laneCount; lane++) {
      const lx = roadX + (roadW / laneCount) * lane;
      for (let y0 = -dashH; y0 < WORLD.h + dashH; y0 += dashH + gap) {
        const yy = y0 + (scroll % (dashH + gap));
        ctx.fillRect(
          px + (lx - lineW / 2) * scale,
          py + yy * scale,
          lineW * scale,
          dashH * scale
        );
      }
    }

    // ── Road edge lines (solid white) ──
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    const edgeW = 3 * scale;
    ctx.fillRect(roadXpx, py, edgeW, hPx);
    ctx.fillRect(roadXpx + roadWpx - edgeW, py, edgeW, hPx);

    // ── Speed lines effect ──
    this.renderSpeedLines(px, py);
  }

  private renderSpeedLines(px: number, py: number) {
    const { ctx, scale, t } = this.context;
    const wPx = WORLD.w * scale;
    const hPx = WORLD.h * scale;

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;

    const speedScroll = (t / 1000) * 400;
    const lineCount = 12;
    // Deterministic pseudo-random positions
    for (let i = 0; i < lineCount; i++) {
      const seed = (i * 137.5) % 1;
      const xOff = seed * wPx;
      const lineLen = 30 + (i % 5) * 15;
      const yBase = ((i * 73.7 + speedScroll) % (WORLD.h + lineLen * 2)) - lineLen;

      ctx.beginPath();
      ctx.moveTo(px + xOff, py + yBase * scale);
      ctx.lineTo(px + xOff, py + (yBase + lineLen) * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderPlatformerGradient(px: number, py: number) {
    const { ctx, w, h, scale, theme } = this.context;
    
    // ✅ CORREÇÃO: Usar theme colors ao invés de hardcode
    const skyColor = theme?.primary ?? "hsl(200, 80%, 70%)";
    const groundColor = theme?.accent ?? "hsl(120, 40%, 30%)";
    
    const g = ctx.createLinearGradient(px, py, px, py + WORLD.h * scale);
    g.addColorStop(0, skyColor.includes("hsl") ? skyColor.replace(")", ", 0.35)").replace("hsl", "hsla") : "rgba(120, 190, 255, 0.35)");
    g.addColorStop(1, groundColor.includes("hsl") ? groundColor.replace(")", ", 0.35)").replace("hsl", "hsla") : "rgba(20, 40, 20, 0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  private renderGenericGradient(px: number, py: number) {
    const { ctx, theme, w, h, scale, t, bgLayers } = this.context;
    
    const bg = normalizeCssColor(theme?.background, "hsl(0, 0%, 4%)");
    const p = normalizeCssColor(theme?.primary, "hsl(200, 80%, 50%)");
    const a = normalizeCssColor(theme?.accent, "hsl(300, 70%, 50%)");

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, hslToHsla(bg, 1));
    g.addColorStop(0.55, hslToHsla(p, 0.16));
    g.addColorStop(1, hslToHsla(a, 0.18));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Subtle dunes/noise stripes for "desert" vibes
    const maybeWarm = /hsl\(\s*(3\d|4\d|5\d)/.test(p) || /hsl\(\s*(3\d|4\d|5\d)/.test(a);
    const hasStarfield = bgLayers.some((l) => l.type === "starfield" || l.type === "nebula");
    
    if (maybeWarm && !hasStarfield) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 10; i++) {
        const yy = py + (WORLD.h * (0.45 + i * 0.06)) * scale;
        ctx.beginPath();
        ctx.moveTo(px - 40, yy);
        ctx.quadraticCurveTo(
          px + WORLD.w * 0.5 * scale,
          yy + (Math.sin((t / 1000) + i) * 12) * scale,
          px + WORLD.w * scale + 40,
          yy
        );
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }

  private renderNebula() {
    const { ctx, theme, w, h, t } = this.context;
    const accentColor = normalizeCssColor(theme?.accent, "hsl(300, 70%, 50%)");

    // Render soft, cloud-like nebula blobs instead of a solid bar
    ctx.save();
    const time = t / 1000;
    const blobs = [
      { cx: w * 0.25, cy: h * 0.35, rx: w * 0.22, ry: h * 0.12, phase: 0 },
      { cx: w * 0.65, cy: h * 0.28, rx: w * 0.18, ry: h * 0.10, phase: 1.2 },
      { cx: w * 0.45, cy: h * 0.55, rx: w * 0.20, ry: h * 0.08, phase: 2.5 },
      { cx: w * 0.80, cy: h * 0.50, rx: w * 0.14, ry: h * 0.09, phase: 3.8 },
    ];

    for (const blob of blobs) {
      const drift = Math.sin(time * 0.3 + blob.phase) * 8;
      const alpha = 0.04 + Math.sin(time * 0.2 + blob.phase) * 0.02;
      const grad = ctx.createRadialGradient(
        blob.cx + drift, blob.cy, 0,
        blob.cx + drift, blob.cy, Math.max(blob.rx, blob.ry)
      );
      grad.addColorStop(0, hslToHsla(accentColor, alpha * 2));
      grad.addColorStop(0.5, hslToHsla(accentColor, alpha));
      grad.addColorStop(1, hslToHsla(accentColor, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(blob.cx + drift, blob.cy, blob.rx, blob.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private updateAndRenderShootingStars() {
    const { ctx, w, h, t, dt, bgLayers } = this.context;
    // Only render in starfield scenes
    if (!bgLayers.some((l) => l.type === "starfield")) return;

    const time = t / 1000;

    // Spawn new shooting stars occasionally (every 2-6 seconds)
    if (time > this.nextShootingStarTime && this.shootingStars.length < 3) {
      const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2; // ~30-60° diagonal
      const speed = 400 + Math.random() * 500;
      this.shootingStars.push({
        x: Math.random() * w * 0.8,
        y: -10 - Math.random() * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.6,
        maxLife: 0.6 + Math.random() * 0.6,
        length: 40 + Math.random() * 80,
        brightness: 0.6 + Math.random() * 0.4,
      });
      this.nextShootingStarTime = time + 2 + Math.random() * 4;
    }

    // Update & render
    this.shootingStars = this.shootingStars.filter((ss) => {
      ss.life -= dt;
      if (ss.life <= 0) return false;
      ss.x += ss.vx * dt;
      ss.y += ss.vy * dt;
      if (ss.x > w + 100 || ss.y > h + 100) return false;

      const alpha = ss.brightness * Math.min(1, ss.life / (ss.maxLife * 0.3)) * Math.min(1, (ss.maxLife - ss.life) / 0.1);
      const tailX = ss.x - (ss.vx / Math.hypot(ss.vx, ss.vy)) * ss.length;
      const tailY = ss.y - (ss.vy / Math.hypot(ss.vx, ss.vy)) * ss.length;

      // Glow
      ctx.save();
      ctx.globalAlpha = alpha * 0.25;
      ctx.strokeStyle = "rgba(200, 220, 255, 0.8)";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Core trail
      ctx.globalAlpha = alpha;
      const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.3, "rgba(200, 220, 255, 0.7)");
      grad.addColorStop(1, "rgba(150, 180, 255, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Bright head
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return true;
    });
  }
}
