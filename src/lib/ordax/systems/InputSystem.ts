/**
 * 🎮 AAA Input System — Leak-free event handlers, action mapping, buffered input
 *
 * Critical fix: stores bound handler references so removeEventListener actually works.
 * SSR-safe: protege acessos a window e navigator
 *
 * @version 2.1.0
 */

import {
  safeGetGamepads,
  safeSetInterval,
  safeClearInterval,
  isBrowser,
} from "@/lib/ssr-guard";

// ── Types ───────────────────────────────────────────────────────────────

export interface InputState {
  keys: Map<string, KeyState>;
  mouse: MouseState;
  touch: TouchState;
  gamepads: GamepadState[];
}

export interface KeyState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  holdTime: number;
  repeatCount: number;
}

export interface MouseState {
  x: number; y: number;
  deltaX: number; deltaY: number;
  buttons: Map<number, ButtonState>;
  wheel: number;
  isOverCanvas: boolean;
}

export interface ButtonState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  clickCount: number;
}

export interface TouchState {
  touches: Map<number, TouchPoint>;
  maxTouches: number;
}

export interface TouchPoint {
  identifier: number;
  x: number; y: number;
  startX: number; startY: number;
  deltaX: number; deltaY: number;
  pressure: number;
  radiusX: number; radiusY: number;
  rotationAngle: number;
  force: number;
}

export interface GamepadState {
  index: number; id: string; connected: boolean;
  buttons: GamepadButton[]; axes: number[]; timestamp: number;
}

export interface GamepadButton {
  pressed: boolean; touched: boolean; value: number;
}

export interface InputConfig {
  enableKeyboard: boolean;
  enableMouse: boolean;
  enableTouch: boolean;
  enableGamepad: boolean;
  keyRepeatDelay: number;
  keyRepeatInterval: number;
  mouseSensitivity: number;
  touchSensitivity: number;
  gamepadDeadzone: number;
  maxInputBuffer: number;
  enableInputLogging: boolean;
}

export interface InputMapping {
  [action: string]: string[];
}

// ── Defaults ────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: InputConfig = {
  enableKeyboard: true, enableMouse: true, enableTouch: true, enableGamepad: true,
  keyRepeatDelay: 500, keyRepeatInterval: 50,
  mouseSensitivity: 1.0, touchSensitivity: 1.0, gamepadDeadzone: 0.1,
  maxInputBuffer: 10, enableInputLogging: false,
};

const DEFAULT_MAPPINGS: InputMapping = {
  moveUp: ['ArrowUp', 'KeyW'], moveDown: ['ArrowDown', 'KeyS'],
  moveLeft: ['ArrowLeft', 'KeyA'], moveRight: ['ArrowRight', 'KeyD'],
  jump: ['Space'], attack: ['KeyF'], interact: ['KeyE'],
  pause: ['Escape'], confirm: ['Enter', 'Space'], cancel: ['Escape'],
  menu: ['Tab'],
};

const GAME_KEYS = new Set([
  'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
  'KeyW','KeyA','KeyS','KeyD','Space','Enter','Escape','Tab','KeyF','KeyE',
]);

// ── Object Pools for zero-allocation hot path ───────────────────────────

const KEY_STATE_POOL: KeyState[] = [];
const BUTTON_STATE_POOL: ButtonState[] = [];
const MAX_KEY_POOL_SIZE = 20;
const MAX_BUTTON_POOL_SIZE = 10;

function acquireKeyState(): KeyState {
  if (KEY_STATE_POOL.length > 0) {
    const ks = KEY_STATE_POOL.pop()!;
    ks.pressed = false;
    ks.justPressed = false;
    ks.justReleased = false;
    ks.holdTime = 0;
    ks.repeatCount = 0;
    return ks;
  }
  return { pressed: false, justPressed: false, justReleased: false, holdTime: 0, repeatCount: 0 };
}

function releaseKeyState(ks: KeyState): void {
  if (KEY_STATE_POOL.length < MAX_KEY_POOL_SIZE) {
    KEY_STATE_POOL.push(ks);
  }
}

function acquireButtonState(): ButtonState {
  if (BUTTON_STATE_POOL.length > 0) {
    const bs = BUTTON_STATE_POOL.pop()!;
    bs.pressed = false;
    bs.justPressed = false;
    bs.justReleased = false;
    bs.clickCount = 0;
    return bs;
  }
  return { pressed: false, justPressed: false, justReleased: false, clickCount: 0 };
}

function releaseButtonState(bs: ButtonState): void {
  if (BUTTON_STATE_POOL.length < MAX_BUTTON_POOL_SIZE) {
    BUTTON_STATE_POOL.push(bs);
  }
}

// ── System ──────────────────────────────────────────────────────────────

export class InputSystem {
  private config: InputConfig;
  private mappings: InputMapping;
  private canvas: HTMLCanvasElement | null = null;
  private state: InputState;
  private inputBuffer: Array<{ type: string; data: unknown }> = [];
  private listeners = new Map<string, Set<(data: unknown) => void>>();

  // ★ Stored bound handlers — critical for proper removeEventListener
  private boundHandlers: Record<string, EventListener> = {};
  private gamepadPollInterval: number | null = null;

  constructor(config: Partial<InputConfig> = {}, mappings: InputMapping = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.mappings = { ...DEFAULT_MAPPINGS, ...mappings };
    this.state = this.createEmptyState();
  }

  // ── Canvas attachment ─────────────────────────────────────────────────

  attachToCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvas) this.detachFromCanvas();
    this.canvas = canvas;
    this.bindHandlers();
  }

  detachFromCanvas(): void {
    if (!this.canvas) return;
    this.unbindHandlers();
    this.canvas = null;
  }

  dispose(): void {
    this.detachFromCanvas();
    this.state = this.createEmptyState();
    this.listeners.clear();
    this.inputBuffer.length = 0;
  }

  private bindHandlers(): void {
    if (!this.canvas) return;
    if (!isBrowser()) return;
    
    const h = this.boundHandlers;

    // Create bound refs ONCE
    h.keydown = (e: Event) => this.onKeyDown(e as KeyboardEvent);
    h.keyup = (e: Event) => this.onKeyUp(e as KeyboardEvent);
    h.mousedown = (e: Event) => this.onMouseDown(e as MouseEvent);
    h.mouseup = (e: Event) => this.onMouseUp(e as MouseEvent);
    h.mousemove = (e: Event) => this.onMouseMove(e as MouseEvent);
    h.wheel = (e: Event) => this.onWheel(e as WheelEvent);
    h.mouseenter = () => { this.state.mouse.isOverCanvas = true; };
    h.mouseleave = () => { this.state.mouse.isOverCanvas = false; };
    h.touchstart = (e: Event) => this.onTouchStart(e as TouchEvent);
    h.touchend = (e: Event) => this.onTouchEnd(e as TouchEvent);
    h.touchmove = (e: Event) => this.onTouchMove(e as TouchEvent);
    h.touchcancel = (e: Event) => this.onTouchCancel(e as TouchEvent);

    if (this.config.enableKeyboard) {
      window.addEventListener('keydown', h.keydown);
      window.addEventListener('keyup', h.keyup);
    }
    if (this.config.enableMouse) {
      this.canvas.addEventListener('mousedown', h.mousedown);
      this.canvas.addEventListener('mouseup', h.mouseup);
      this.canvas.addEventListener('mousemove', h.mousemove);
      this.canvas.addEventListener('wheel', h.wheel);
      this.canvas.addEventListener('mouseenter', h.mouseenter);
      this.canvas.addEventListener('mouseleave', h.mouseleave);
    }
    if (this.config.enableTouch) {
      const opts: AddEventListenerOptions = { passive: false };
      this.canvas.addEventListener('touchstart', h.touchstart, opts);
      this.canvas.addEventListener('touchend', h.touchend, opts);
      this.canvas.addEventListener('touchmove', h.touchmove, opts);
      this.canvas.addEventListener('touchcancel', h.touchcancel, opts);
    }
    if (this.config.enableGamepad) {
      this.gamepadPollInterval = safeSetInterval(() => this.pollGamepads(), 16);
    }
  }

  private unbindHandlers(): void {
    if (!isBrowser()) return;
    
    const h = this.boundHandlers;
    window.removeEventListener('keydown', h.keydown);
    window.removeEventListener('keyup', h.keyup);
    if (this.canvas) {
      for (const evt of ['mousedown','mouseup','mousemove','wheel','mouseenter','mouseleave',
                          'touchstart','touchend','touchmove','touchcancel'] as const) {
        this.canvas.removeEventListener(evt, h[evt]);
      }
    }
    safeClearInterval(this.gamepadPollInterval);
    this.gamepadPollInterval = null;
    this.boundHandlers = {};
  }

  // ── Frame update ──────────────────────────────────────────────────────

  update(deltaTime: number): void {
    // Update hold times + repeat
    for (const [, ks] of this.state.keys) {
      if (ks.pressed) {
        ks.holdTime += deltaTime;
        if (ks.holdTime > this.config.keyRepeatDelay) {
          const repeats = Math.floor(
            (ks.holdTime - this.config.keyRepeatDelay) / this.config.keyRepeatInterval,
          );
          if (repeats > ks.repeatCount) ks.repeatCount = repeats;
        }
      }
    }
    // Poll gamepads
    if (this.config.enableGamepad) this.pollGamepads();

    // Clear "just" states (end of frame)
    for (const ks of this.state.keys.values()) { ks.justPressed = false; ks.justReleased = false; }
    for (const bs of this.state.mouse.buttons.values()) { bs.justPressed = false; bs.justReleased = false; }
    this.state.mouse.deltaX = 0;
    this.state.mouse.deltaY = 0;
    this.state.mouse.wheel = 0;
  }

  // ── Keyboard ──────────────────────────────────────────────────────────

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.code;
    let ks = this.state.keys.get(key);
    if (!ks) {
      ks = acquireKeyState();
      this.state.keys.set(key, ks);
    }
    if (!ks.pressed) { ks.pressed = true; ks.justPressed = true; ks.holdTime = 0; ks.repeatCount = 0; }
    if (GAME_KEYS.has(key)) e.preventDefault();
    this.emitEvent('keydown', { key });
  }

  private onKeyUp(e: KeyboardEvent): void {
    const ks = this.state.keys.get(e.code);
    if (ks) { ks.pressed = false; ks.justReleased = true; ks.holdTime = 0; }
    this.emitEvent('keyup', { key: e.code });
  }

  // ── Mouse ─────────────────────────────────────────────────────────────

  private onMouseDown(e: MouseEvent): void {
    let bs = this.state.mouse.buttons.get(e.button);
    if (!bs) { bs = acquireButtonState(); this.state.mouse.buttons.set(e.button, bs); }
    bs.pressed = true; bs.justPressed = true; bs.clickCount = e.detail;
    this.updateMouseXY(e);
  }

  private onMouseUp(e: MouseEvent): void {
    const bs = this.state.mouse.buttons.get(e.button);
    if (bs) { bs.pressed = false; bs.justReleased = true; }
    this.updateMouseXY(e);
  }

  private onMouseMove(e: MouseEvent): void {
    const oldX = this.state.mouse.x, oldY = this.state.mouse.y;
    this.updateMouseXY(e);
    this.state.mouse.deltaX = (this.state.mouse.x - oldX) * this.config.mouseSensitivity;
    this.state.mouse.deltaY = (this.state.mouse.y - oldY) * this.config.mouseSensitivity;
  }

  private onWheel(e: WheelEvent): void { this.state.mouse.wheel = e.deltaY; }

  private updateMouseXY(e: MouseEvent): void {
    if (!this.canvas) return;
    const r = this.canvas.getBoundingClientRect();
    this.state.mouse.x = e.clientX - r.left;
    this.state.mouse.y = e.clientY - r.top;
  }

  // ── Touch ─────────────────────────────────────────────────────────────

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      this.state.touch.touches.set(t.identifier, this.makeTouchPoint(t));
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.state.touch.touches.delete(e.changedTouches[i].identifier);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const old = this.state.touch.touches.get(t.identifier);
      const pt = this.makeTouchPoint(t);
      if (old) {
        pt.deltaX = (pt.x - old.x) * this.config.touchSensitivity;
        pt.deltaY = (pt.y - old.y) * this.config.touchSensitivity;
      }
      this.state.touch.touches.set(t.identifier, pt);
    }
  }

  private onTouchCancel(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.state.touch.touches.delete(e.changedTouches[i].identifier);
    }
  }

  private makeTouchPoint(t: Touch): TouchPoint {
    const r = this.canvas?.getBoundingClientRect();
    const x = r ? t.clientX - r.left : 0;
    const y = r ? t.clientY - r.top : 0;
    return {
      identifier: t.identifier, x, y, startX: x, startY: y,
      deltaX: 0, deltaY: 0, pressure: t.force || 0,
      radiusX: t.radiusX || 0, radiusY: t.radiusY || 0,
      rotationAngle: t.rotationAngle || 0, force: t.force || 0,
    };
  }

  // ── Gamepad ───────────────────────────────────────────────────────────

  private pollGamepads(): void {
    const gps = safeGetGamepads();
    for (let i = 0; i < gps.length; i++) {
      const gp = gps[i];
      if (!gp) { if (this.state.gamepads[i]) this.state.gamepads[i].connected = false; continue; }
      if (!this.state.gamepads[i] || !this.state.gamepads[i].connected) {
        this.state.gamepads[i] = {
          index: gp.index, id: gp.id, connected: true,
          buttons: gp.buttons.map(b => ({ pressed: b.pressed, touched: b.touched, value: b.value })),
          axes: [...gp.axes], timestamp: gp.timestamp,
        };
      } else {
        const s = this.state.gamepads[i];
        s.timestamp = gp.timestamp;
        for (let b = 0; b < gp.buttons.length && b < s.buttons.length; b++) {
          s.buttons[b].pressed = gp.buttons[b].pressed;
          s.buttons[b].touched = gp.buttons[b].touched;
          s.buttons[b].value = gp.buttons[b].value;
        }
        for (let a = 0; a < gp.axes.length && a < s.axes.length; a++) {
          s.axes[a] = Math.abs(gp.axes[a]) < this.config.gamepadDeadzone ? 0 : gp.axes[a];
        }
      }
    }
  }

  // ── Action mapping ────────────────────────────────────────────────────

  isActionPressed(action: string): boolean {
    const inputs = this.mappings[action];
    if (!inputs) return false;
    for (const inp of inputs) { if (this.state.keys.get(inp)?.pressed) return true; }
    return false;
  }

  isActionJustPressed(action: string): boolean {
    const inputs = this.mappings[action];
    if (!inputs) return false;
    for (const inp of inputs) { if (this.state.keys.get(inp)?.justPressed) return true; }
    return false;
  }

  isActionJustReleased(action: string): boolean {
    const inputs = this.mappings[action];
    if (!inputs) return false;
    for (const inp of inputs) { if (this.state.keys.get(inp)?.justReleased) return true; }
    return false;
  }

  getActionValue(action: string): number {
    const inputs = this.mappings[action];
    if (!inputs) return 0;
    for (const inp of inputs) { if (this.state.keys.get(inp)?.pressed) return 1; }
    return 0;
  }

  // ── Event emitter ─────────────────────────────────────────────────────

  on(event: string, cb: (data: unknown) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off(event: string, cb: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(cb);
  }

  private emitEvent(event: string, data: unknown): void {
    const cbs = this.listeners.get(event);
    if (!cbs) return;
    for (const cb of cbs) { try { cb(data); } catch { /* swallow */ } }
  }

  // ── Public API ────────────────────────────────────────────────────────

  getState(): InputState { return this.state; }
  getConfig(): InputConfig { return { ...this.config }; }
  getMappings(): InputMapping { return { ...this.mappings }; }
  isAttached(): boolean { return this.canvas !== null; }

  updateConfig(c: Partial<InputConfig>): void {
    this.config = { ...this.config, ...c };
    if (this.canvas) { this.unbindHandlers(); this.bindHandlers(); }
  }

  updateMappings(m: InputMapping): void { this.mappings = { ...this.mappings, ...m }; }

  clearState(): void {
    this.state = this.createEmptyState();
    this.inputBuffer.length = 0;
  }

  private createEmptyState(): InputState {
    return {
      keys: new Map(),
      mouse: { x: 0, y: 0, deltaX: 0, deltaY: 0, buttons: new Map(), wheel: 0, isOverCanvas: false },
      touch: { touches: new Map(), maxTouches: 10 },
      gamepads: [],
    };
  }
}

export default InputSystem;
