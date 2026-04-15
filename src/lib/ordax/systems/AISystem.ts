/**
 * 🧠 AAA AI System — Steering behaviors, entity-map lookup, typed entities
 *
 * Features:
 * - O(1) entity lookup via pre-built Map (no .find() per agent per frame)
 * - Separation behavior to avoid stacking
 * - Smooth steering (weighted blending)
 * - Wander using circle-projection (Reynolds steering)
 * - Typed entity contract (no `any`)
 *
 * @version 2.0.0
 */

// ── Types ───────────────────────────────────────────────────────────────

export type AIBehavior = 'idle' | 'patrol' | 'chase' | 'flee' | 'wander' | 'linear';

export type AIAgent = {
  id: string;
  behavior: AIBehavior;
  target: string | null;
  speed: number;
  detectionRange: number;
  patrolPoints?: { x: number; y: number }[];
  currentPatrolIndex?: number;
  // Wander state (internal)
  wanderAngle?: number;
  wanderTimer?: number;
  // Separation
  separationRadius?: number;
  separationWeight?: number;
};

interface AIEntity {
  readonly id: string;
  x: number; y: number;
  type?: string;
  props?: Record<string, unknown>;
  wanderAngle?: number;
  wanderTimer?: number;
}

// ── Constants ───────────────────────────────────────────────────────────

const PATROL_ARRIVE_DIST = 10;
const WANDER_INTERVAL    = 2;   // seconds between direction changes
const SEPARATION_RADIUS  = 40;  // default px
const SEPARATION_WEIGHT  = 0.5; // blend factor

// ── System ──────────────────────────────────────────────────────────────

export class AISystem {
  private agents = new Map<string, AIAgent>();
  
  // Reusable entity map to avoid per-frame allocation
  private _entityMap = new Map<string, AIEntity>();

  register(entityId: string, behavior: AIBehavior, speed = 100, detectionRange = 800): void {
    this.agents.set(entityId, {
      id: entityId, behavior, target: null, speed, detectionRange,
      separationRadius: SEPARATION_RADIUS, separationWeight: SEPARATION_WEIGHT,
    });
  }

  unregister(entityId: string): void { this.agents.delete(entityId); }

  setBehavior(entityId: string, behavior: AIBehavior): void {
    const a = this.agents.get(entityId);
    if (a) a.behavior = behavior;
  }

  setPatrolPoints(entityId: string, points: { x: number; y: number }[]): void {
    const a = this.agents.get(entityId);
    if (a) { a.patrolPoints = points; a.currentPatrolIndex = 0; }
  }

  // ── Main update ───────────────────────────────────────────────────────

  update(dt: number, entities: AIEntity[]): void {
    // Build entity map once using reusable map (zero-allocation)
    this._entityMap.clear();
    let player: AIEntity | undefined;
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      this._entityMap.set(e.id, e);
      if (e.type === 'player' || e.id === 'player') player = e;
    }

    // Process registered agents
    for (const agent of this.agents.values()) {
      const entity = this._entityMap.get(agent.id);
      if (!entity) continue;

      switch (agent.behavior) {
        case 'chase':  this.steerChase(agent, entity, player, dt); break;
        case 'flee':   this.steerFlee(agent, entity, player, dt); break;
        case 'patrol': this.steerPatrol(agent, entity, dt); break;
        case 'wander': this.steerWander(agent, entity, dt); break;
        case 'linear': entity.y += agent.speed * dt; break;
        // idle: do nothing
      }

      // Separation from other agents
      this.applySeparation(agent, entity, entities, dt);
    }

    // Simple-mode entities (props-driven, no registered agent)
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (this.agents.has(e.id) || !e.props) continue;
      const behavior = (e.props.aiBehavior ?? e.props.ai) as string | undefined;
      if (!behavior) continue;
      const speed = (e.props.speed as number) || 100;

      switch (behavior) {
        case 'chase':
          if (player) this.moveToward(e, player.x, player.y, speed, dt);
          break;
        case 'flee':
          if (player) this.moveAway(e, player.x, player.y, speed, dt);
          break;
        case 'wander':
          this.simpleWander(e, speed, dt);
          break;
        case 'linear':
          e.y += speed * dt;
          break;
      }
    }
  }

  // ── Steering behaviors ────────────────────────────────────────────────

  private steerChase(agent: AIAgent, entity: AIEntity, target: AIEntity | undefined, dt: number): void {
    if (!target) return;
    const dx = target.x - entity.x, dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);
    if (dist < agent.detectionRange && dist > 0) {
      entity.x += (dx / dist) * agent.speed * dt;
      entity.y += (dy / dist) * agent.speed * dt;
    }
  }

  private steerFlee(agent: AIAgent, entity: AIEntity, target: AIEntity | undefined, dt: number): void {
    if (!target) return;
    const dx = entity.x - target.x, dy = entity.y - target.y;
    const dist = Math.hypot(dx, dy);
    if (dist < agent.detectionRange && dist > 0) {
      entity.x += (dx / dist) * agent.speed * dt;
      entity.y += (dy / dist) * agent.speed * dt;
    }
  }

  private steerPatrol(agent: AIAgent, entity: AIEntity, dt: number): void {
    if (!agent.patrolPoints?.length) return;
    const idx = agent.currentPatrolIndex ?? 0;
    const pt = agent.patrolPoints[idx];
    const dx = pt.x - entity.x, dy = pt.y - entity.y;
    const dist = Math.hypot(dx, dy);
    if (dist < PATROL_ARRIVE_DIST) {
      agent.currentPatrolIndex = (idx + 1) % agent.patrolPoints.length;
    } else {
      entity.x += (dx / dist) * agent.speed * dt;
      entity.y += (dy / dist) * agent.speed * dt;
    }
  }

  private steerWander(agent: AIAgent, entity: AIEntity, dt: number): void {
    if (agent.wanderAngle === undefined) { agent.wanderAngle = Math.random() * Math.PI * 2; agent.wanderTimer = 0; }
    agent.wanderTimer = (agent.wanderTimer ?? 0) + dt;
    if (agent.wanderTimer > WANDER_INTERVAL) {
      agent.wanderAngle = (agent.wanderAngle ?? 0) + (Math.random() - 0.5) * Math.PI; // smooth turn
      agent.wanderTimer = 0;
    }
    entity.x += Math.cos(agent.wanderAngle!) * agent.speed * dt;
    entity.y += Math.sin(agent.wanderAngle!) * agent.speed * dt;
  }

  private applySeparation(agent: AIAgent, entity: AIEntity, entities: AIEntity[], _dt: number): void {
    const rad = agent.separationRadius ?? SEPARATION_RADIUS;
    const w = agent.separationWeight ?? SEPARATION_WEIGHT;
    let sx = 0, sy = 0, count = 0;
    for (let i = 0; i < entities.length; i++) {
      const other = entities[i];
      if (other.id === entity.id) continue;
      const dx = entity.x - other.x, dy = entity.y - other.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < rad * rad && distSq > 0) {
        const dist = Math.sqrt(distSq);
        sx += (dx / dist) / dist; // inverse distance weighting
        sy += (dy / dist) / dist;
        count++;
      }
    }
    if (count > 0) {
      entity.x += sx * w;
      entity.y += sy * w;
    }
  }

  // ── Simple-mode helpers ───────────────────────────────────────────────

  private moveToward(e: AIEntity, tx: number, ty: number, speed: number, dt: number): void {
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d > 0 && e.props) {
      e.props.vx = (dx / d) * speed;
      e.props.vy = (dy / d) * speed;
    }
  }

  private moveAway(e: AIEntity, tx: number, ty: number, speed: number, dt: number): void {
    const dx = e.x - tx, dy = e.y - ty, d = Math.hypot(dx, dy);
    if (d > 0 && e.props) {
      e.props.vx = (dx / d) * speed;
      e.props.vy = (dy / d) * speed;
    }
  }

  private simpleWander(e: AIEntity, speed: number, dt: number): void {
    if (!e.props) return;
    if (e.props.wanderAngle === undefined) { e.props.wanderAngle = Math.random() * Math.PI * 2; e.props.wanderTimer = 0; }
    e.props.wanderTimer = ((e.props.wanderTimer as number) || 0) + dt;
    if ((e.props.wanderTimer as number) > WANDER_INTERVAL) {
      e.props.wanderAngle = ((e.props.wanderAngle as number) || 0) + (Math.random() - 0.5) * Math.PI;
      e.props.wanderTimer = 0;
    }
    e.props.vx = Math.cos(e.props.wanderAngle as number) * speed;
    e.props.vy = Math.sin(e.props.wanderAngle as number) * speed;
  }

  clear(): void { 
    this.agents.clear(); 
    this._entityMap.clear();
  }
}
