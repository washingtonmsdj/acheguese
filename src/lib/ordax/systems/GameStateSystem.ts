/**
 * 🎮 AAA Game State System — FSM with callbacks, configurable transitions
 *
 * Features:
 * - State transition callbacks (onEnter/onExit hooks)
 * - Configurable valid transitions (prevents illegal state changes)
 * - Dynamic canvas size for restart (no hardcoded 400,300 player position)
 * - Event-driven architecture
 *
 * @version 2.0.0
 */

import type { OrdaxEntity } from '../types';
import { WORLD } from '../config';

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type GameStateEvent = {
  from: GameState;
  to: GameState;
  timestamp: number;
};

type StateCallback = (from: GameState, to: GameState) => void;

// Valid transitions
const VALID_TRANSITIONS: Record<GameState, GameState[]> = {
  START:     ['PLAYING'],
  PLAYING:   ['PAUSED', 'GAME_OVER'],
  PAUSED:    ['PLAYING', 'START'],
  GAME_OVER: ['START'],
};

export class GameStateSystem {
  private currentState: GameState = 'START';
  private stateHistory: GameStateEvent[] = [];
  private gameStartTime = 0;
  private gameEndTime = 0;
  private callbacks: StateCallback[] = [];

  get current(): GameState { return this.currentState; }

  // ── Callbacks ─────────────────────────────────────────────────────────

  onTransition(cb: StateCallback): void { this.callbacks.push(cb); }

  // ── Update ────────────────────────────────────────────────────────────

  update(_dt: number, entities: OrdaxEntity[]): void {
    if (this.currentState !== 'PLAYING') return;

    // Check lose condition
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (e.type === 'player' && e.props) {
        const hp = typeof e.props.health === 'number' ? e.props.health : 0;
        if (hp <= 0) { this.transitionTo('GAME_OVER'); return; }
      }
    }
  }

  // ── State transitions ─────────────────────────────────────────────────

  transitionTo(newState: GameState): boolean {
    if (this.currentState === newState) return false;

    // Validate transition
    const allowed = VALID_TRANSITIONS[this.currentState];
    if (!allowed.includes(newState)) return false;

    const event: GameStateEvent = {
      from: this.currentState, to: newState, timestamp: Date.now(),
    };
    this.stateHistory.push(event);

    const prevState = this.currentState;
    this.currentState = newState;

    // Entry hooks
    if (newState === 'PLAYING' && prevState === 'START') {
      this.gameStartTime = Date.now();
      this.gameEndTime = 0;
    } else if (newState === 'GAME_OVER') {
      this.gameEndTime = Date.now();
    } else if (newState === 'START') {
      this.gameStartTime = 0;
      this.gameEndTime = 0;
    }

    // Fire callbacks
    for (const cb of this.callbacks) { try { cb(prevState, newState); } catch { /* */ } }

    return true;
  }

  // ── Convenience ───────────────────────────────────────────────────────

  start(): void { this.transitionTo('PLAYING'); }

  pause(): void { this.transitionTo('PAUSED'); }

  resume(): void { this.transitionTo('PLAYING'); }

  restart(entities: OrdaxEntity[], canvasW = WORLD.W, canvasH = WORLD.H): void {
    // Reset player
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (e.type === 'player' && e.props) {
        e.props.health = e.props.maxHealth || 100;
        e.x = canvasW / 2;
        e.y = canvasH / 2;
        e.props.vx = 0;
        e.props.vy = 0;
      }
    }

    // Remove enemies and bullets (reverse)
    for (let i = entities.length - 1; i >= 0; i--) {
      if (entities[i].type === 'enemy' || entities[i].type === 'bullet') entities.splice(i, 1);
    }

    // Reset spawners
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].type === 'spawner' && entities[i].props) {
        entities[i].props!.enemiesSpawned = 0;
        entities[i].props!.currentWave = 1;
      }
    }

    // Force transition START (bypass validation since GAME_OVER→START is valid)
    this.transitionTo('START');
  }

  // ── Queries ───────────────────────────────────────────────────────────

  getGameDuration(): number {
    if (this.gameStartTime === 0) return 0;
    return ((this.gameEndTime || Date.now()) - this.gameStartTime) / 1000;
  }

  getStateHistory(): GameStateEvent[] { return this.stateHistory; }
  isPlaying(): boolean { return this.currentState === 'PLAYING'; }
  isGameOver(): boolean { return this.currentState === 'GAME_OVER'; }

  reset(): void {
    this.currentState = 'START';
    this.stateHistory.length = 0;
    this.gameStartTime = 0;
    this.gameEndTime = 0;
  }
}
