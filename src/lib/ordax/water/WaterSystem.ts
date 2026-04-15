/**
 * WaterSystem - SSOT (Single Source of Truth) para o estado da água
 *
 * Centraliza:
 * - Nível atual da água (WORLD_WATER_LEVEL)
 * - Nível alvo (TARGET_WATER_LEVEL)
 * - Taxa de subida (WATER_RISE_SPEED)
 * - Estado do dilúvio (fase, progresso)
 *
 * Toda a cena lê o nível da água DAQUI.
 * Nenhum componente visual ou de física deve manter seu próprio nível de água.
 */

export interface WaterSystemConfig {
  /** Nível inicial da água (metros) */
  initialLevel: number;
  /** Nível máximo da água (metros) */
  maxLevel: number;
  /** Taxa de subida em metros/segundo (já ajustada para timeScale) */
  riseRatePerSecond: number;
}

export type WaterFloodState = "idle" | "rising" | "peaked";

export class WaterSystem {
  // ── Estado interno ──────────────────────────────────────────────────────────
  private _level: number;
  private _targetLevel: number;
  private _maxLevel: number;
  private _riseRate: number;
  private _state: WaterFloodState = "idle";
  private _progress: number = 0;
  private readonly _initialLevel: number;

  constructor(config: WaterSystemConfig) {
    if (!Number.isFinite(config.initialLevel)) throw new Error("WaterSystem: initialLevel inválido");
    if (!Number.isFinite(config.maxLevel)) throw new Error("WaterSystem: maxLevel inválido");
    if (!Number.isFinite(config.riseRatePerSecond) || config.riseRatePerSecond < 0)
      throw new Error("WaterSystem: riseRatePerSecond inválido");

    this._level = config.initialLevel;
    this._targetLevel = config.initialLevel;
    this._maxLevel = config.maxLevel;
    this._riseRate = config.riseRatePerSecond;
    this._initialLevel = config.initialLevel;
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  /** Nível atual da água em metros */
  get level(): number {
    return this._level;
  }

  /** Nível alvo da água em metros */
  get targetLevel(): number {
    return this._targetLevel;
  }

  /** Nível máximo configurado */
  get maxLevel(): number {
    return this._maxLevel;
  }

  /** Estado atual do dilúvio */
  get state(): WaterFloodState {
    return this._state;
  }

  /** Progresso do dilúvio (0–1) */
  get progress(): number {
    return this._progress;
  }

  /** Nível inicial (imutável) */
  get initialLevel(): number {
    return this._initialLevel;
  }

  // ── Setters / controle ───────────────────────────────────────────────────────

  /** Define o nível diretamente (sem animação) */
  setLevel(level: number): void {
    if (!Number.isFinite(level)) return;
    this._level = Math.min(level, this._maxLevel);
    this._updateProgress();
    // Transitar para "peaked" se atingiu o máximo
    if (this._level >= this._maxLevel && this._state === "rising") {
      this._state = "peaked";
    }
  }

  /** Define o nível alvo (a água sobe gradualmente até ele) */
  setTargetLevel(target: number): void {
    if (!Number.isFinite(target)) return;
    this._targetLevel = Math.min(target, this._maxLevel);
  }

  /** Inicia o dilúvio (começa a subir até maxLevel) */
  startFlood(): void {
    this._targetLevel = this._maxLevel;
    this._state = "rising";
  }

  /** Para o dilúvio (mantém nível atual) */
  stopFlood(): void {
    this._targetLevel = this._level;
    if (this._state === "rising") this._state = "idle";
  }

  /** Atualiza a taxa de subida */
  setRiseRate(ratePerSecond: number): void {
    if (!Number.isFinite(ratePerSecond) || ratePerSecond < 0) return;
    this._riseRate = ratePerSecond;
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  /**
   * Atualiza o nível da água.
   * Deve ser chamado a cada frame com o deltaTime em segundos.
   */
  update(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    if (this._state !== "rising") return;

    const rise = this._riseRate * dt;
    this._level = Math.min(this._level + rise, this._maxLevel);
    this._updateProgress();

    if (this._level >= this._maxLevel) {
      this._state = "peaked";
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private _updateProgress(): void {
    const range = this._maxLevel - this._initialLevel;
    if (range <= 0) {
      this._progress = 1;
      return;
    }
    this._progress = Math.min(1, Math.max(0, (this._level - this._initialLevel) / range));
  }
}
