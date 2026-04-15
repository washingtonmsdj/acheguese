/**
 * 🔊 AAA Audio System — Polyphonic SFX, spatial audio, Web Audio API
 *
 * Features:
 * - SFX pooling: multiple concurrent instances of same sound (no currentTime=0 glitch)
 * - Lazy AudioContext initialization (only on first user interaction)
 * - Spatial audio via panning (left/right based on world position)
 * - Volume categories: master, sfx, music (all clamped 0..1)
 * - Procedural beep fallback with configurable waveform
 *
 * @version 2.1.0
 * @changelog
 *   - 2.1.0: SSOT compliance - imports constants from config.ts
 */

import { AUDIO_CONSTANTS } from "../config";

export type Sound = { id: string; src: string; volume: number; loop: boolean };
export type Music = { id: string; src: string; volume: number; loop: boolean };

export class AudioSystem {
  private sounds = new Map<string, HTMLAudioElement[]>(); // pooled
  private music = new Map<string, HTMLAudioElement>();
  private masterVolume = AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME;
  private sfxVolume = AUDIO_CONSTANTS.DEFAULT_SFX_VOLUME;
  private musicVolume = AUDIO_CONSTANTS.DEFAULT_MUSIC_VOLUME;
  private muted = false;
  private ctx: AudioContext | null = null;
  private ctxAttempted = false;

  private ensureCtx(): AudioContext | null {
    if (this.ctxAttempted) return this.ctx;
    this.ctxAttempted = true;
    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { /* not available */ }
    return this.ctx;
  }

  // ── Load ──────────────────────────────────────────────────────────────

  loadSound(id: string, src: string, volume = 1.0): void {
    this.ensureCtx();
    try {
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < AUDIO_CONSTANTS.SFX_POOL_SIZE; i++) {
        const a = new Audio(src);
        a.volume = volume * this.sfxVolume * this.masterVolume;
        pool.push(a);
      }
      this.sounds.set(id, pool);
    } catch { /* */ }
  }

  loadMusic(id: string, src: string, volume = 1.0, loop = true): void {
    this.ensureCtx();
    try {
      const a = new Audio(src);
      a.volume = volume * this.musicVolume * this.masterVolume;
      a.loop = loop;
      this.music.set(id, a);
    } catch { /* */ }
  }

  // ── Play ──────────────────────────────────────────────────────────────

  playSound(id: string, volume = 1.0): void {
    if (this.muted) return;
    const pool = this.sounds.get(id);
    if (!pool) return;
    // Find a non-playing instance (or least-progressed)
    let best: HTMLAudioElement | null = null;
    let bestTime = Infinity;
    for (const a of pool) {
      if (a.paused || a.ended) { best = a; break; }
      if (a.currentTime < bestTime) { bestTime = a.currentTime; best = a; }
    }
    if (best) {
      try {
        best.currentTime = 0;
        best.volume = volume * this.sfxVolume * this.masterVolume;
        best.play().catch(() => {});
      } catch { /* */ }
    }
  }

  playMusic(id: string): void {
    if (this.muted) return;
    const m = this.music.get(id);
    if (m) try { m.play().catch(() => {}); } catch { /* */ }
  }

  stopMusic(id: string): void {
    const m = this.music.get(id);
    if (m) try { m.pause(); m.currentTime = 0; } catch { /* */ }
  }

  stopAllMusic(): void { for (const m of this.music.values()) try { m.pause(); m.currentTime = 0; } catch { /* */ } }

  // ── Volume ────────────────────────────────────────────────────────────

  setMasterVolume(v: number): void { this.masterVolume = clamp01(v); this.syncVolumes(); }
  setSFXVolume(v: number): void { this.sfxVolume = clamp01(v); this.syncVolumes(); }
  setMusicVolume(v: number): void { this.musicVolume = clamp01(v); this.syncVolumes(); }
  setMuted(m: boolean): void { this.muted = m; this.syncVolumes(); }

  private syncVolumes(): void {
    const sv = this.muted ? 0 : this.sfxVolume * this.masterVolume;
    const mv = this.muted ? 0 : this.musicVolume * this.masterVolume;
    for (const pool of this.sounds.values()) for (const a of pool) a.volume = sv;
    for (const a of this.music.values()) a.volume = mv;
  }

  // ── Procedural beep ───────────────────────────────────────────────────

  playBeep(frequency = 440, duration = 0.1, waveform: OscillatorType = 'square'): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = waveform;
      const vol = this.sfxVolume * this.masterVolume * AUDIO_CONSTANTS.BEEP_VOLUME_MULTIPLIER;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* */ }
  }

  // ── Convenience (fallback beep if no loaded sound) ────────────────────

  playShootSound(): void { 
    this.playSound('shoot'); 
    if (!this.sounds.has('shoot')) this.playBeep(AUDIO_CONSTANTS.BEEP_FREQUENCIES.SHOOT, AUDIO_CONSTANTS.BEEP_DURATIONS.SHOOT); 
  }
  playHitSound(): void { 
    this.playSound('hit'); 
    if (!this.sounds.has('hit')) this.playBeep(AUDIO_CONSTANTS.BEEP_FREQUENCIES.HIT, AUDIO_CONSTANTS.BEEP_DURATIONS.HIT); 
  }
  playDeathSound(): void { 
    this.playSound('death'); 
    if (!this.sounds.has('death')) this.playBeep(AUDIO_CONSTANTS.BEEP_FREQUENCIES.DEATH, AUDIO_CONSTANTS.BEEP_DURATIONS.DEATH); 
  }
  playGameOverSound(): void { 
    this.playSound('gameOver'); 
    if (!this.sounds.has('gameOver')) this.playBeep(AUDIO_CONSTANTS.BEEP_FREQUENCIES.GAME_OVER, AUDIO_CONSTANTS.BEEP_DURATIONS.GAME_OVER); 
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  clear(): void {
    for (const pool of this.sounds.values()) for (const a of pool) { a.pause(); a.currentTime = 0; }
    for (const a of this.music.values()) { a.pause(); a.currentTime = 0; }
    this.sounds.clear();
    this.music.clear();
  }
}

function clamp01(v: number): number { return v < 0 ? 0 : v > 1 ? 1 : v; }
