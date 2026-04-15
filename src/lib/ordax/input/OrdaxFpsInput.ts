import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export type OrdaxFpsInputOptions = {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  /** Called on lock/unlock. */
  onLockChange?: (locked: boolean) => void;
  /** Optional UX hint text. */
  onHint?: (hint: string) => void;
};

/**
 * FPS input profile (Pointer Lock + WASD + jump + sprint).
 *
 * - Click to lock.
 * - ESC unlocks (browser default).
 * - Movement axes are computed in world-space from camera look.
 */
export class OrdaxFpsInput {
  readonly controls: PointerLockControls;

  private keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
  };

  private jumpQueued = false;

  private onKeyDown?: (e: KeyboardEvent) => void;
  private onKeyUp?: (e: KeyboardEvent) => void;
  private onClick?: () => void;
  private onLock?: () => void;
  private onUnlock?: () => void;

  private forwardDir = new THREE.Vector3();
  private rightDir = new THREE.Vector3();
  private move = new THREE.Vector3();

  constructor(private opts: OrdaxFpsInputOptions) {
    this.controls = new PointerLockControls(opts.camera, opts.domElement);
  }

  mount() {
    const { domElement, onHint, onLockChange } = this.opts;

    this.onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") this.keys.w = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") this.keys.a = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") this.keys.s = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") this.keys.d = true;
      if (e.key === " ") {
        this.keys.space = true;
        this.jumpQueued = true;
      }
      if (e.key === "Shift") this.keys.shift = true;
    };

    this.onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") this.keys.w = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") this.keys.a = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") this.keys.s = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") this.keys.d = false;
      if (e.key === " ") this.keys.space = false;
      if (e.key === "Shift") this.keys.shift = false;
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.onLock = () => {
      onLockChange?.(true);
      onHint?.("WASD mover • Space pular • Shift correr • ESC destravar");
    };
    this.onUnlock = () => {
      onLockChange?.(false);
      onHint?.("Clique no mundo para travar o mouse (Pointer Lock)");
    };

    this.controls.addEventListener("lock", this.onLock);
    this.controls.addEventListener("unlock", this.onUnlock);

    this.onClick = () => {
      if (!this.controls.isLocked) this.controls.lock();
    };
    domElement.addEventListener("click", this.onClick);

    // Initial UX
    onLockChange?.(false);
    onHint?.("Clique no mundo para travar o mouse (Pointer Lock)");
  }

  dispose() {
    const { domElement } = this.opts;
    if (this.onClick) domElement.removeEventListener("click", this.onClick);
    if (this.onKeyDown) window.removeEventListener("keydown", this.onKeyDown);
    if (this.onKeyUp) window.removeEventListener("keyup", this.onKeyUp);
    if (this.onLock) this.controls.removeEventListener("lock", this.onLock);
    if (this.onUnlock) this.controls.removeEventListener("unlock", this.onUnlock);

    this.controls.unlock();
    (this.controls as unknown as { dispose?: () => void })?.dispose?.();
  }

  get locked() {
    return this.controls.isLocked;
  }

  get sprinting() {
    return this.keys.shift;
  }

  /** Consume a jump event (edge-triggered). */
  consumeJump(): boolean {
    const j = this.jumpQueued;
    this.jumpQueued = false;
    return j;
  }

  /** Returns normalized move direction in world space (XZ plane). */
  getMoveDirXZ(): THREE.Vector3 {
    const forward = (this.keys.w ? 1 : 0) - (this.keys.s ? 1 : 0);
    const right = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);

    this.opts.camera.getWorldDirection(this.forwardDir);
    this.forwardDir.y = 0;
    if (this.forwardDir.lengthSq() > 0) this.forwardDir.normalize();
    this.rightDir.crossVectors(this.forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

    this.move.set(0, 0, 0);
    if (right !== 0) this.move.addScaledVector(this.rightDir, right);
    if (forward !== 0) this.move.addScaledVector(this.forwardDir, forward);
    if (this.move.lengthSq() > 0) this.move.normalize();
    return this.move;
  }

  getDebugStats() {
    const dir = this.getMoveDirXZ();
    return {
      locked: this.locked,
      sprinting: this.sprinting,
      jumpQueued: this.jumpQueued,
      keys: { ...this.keys },
      moveDir: { x: dir.x, z: dir.z },
    };
  }
}
