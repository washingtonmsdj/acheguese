import * as THREE from "three";
import type { OrdaxThreeContext, OrdaxThreeGame } from "./types";

type OrdaxThreeRuntimeOptions = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  createGame: () => OrdaxThreeGame;
  maxDtSeconds?: number;
  /** Fixed timestep for deterministic physics (e.g. 1/60). If omitted, uses variable dt. */
  fixedDtSeconds?: number;
  /** Max fixed steps per frame to avoid spiral of death (default 8). */
  maxSubsteps?: number;
};

export class OrdaxThreeRuntime {
  private raf = 0;
  private running = false;
  private lastT = 0;
  private tSeconds = 0;
  private accumulator = 0;
  private lastFrameDt = 0;
  private lastSubsteps = 0;
  private ro: ResizeObserver | null = null;
  private initialized = false;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private game: OrdaxThreeGame;

  constructor(private opts: OrdaxThreeRuntimeOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    this.game = opts.createGame();
  }

  private getCtx(): OrdaxThreeContext {
    return {
      canvas: this.opts.canvas,
      container: this.opts.container,
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
    };
  }

  private resize = () => {
    const w = this.opts.container.clientWidth;
    const h = this.opts.container.clientHeight;
    if (w <= 0 || h <= 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  async start() {
    if (this.running) return;
    this.running = true;

    if (!this.initialized) {
      await this.game.init(this.getCtx());
      this.initialized = true;
    }

    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(this.opts.container);
    this.resize();

    this.lastT = performance.now();
    this.accumulator = 0;
    this.lastFrameDt = 0;
    this.lastSubsteps = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  dispose() {
    this.stop();
    this.ro?.disconnect();
    this.ro = null;

    try {
      this.game.dispose();
    } catch {
      // ignore
    }

    this.scene.traverse((obj) => {
      const threeObj = obj as { geometry?: { dispose?: () => void }; material?: unknown | unknown[] };
      if (threeObj.geometry) threeObj.geometry.dispose?.();
      if (threeObj.material) {
        if (Array.isArray(threeObj.material)) (threeObj.material as { dispose?: () => void }[]).forEach((m) => m.dispose?.());
        else (threeObj.material as { dispose?: () => void }).dispose?.();
      }
    });

    this.renderer.dispose();
  }

  /** Lightweight stats for on-screen debugging/telemetry. */
  getDebugStats() {
    return {
      running: this.running,
      tSeconds: this.tSeconds,
      lastFrameDt: this.lastFrameDt,
      fixedDtSeconds: this.opts.fixedDtSeconds ?? null,
      accumulator: this.accumulator,
      lastSubsteps: this.lastSubsteps,
      maxSubsteps: this.opts.maxSubsteps ?? 8,
    };
  }

  private loop = (tMs: number) => {
    if (!this.running) return;

    const frameDt = Math.min(this.opts.maxDtSeconds ?? 0.05, Math.max(0.001, (tMs - this.lastT) / 1000));
    this.lastT = tMs;
    this.lastFrameDt = frameDt;
    this.lastSubsteps = 0;

    const fixedDt = this.opts.fixedDtSeconds;
    if (fixedDt && fixedDt > 0) {
      this.accumulator += frameDt;
      const maxSteps = Math.max(1, this.opts.maxSubsteps ?? 8);

      let steps = 0;
      while (this.accumulator >= fixedDt && steps < maxSteps) {
        this.tSeconds += fixedDt;
        this.game.update(fixedDt, this.tSeconds);
        this.accumulator -= fixedDt;
        steps++;
      }

      this.lastSubsteps = steps;

      // If we're too far behind, drop the remaining accumulator to keep responsive.
      if (steps >= maxSteps) this.accumulator = 0;
    } else {
      this.tSeconds += frameDt;
      this.game.update(frameDt, this.tSeconds);
      this.lastSubsteps = 1;
    }

    this.renderer.render(this.scene, this.camera);

    this.raf = requestAnimationFrame(this.loop);
  };
}
