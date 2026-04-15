/**
 * 🕒 AAA Time System — Ring-buffer FPS tracking, zero-alloc metrics
 *
 * Features:
 * - Ring buffer for FPS/frame time samples (no shift() O(n))
 * - Cached metrics object (no allocation per frame)
 * - Time scaling and pause
 * - Frame skip detection
 *
 * @version 3.0.0 - SSOT compliant
 */

import { TIME_CONSTANTS } from '../config';

// ── Types ───────────────────────────────────────────────────────────────

export interface TimeMetrics {
  fps: number; frameTime: number; deltaTime: number;
  elapsedTime: number; scaledTime: number;
  frameCount: number; droppedFrames: number;
  averageFPS: number; minFPS: number; maxFPS: number;
}

export interface TimeSystemConfig {
  maxFPS: number; minDeltaTime: number; maxDeltaTime: number;
  timeScale: number; enableFPSLimiting: boolean;
  enablePerformanceLogging: boolean; performanceLogInterval: number;
  maxFrameSkip: number;
}

export interface TimeUpdateResult {
  deltaTime: number; scaledDeltaTime: number;
  shouldUpdate: boolean; droppedFrames: number;
  metrics: TimeMetrics;
}

// ── Ring buffer ─────────────────────────────────────────────────────────

class RingBuffer {
  private buf: Float64Array;
  private head = 0;
  private count = 0;

  constructor(private cap: number) { this.buf = new Float64Array(cap); }

  push(val: number): void {
    this.buf[this.head] = val;
    this.head = (this.head + 1) % this.cap;
    if (this.count < this.cap) this.count++;
  }

  avg(): number {
    if (this.count === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.count; i++) sum += this.buf[i];
    return sum / this.count;
  }

  last(): number { return this.count === 0 ? 0 : this.buf[(this.head - 1 + this.cap) % this.cap]; }
  size(): number { return this.count; }
  clear(): void { this.head = 0; this.count = 0; }
}

// ── Defaults ────────────────────────────────────────────────────────────

const DEFAULTS: TimeSystemConfig = {
  maxFPS: 60, minDeltaTime: 0.001, maxDeltaTime: 0.033,
  timeScale: 1.0, enableFPSLimiting: true,
  enablePerformanceLogging: false, performanceLogInterval: TIME_CONSTANTS.PERFORMANCE_LOG_INTERVAL_MS,
  maxFrameSkip: 5,
};

// ── System ──────────────────────────────────────────────────────────────

export class TimeSystem {
  private config: TimeSystemConfig;
  private lastTime = 0;
  private elapsedTime = 0;
  private scaledTime = 0;
  private frameCount = 0;
  private droppedFrames = 0;
  private isPaused = false;
  private minFPS = 0;
  private maxFPS = 0;

  private fpsSamples: RingBuffer;
  private frameTimes: RingBuffer;

  // Cached metrics object (reused every frame — zero alloc)
  private cachedMetrics: TimeMetrics = {
    fps: 0, frameTime: 0, deltaTime: 0,
    elapsedTime: 0, scaledTime: 0,
    frameCount: 0, droppedFrames: 0,
    averageFPS: 0, minFPS: 0, maxFPS: 0,
  };

  private cachedResult: TimeUpdateResult = {
    deltaTime: 0, scaledDeltaTime: 0,
    shouldUpdate: true, droppedFrames: 0,
    metrics: this.cachedMetrics,
  };

  constructor(config: Partial<TimeSystemConfig> = {}) {
    this.config = { ...DEFAULTS, ...config };
    this.fpsSamples = new RingBuffer(60);
    this.frameTimes = new RingBuffer(60);
    this.lastTime = performance.now();
  }

  // ── Main update ───────────────────────────────────────────────────────

  update(): TimeUpdateResult {
    const now = performance.now();
    if (this.lastTime === 0) { this.lastTime = now; }

    let rawDt = (now - this.lastTime) / TIME_CONSTANTS.MS_TO_SECONDS;
    if (!Number.isFinite(rawDt) || rawDt <= 0) rawDt = this.config.minDeltaTime;
    const dt = Math.max(this.config.minDeltaTime, Math.min(this.config.maxDeltaTime, rawDt));
    const scaledDt = this.isPaused ? 0 : dt * this.config.timeScale;

    // FPS limiting
    const targetFrame = 1 / this.config.maxFPS;
    const shouldUpdate = !this.config.enableFPSLimiting || dt >= targetFrame;
    const skipped = this.config.enableFPSLimiting
      ? Math.max(0, Math.min(Math.floor(dt / targetFrame) - 1, this.config.maxFrameSkip))
      : 0;

    // Metrics
    const fps = dt > 0 ? 1 / dt : 0;
    this.fpsSamples.push(fps);
    this.frameTimes.push(dt * TIME_CONSTANTS.SECONDS_TO_MS);
    if (fps > 0 && (this.minFPS === 0 || fps < this.minFPS)) this.minFPS = fps;
    if (fps > this.maxFPS) this.maxFPS = fps;

    if (!this.isPaused) {
      this.elapsedTime += dt;
      this.scaledTime += scaledDt;
    }
    this.lastTime = now;
    this.frameCount++;
    this.droppedFrames += skipped;

    // Fill cached result (zero alloc)
    const m = this.cachedMetrics;
    m.fps = fps; m.frameTime = dt * TIME_CONSTANTS.SECONDS_TO_MS; m.deltaTime = dt;
    m.elapsedTime = this.elapsedTime; m.scaledTime = this.scaledTime;
    m.frameCount = this.frameCount; m.droppedFrames = this.droppedFrames;
    m.averageFPS = this.fpsSamples.avg();
    m.minFPS = this.minFPS;
    m.maxFPS = this.maxFPS;

    const r = this.cachedResult;
    r.deltaTime = dt; r.scaledDeltaTime = scaledDt;
    r.shouldUpdate = shouldUpdate; r.droppedFrames = skipped;
    return r;
  }

  // ── Controls ──────────────────────────────────────────────────────────

  pause(): void { this.isPaused = true; }
  resume(): void { if (this.isPaused) { this.isPaused = false; this.lastTime = performance.now(); } }
  setTimeScale(s: number): void { if (s > 0) this.config.timeScale = s; }
  getTimeScale(): number { return this.config.timeScale; }
  isTimePaused(): boolean { return this.isPaused; }
  getElapsedTime(): number { return this.elapsedTime; }
  getScaledTime(): number { return this.scaledTime; }
  getFrameCount(): number { return this.frameCount; }
  getDroppedFrames(): number { return this.droppedFrames; }
  getFPS(): number { return this.cachedMetrics.fps; }
  getAverageFPS(): number { return this.cachedMetrics.averageFPS; }
  getFrameTime(): number { return this.cachedMetrics.frameTime; }
  getMetrics(): TimeMetrics { return this.cachedMetrics; }
  getConfig(): TimeSystemConfig { return { ...this.config }; }
  updateConfig(c: Partial<TimeSystemConfig>): void { this.config = { ...this.config, ...c }; }

  reset(): void {
    this.lastTime = performance.now();
    this.elapsedTime = 0; this.scaledTime = 0;
    this.frameCount = 0; this.droppedFrames = 0;
    this.isPaused = false; this.minFPS = 0; this.maxFPS = 0;
    this.fpsSamples.clear(); this.frameTimes.clear();
  }

  dispose(): void { this.fpsSamples.clear(); this.frameTimes.clear(); }
}

export default TimeSystem;
