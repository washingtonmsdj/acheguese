import * as THREE from "three";
import {
  PHYSICAL_CONSTANTS,
  COLLISION_CONSTANTS,
  SAMPLING_CONSTANTS,
  ARK_CONSTANTS,
  validatePhysicsConfig,
  validateTuningConfig,
  calculateBoxInertia
} from "@/lib/constants/systems/physics-advanced";

/**
 * Sistema de Física Universal
 * 
 * Qualquer objeto no mundo segue as mesmas regras físicas:
 * - Gravidade
 * - Colisão com terreno
 * - Flutuação em água (princípio de Arquimedes)
 * - Arrasto
 * 
 * Sem gambiarras, sem paliativos, sem física específica por objeto.
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface PhysicsConfig {
  gravity: number;              // m/s² (padrão: 9.8)
  waterDensity: number;         // kg/m³ (padrão: 1000)
  airDensity: number;           // kg/m³ (padrão: 1.225)
}

export interface RigidBodyConfig {
  mass: number;                 // kg
  volume: number;               // m³
  dimensions: THREE.Vector3;    // Dimensões reais (largura, altura, profundidade)
  centerOfMass: THREE.Vector3;  // Posição relativa do centro de massa
  dragCoefficient: number;      // Coeficiente de arrasto (0-1)
}

export interface TerrainQuery {
  getHeightAt: (x: number, z: number) => number;
  isSolid: (x: number, y: number, z: number) => boolean;
  containsXZ?: (x: number, z: number) => boolean;
  deformAt?: (x: number, z: number, stamp: { radius: number; depth: number }) => void;
  /** Nivela o terreno para uma altura alvo (padrão AAA para construções) */
  flattenAt?: (x: number, z: number, targetHeight: number, radius: number, falloff?: number) => void;
  advance?: (deltaTime: number) => void;
}

export interface WaterQuery {
  getWaterLevel: () => number;
  getWaveHeightAt: (x: number, z: number, time?: number) => number;
}

interface TerrainContactInfo {
  maxPenetration: number;
  minClearance: number;
}

// ============================================================================
// RIGID BODY (Corpo Rígido)
// ============================================================================

export class RigidBody {
  // Propriedades físicas
  public mass: number;
  public volume: number;
  public dimensions: THREE.Vector3;
  public centerOfMass: THREE.Vector3;
  public dragCoefficient: number;
  
  // Estado dinâmico
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public rotation: THREE.Euler;
  public angularVelocity: THREE.Vector3;
  
  // Mesh associado
  public mesh: THREE.Object3D;
  
  constructor(config: RigidBodyConfig, mesh: THREE.Object3D) {
    this.mass = config.mass;
    this.volume = config.volume;
    this.dimensions = config.dimensions.clone();
    this.centerOfMass = config.centerOfMass.clone();
    this.dragCoefficient = config.dragCoefficient;
    
    this.position = mesh.position.clone();
    this.velocity = new THREE.Vector3();
    this.rotation = mesh.rotation.clone();
    this.angularVelocity = new THREE.Vector3();
    
    this.mesh = mesh;
  }
  
  /**
   * Densidade do objeto (kg/m³)
   */
  public getDensity(): number {
    return this.mass / this.volume;
  }
  
  /**
   * Centro de massa em coordenadas do mundo
   */
  public getWorldCenterOfMass(): THREE.Vector3 {
    return this.position.clone().add(this.centerOfMass);
  }
}

// ============================================================================
// PHYSICS WORLD (Mundo Físico)
// ============================================================================

export class PhysicsWorld {
  private config: PhysicsConfig;
  private bodies: RigidBody[] = [];
  private terrain: TerrainQuery | null = null;
  private water: WaterQuery | null = null;
  private time: number = 0;

  // Tuning (engine-level). Keep conservative defaults.
  private tuning = {
    angularDamping: 0.985,
    buoyancyTorqueScale: 1.0,
    angularDragScale: 0.25,
  };

  // ── Vetores reutilizáveis (evitam alocações no hot path) ──────────────────
  private readonly _prevPos    = new THREE.Vector3();
  private readonly _accel      = new THREE.Vector3();
  private readonly _velStep    = new THREE.Vector3();
  private readonly _angAcc     = new THREE.Vector3();
  private readonly _inertia    = new THREE.Vector3();
  private readonly _dragDir    = new THREE.Vector3();
  private readonly _localPt    = new THREE.Vector3();
  private readonly _worldPt    = new THREE.Vector3();
  private readonly _prevWPt    = new THREE.Vector3();
  private readonly _buoyLocal  = new THREE.Vector3();
  private readonly _buoyRot    = new THREE.Vector3();
  private readonly _buoyWorld  = new THREE.Vector3();
  private readonly _buoyForce  = new THREE.Vector3();
  private readonly _buoyTorque = new THREE.Vector3();
  private readonly _buoyR      = new THREE.Vector3();
  private readonly _buoyF      = new THREE.Vector3();
  private readonly _extCorner  = new THREE.Vector3();
  private readonly _extWorld   = new THREE.Vector3();
  
  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = validatePhysicsConfig(config);
  }
  
  // ==========================================================================
  // CONFIGURAÇÃO
  // ==========================================================================
  
  public setTerrain(terrain: TerrainQuery): void {
    this.terrain = terrain;
  }
  
  public setWater(water: WaterQuery): void {
    this.water = water;
  }

  /**
   * Ajustes finos de simulação (para calibração por jogo).
   * Valores fora de faixa são clampados para evitar instabilidade.
   */
  public setTuning(next: Partial<typeof this.tuning>) {
    this.tuning = validateTuningConfig({ ...this.tuning, ...next });
  }
  
  public addBody(body: RigidBody): void {
    this.bodies.push(body);
  }
  
  public removeBody(body: RigidBody): void {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }
  
  // ==========================================================================
  // SIMULAÇÃO
  // ==========================================================================
  
  public step(deltaTime: number): void {
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;

    const substeps = Math.min(
      COLLISION_CONSTANTS.MAX_SUBSTEPS,
      Math.max(1, Math.ceil(deltaTime / COLLISION_CONSTANTS.MAX_INTERNAL_TIMESTEP)),
    );
    const stepDt = deltaTime / substeps;

    for (let stepIndex = 0; stepIndex < substeps; stepIndex++) {
      this.time += stepDt;

      for (const body of this.bodies) {
        this.updateBody(body, stepDt);
      }

      this.terrain?.advance?.(stepDt);
    }
  }
  
  private updateBody(body: RigidBody, dt: number): void {
    this._prevPos.copy(body.position);

    // 1) Forças + torque
    const { force, torque } = this.calculateForceAndTorque(body);

    // 2) Integrar aceleração → velocidade
    this._accel.copy(force).divideScalar(body.mass);
    body.velocity.addScaledVector(this._accel, dt);

    // 3) Integrar velocidade → posição
    this._velStep.copy(body.velocity).multiplyScalar(dt);
    body.position.add(this._velStep);

    // 4) Integrar torque → velocidade angular → rotação
    this._inertia.copy(this.approximateBoxInertia(body));
    this._angAcc.set(
      this._inertia.x > 0 ? torque.x / this._inertia.x : 0,
      this._inertia.y > 0 ? torque.y / this._inertia.y : 0,
      this._inertia.z > 0 ? torque.z / this._inertia.z : 0,
    );
    body.angularVelocity.addScaledVector(this._angAcc, dt);
    body.angularVelocity.multiplyScalar(this.tuning.angularDamping);

    body.rotation.x += body.angularVelocity.x * dt;
    body.rotation.y += body.angularVelocity.y * dt;
    body.rotation.z += body.angularVelocity.z * dt;

    // 5) Colisão com terreno
    if (this.terrain) this.handleTerrainCollision(body, this._prevPos, dt);

    // 6) Atualizar mesh
    body.mesh.position.copy(body.position);
    body.mesh.rotation.copy(body.rotation);
  }
  
  // ==========================================================================
  // FORÇAS
  // ==========================================================================
  
  /**
   * Calcular todas as forças atuando no corpo
   * 
   * FÍSICA CORRETA:
   * 1. No terreno: Gravidade + Colisão (objeto fica no chão)
   * 2. Na água: Gravidade + Empuxo (objeto flutua se densidade < água)
   * 
   * NÃO misturar! Empuxo APENAS quando há água suficiente para alcançar a base do objeto.
   */
  private calculateForceAndTorque(body: RigidBody): { force: THREE.Vector3; torque: THREE.Vector3 } {
    const totalForce = new THREE.Vector3();
    const totalTorque = new THREE.Vector3();

    // 1) Gravidade (SEMPRE) aplicada no centro de massa
    totalForce.add(this.calculateGravity(body));

    // 2) Empuxo distribuído — APENAS se a água realmente alcança a base do objeto.
    //    Se waterLevel <= base do objeto em todos os pontos, não há empuxo.
    if (this.water && this.isWaterReachingBody(body)) {
      const buoy = this.calculateDistributedBuoyancy(body);
      totalForce.add(buoy.force);
      totalTorque.add(buoy.torque.multiplyScalar(this.tuning.buoyancyTorqueScale));
    }

    // 3) Arrasto linear
    if (body.velocity.lengthSq() > COLLISION_CONSTANTS.LINEAR_VELOCITY_THRESHOLD) {
      totalForce.add(this.calculateDrag(body));
    }

    // 4) Arrasto angular (simples)
    if (body.angularVelocity.lengthSq() > COLLISION_CONSTANTS.ANGULAR_VELOCITY_THRESHOLD) {
      totalTorque.add(
        body.angularVelocity.clone().multiplyScalar(-body.dragCoefficient * this.tuning.angularDragScale),
      );
    }

    return { force: totalForce, torque: totalTorque };
  }

  /**
   * Verifica se a água realmente alcança a base do objeto.
   * 
   * Sem esta guarda, o empuxo age mesmo quando waterLevel está abaixo do terreno,
   * causando a arca flutuar no ar antes do dilúvio começar.
   * 
   * CONVENÇÃO: body.position.y = base inferior do casco.
   */
  private isWaterReachingBody(body: RigidBody): boolean {
    if (!this.water) return false;
    const waterLevel = this.water.getWaterLevel();
    // A base do objeto está em body.position.y (convenção: position = base).
    // A água precisa estar ACIMA da base para haver empuxo.
    // Adiciona uma margem mínima para evitar empuxo residual em contato raso.
    return waterLevel > body.position.y - COLLISION_CONSTANTS.CONTACT_EPSILON;
  }
  
  /**
   * Força gravitacional: F = m * g
   */
  private calculateGravity(body: RigidBody): THREE.Vector3 {
    return new THREE.Vector3(0, -body.mass * this.config.gravity, 0);
  }
  
  /**
   * Empuxo (Princípio de Arquimedes): F = ρ_água * V_submerso * g
   * 
   * Um objeto flutua quando:
   * - Empuxo >= Peso
   * - ρ_água * V_submerso * g >= m * g
   * - V_submerso >= m / ρ_água
   */
  /**
   * Empuxo distribuído (multi-pontos) para gerar estabilidade (roll/pitch) em ondas.
   * - Amostra pontos no footprint (em coordenadas locais rotacionadas)
   * - Calcula submersão por ponto vs waterSurface(x,z,t)
   * - Distribui volume e calcula torque: r x F
   */
  private calculateDistributedBuoyancy(body: RigidBody): { force: THREE.Vector3; torque: THREE.Vector3 } {
    if (!this.water) return { force: new THREE.Vector3(), torque: new THREE.Vector3() };

    const waterLevel = this.water.getWaterLevel();
    const w = body.dimensions.x;
    const h = body.dimensions.y;
    const d = body.dimensions.z;

    const gridX = this.getTerrainSampleAxisCount(w);
    const gridZ = this.getTerrainSampleAxisCount(d);
    const halfW = w * 0.5;
    const halfD = d * 0.5;

    const euler = body.rotation;
    const quat = new THREE.Quaternion().setFromEuler(euler);
    const basePos = body.position;
    const comWorld = body.getWorldCenterOfMass();

    let submergedSum = 0;
    const samples: Array<{ wx: number; wy: number; wz: number; subRatio: number }> = [];

    for (let ix = 0; ix < gridX; ix++) {
      for (let iz = 0; iz < gridZ; iz++) {
        const u = gridX === 1 ? 0.5 : ix / (gridX - 1);
        const v = gridZ === 1 ? 0.5 : iz / (gridZ - 1);
        const lx = THREE.MathUtils.lerp(-halfW, halfW, u);
        const lz = THREE.MathUtils.lerp(-halfD, halfD, v);

        // Reutilizar vetores em vez de alocar
        this._buoyLocal.set(lx, 0, lz);
        this._buoyRot.copy(this._buoyLocal).applyQuaternion(quat);
        this._buoyWorld.copy(basePos).add(this._buoyRot);

        const wave = this.water.getWaveHeightAt(this._buoyWorld.x, this._buoyWorld.z, this.time);
        const surfaceY = waterLevel + wave;
        const terrainHeight = this.isTerrainSampleInsideBounds(this._buoyWorld.x, this._buoyWorld.z)
          ? (this.terrain?.getHeightAt(this._buoyWorld.x, this._buoyWorld.z) ?? -Infinity)
          : -Infinity;

        if (surfaceY <= terrainHeight + COLLISION_CONSTANTS.CONTACT_EPSILON) {
          samples.push({ wx: this._buoyWorld.x, wy: this._buoyWorld.y, wz: this._buoyWorld.z, subRatio: 0 });
          continue;
        }

        const bottomY = this._buoyWorld.y;
        const topY = bottomY + h;

        let subRatio = 0;
        if (bottomY >= surfaceY) subRatio = 0;
        else if (topY <= surfaceY) subRatio = 1;
        else subRatio = (surfaceY - bottomY) / h;

        submergedSum += subRatio;
        samples.push({ wx: this._buoyWorld.x, wy: this._buoyWorld.y, wz: this._buoyWorld.z, subRatio });
      }
    }

    if (submergedSum <= 0.000001) return { force: new THREE.Vector3(), torque: new THREE.Vector3() };

    const avgSub = submergedSum / samples.length;
    const displacedVolume = body.volume * THREE.MathUtils.clamp(avgSub, 0, 1);
    const totalBuoyancy = this.config.waterDensity * displacedVolume * this.config.gravity;

    this._buoyForce.set(0, 0, 0);
    this._buoyTorque.set(0, 0, 0);

    for (const s of samples) {
      if (s.subRatio <= 0) continue;
      const wNorm = s.subRatio / submergedSum;
      const fy = totalBuoyancy * wNorm;

      this._buoyForce.y += fy;

      // torque: r × F  (F = (0, fy, 0))
      this._buoyR.set(s.wx - comWorld.x, s.wy - comWorld.y, s.wz - comWorld.z);
      this._buoyF.set(0, fy, 0);
      this._buoyTorque.addScaledVector(this._buoyR.cross(this._buoyF), 1);
    }

    return { force: this._buoyForce.clone(), torque: this._buoyTorque.clone() };
  }

  private approximateBoxInertia(body: RigidBody): THREE.Vector3 {
    const inertia = calculateBoxInertia(
      body.mass,
      body.dimensions.x,
      body.dimensions.y,
      body.dimensions.z
    );
    return new THREE.Vector3(inertia.x, inertia.y, inertia.z);
  }
  
  /**
   * Força de arrasto: F = -0.5 * ρ * v² * A * Cd * v̂
   * Simplificado: F = -k * v
   */
  private calculateDrag(body: RigidBody): THREE.Vector3 {
    const speed = body.velocity.length();
    if (speed < COLLISION_CONSTANTS.LINEAR_VELOCITY_THRESHOLD) {
      return new THREE.Vector3();
    }

    let density = this.config.airDensity;
    if (this.water) {
      const waterLevel = this.water.getWaterLevel();
      const wave = this.water.getWaveHeightAt(body.position.x, body.position.z, this.time);
      const surfaceY = waterLevel + wave;
      const { minY } = this.getBodyVerticalExtents(body);
      if (minY < surfaceY) {
        density = this.config.waterDensity;
      }
    }

    const dragMagnitude = 0.5 * density * speed * speed * body.dragCoefficient;
    // Reutilizar _dragDir em vez de alocar
    this._dragDir.copy(body.velocity).normalize().negate();
    return this._dragDir.multiplyScalar(dragMagnitude);
  }
  
  // ==========================================================================
  // COLISÕES
  // ==========================================================================
  
  /**
   * Colisão com terreno (VOLUME SÓLIDO 3D)
   * 
   * ✅ CORREÇÃO AAA: Terreno não é apenas uma superfície 2D (heightmap),
   * é um VOLUME SÓLIDO 3D. Tudo abaixo da superfície é sólido.
   * 
   * Física correta:
   * - Verificar múltiplos pontos do objeto (não apenas centro)
   * - Se qualquer ponto está DENTRO do terreno → empurrar para CIMA
   * - Aplicar força normal (impede penetração)
   * - Aplicar atrito (reduz movimento horizontal)
   */
  private handleTerrainCollision(body: RigidBody, previousPosition?: THREE.Vector3, dt: number = 0): void {
    const contact = this.evaluateTerrainContact(body, previousPosition);
    if (!contact) return;

    if (contact.maxPenetration > COLLISION_CONSTANTS.CONTACT_EPSILON) {
      const impactVelocityY = body.velocity.y;
      body.position.y += contact.maxPenetration + COLLISION_CONSTANTS.CONTACT_EPSILON;

      if (body.velocity.y < 0) {
        body.velocity.y = 0;
      }

      body.velocity.x *= COLLISION_CONSTANTS.GROUND_FRICTION;
      body.velocity.z *= COLLISION_CONSTANTS.GROUND_FRICTION;
      this.applyTerrainDeformation(body, dt, 1.0, impactVelocityY);
      return;
    }

    const isDescendingSlowly =
      body.velocity.y <= 0 &&
      body.velocity.y >= -COLLISION_CONSTANTS.GROUND_SNAP_MAX_VERTICAL_SPEED;
    const shouldSnapToGround =
      isDescendingSlowly &&
      contact.minClearance > 0 &&
      contact.minClearance <= COLLISION_CONSTANTS.GROUND_SNAP_DISTANCE;

    if (shouldSnapToGround) {
      const impactVelocityY = body.velocity.y;
      body.position.y -= contact.minClearance;
      body.velocity.y = 0;
      body.velocity.x *= COLLISION_CONSTANTS.GROUND_FRICTION;
      body.velocity.z *= COLLISION_CONSTANTS.GROUND_FRICTION;
      this.applyTerrainDeformation(body, dt, 0.55, impactVelocityY);
    }
  }

  private evaluateTerrainContact(body: RigidBody, previousPosition?: THREE.Vector3): TerrainContactInfo | null {
    if (!this.terrain) return null;

    const halfW = body.dimensions.x * 0.5;
    const halfD = body.dimensions.z * 0.5;
    const samplesX = this.getTerrainSampleAxisCount(body.dimensions.x);
    const samplesZ = this.getTerrainSampleAxisCount(body.dimensions.z);
    const quat = new THREE.Quaternion().setFromEuler(body.rotation);

    let maxPenetration = -Infinity;
    let minClearance = Infinity;
    let sampleCount = 0;

    for (let ix = 0; ix < samplesX; ix++) {
      const xT = samplesX === 1 ? 0.5 : ix / (samplesX - 1);
      const localX = THREE.MathUtils.lerp(-halfW, halfW, xT);

      for (let iz = 0; iz < samplesZ; iz++) {
        const zT = samplesZ === 1 ? 0.5 : iz / (samplesZ - 1);
        const localZ = THREE.MathUtils.lerp(-halfD, halfD, zT);

        this._localPt.set(localX, 0, localZ).applyQuaternion(quat);
        this._worldPt.copy(body.position).add(this._localPt);

        if (!this.isTerrainSampleInsideBounds(this._worldPt.x, this._worldPt.z)) {
          continue;
        }

        const terrainHeight = this.terrain.getHeightAt(this._worldPt.x, this._worldPt.z);
        const rawPenetration = terrainHeight - this._worldPt.y;
        const isInsideTerrain = this.terrain.isSolid(
          this._worldPt.x,
          this._worldPt.y - COLLISION_CONSTANTS.CONTACT_EPSILON,
          this._worldPt.z,
        );
        const penetration = isInsideTerrain
          ? Math.max(rawPenetration, COLLISION_CONSTANTS.CONTACT_EPSILON)
          : rawPenetration;

        sampleCount += 1;
        maxPenetration = Math.max(maxPenetration, penetration);
        minClearance = Math.min(minClearance, this._worldPt.y - terrainHeight);

        if (!previousPosition) continue;

        this._prevWPt.copy(previousPosition).add(this._localPt);
        const sweepDistance = Math.hypot(
          this._worldPt.x - this._prevWPt.x,
          this._worldPt.z - this._prevWPt.z,
        );
        if (sweepDistance <= COLLISION_CONSTANTS.CONTACT_EPSILON) continue;

        const sweepSamples = Math.min(
          SAMPLING_CONSTANTS.TERRAIN_MAX_AXIS_SAMPLES,
          Math.max(1, Math.ceil(sweepDistance / SAMPLING_CONSTANTS.TERRAIN_SAMPLE_SPACING)),
        );

        for (let sweepIndex = 1; sweepIndex <= sweepSamples; sweepIndex++) {
          const t = sweepIndex / (sweepSamples + 1);
          const sweepX = THREE.MathUtils.lerp(this._prevWPt.x, this._worldPt.x, t);
          const sweepZ = THREE.MathUtils.lerp(this._prevWPt.z, this._worldPt.z, t);
          const sweepY = THREE.MathUtils.lerp(this._prevWPt.y, this._worldPt.y, t);

          if (!this.isTerrainSampleInsideBounds(sweepX, sweepZ)) continue;

          const sweepTerrainHeight = this.terrain.getHeightAt(sweepX, sweepZ);
          const sweepRawPenetration = sweepTerrainHeight - sweepY;
          const sweepInsideTerrain = this.terrain.isSolid(
            sweepX,
            sweepY - COLLISION_CONSTANTS.CONTACT_EPSILON,
            sweepZ,
          );
          const sweepPenetration = sweepInsideTerrain
            ? Math.max(sweepRawPenetration, COLLISION_CONSTANTS.CONTACT_EPSILON)
            : sweepRawPenetration;

          sampleCount += 1;
          maxPenetration = Math.max(maxPenetration, sweepPenetration);
          minClearance = Math.min(minClearance, sweepY - sweepTerrainHeight);
        }
      }
    }

    if (sampleCount === 0) return null;
    return { maxPenetration, minClearance };
  }

  private getTerrainSampleAxisCount(span: number): number {
    const targetSamples = Math.ceil(span / SAMPLING_CONSTANTS.TERRAIN_SAMPLE_SPACING) + 1;
    let clamped = THREE.MathUtils.clamp(
      targetSamples,
      SAMPLING_CONSTANTS.TERRAIN_MIN_AXIS_SAMPLES,
      SAMPLING_CONSTANTS.TERRAIN_MAX_AXIS_SAMPLES,
    );
    if (clamped % 2 === 0) {
      clamped = Math.min(clamped + 1, SAMPLING_CONSTANTS.TERRAIN_MAX_AXIS_SAMPLES);
    }
    return clamped;
  }

  private isTerrainSampleInsideBounds(x: number, z: number): boolean {
    if (!this.terrain?.containsXZ) return true;
    return this.terrain.containsXZ(x, z);
  }

  private applyTerrainDeformation(body: RigidBody, dt: number, contactWeight: number, impactVelocityY: number): void {
    if (!this.terrain?.deformAt) return;
    if (!Number.isFinite(dt) || dt <= 0) return;
    if (body.mass <= 0) return;

    const footprintArea = Math.max(0.5, body.dimensions.x * body.dimensions.z);
    const pressure = body.mass / footprintArea;
    const pressureFactor = THREE.MathUtils.clamp(pressure / 22000, 0, 1.75);
    const verticalImpactFactor = THREE.MathUtils.clamp(Math.max(0, -impactVelocityY) / 9, 0, 1);

    const baseDepthPerSecond = 0.002;
    const pressureDepthPerSecond = 0.012 * pressureFactor;
    const impactDepthPerSecond = 0.008 * verticalImpactFactor;
    const totalDepth = (baseDepthPerSecond + pressureDepthPerSecond + impactDepthPerSecond) * dt * contactWeight;

    if (totalDepth <= 0.00001) return;

    const halfW = body.dimensions.x * 0.5;
    const halfD = body.dimensions.z * 0.5;
    const radius = THREE.MathUtils.clamp(Math.sqrt(footprintArea) * 0.38, 0.9, 18);
    const quat = new THREE.Quaternion().setFromEuler(body.rotation);
    const local = new THREE.Vector3();
    const world = new THREE.Vector3();

    const contactSamples = [
      { x: -0.35, z: -0.35, weight: 0.24 },
      { x: 0.35, z: -0.35, weight: 0.24 },
      { x: -0.35, z: 0.35, weight: 0.24 },
      { x: 0.35, z: 0.35, weight: 0.24 },
      { x: 0, z: 0, weight: 0.32 },
    ];

    for (const sample of contactSamples) {
      local.set(sample.x * halfW, 0, sample.z * halfD).applyQuaternion(quat);
      world.copy(body.position).add(local);
      this.terrain.deformAt(world.x, world.z, {
        radius,
        depth: totalDepth * sample.weight,
      });
    }
  }

  private getBodyVerticalExtents(body: RigidBody): { minY: number; maxY: number } {
    const halfW = body.dimensions.x * 0.5;
    const halfD = body.dimensions.z * 0.5;
    const height = body.dimensions.y;
    const quat = new THREE.Quaternion().setFromEuler(body.rotation);

    let minY = Infinity;
    let maxY = -Infinity;

    for (const localY of [0, height]) {
      for (const localX of [-halfW, halfW]) {
        for (const localZ of [-halfD, halfD]) {
          this._extCorner.set(localX, localY, localZ).applyQuaternion(quat);
          this._extWorld.copy(body.position).add(this._extCorner);
          minY = Math.min(minY, this._extWorld.y);
          maxY = Math.max(maxY, this._extWorld.y);
        }
      }
    }

    return { minY, maxY };
  }
  
  // ==========================================================================
  // QUERIES
  // ==========================================================================
  
  public getTime(): number {
    return this.time;
  }
  
  public getBodies(): RigidBody[] {
    return this.bodies;
  }
  
  /**
   * Obter dados de física de um corpo para debug
   * 
   * @param body - Corpo para obter dados
   * @returns Dados de física (empuxo, peso, etc)
   */
  public getPhysicsDebug(body: RigidBody): {
    buoyancy: number;
    weight: number;
    netForce: number;
    submergedVolume: number;
    submergedPercent: number;
  } {
    const weight = body.mass * this.config.gravity;
    
    let buoyancy = 0;
    let submergedVolume = 0;
    let submergedPercent = 0;
    
    if (this.water) {
      const buoyancyData = this.calculateDistributedBuoyancy(body);
      buoyancy = buoyancyData.force.y; // Componente vertical do empuxo
      
      // Calcular volume submerso
      const waterLevel = this.water.getWaterLevel();
      const wave = this.water.getWaveHeightAt(body.position.x, body.position.z, this.time);
      const surfaceY = waterLevel + wave;
      const { minY, maxY } = this.getBodyVerticalExtents(body);
      
      if (minY < surfaceY) {
        if (maxY <= surfaceY) {
          // Totalmente submerso
          submergedVolume = body.volume;
          submergedPercent = 100;
        } else {
          // Parcialmente submerso
          const submergedHeight = surfaceY - minY;
          const totalHeight = Math.max(maxY - minY, COLLISION_CONSTANTS.CONTACT_EPSILON);
          submergedPercent = (submergedHeight / totalHeight) * 100;
          submergedVolume = body.volume * (submergedPercent / 100);
        }
      }
    }
    
    const netForce = buoyancy - weight;
    
    return {
      buoyancy,
      weight,
      netForce,
      submergedVolume,
      submergedPercent,
    };
  }
  
  /**
   * Verificar se um corpo está no chão (apoiado no terreno)
   * 
   * Considera "no chão" se:
   * 1. Está muito próximo da superfície do terreno
   * 2. Não está se movendo verticalmente (ou caindo muito devagar)
   */
  public isOnGround(body: RigidBody): boolean {
    const contact = this.evaluateTerrainContact(body);
    if (!contact) return false;
    
    // Considera "no chão" se:
    // - Está muito próximo do threshold de colisão
    // - Não está caindo rápido (velocidade vertical pequena)
    const isClose = contact.minClearance <= COLLISION_CONSTANTS.GROUND_SNAP_DISTANCE;
    const isNotFalling = body.velocity.y > -COLLISION_CONSTANTS.FALLING_THRESHOLD;
    
    return isClose && isNotFalling;
  }
  
  /**
   * Verificar se um corpo está na água
   */
  public isInWater(body: RigidBody): boolean {
    if (!this.water) return false;

    const waterLevel = this.water.getWaterLevel();
    const wave = this.water.getWaveHeightAt(body.position.x, body.position.z, this.time);
    const surfaceY = waterLevel + wave;
    const { minY } = this.getBodyVerticalExtents(body);

    return minY < surfaceY;
  }
  
  /**
   * Verificar se um corpo está flutuando (na água e não no chão)
   */
  public isFloating(body: RigidBody): boolean {
    return this.isInWater(body) && !this.isOnGround(body);
  }
}

// ============================================================================
// HELPER: Criar RigidBody para Arca de Noé
// ============================================================================

export function createArkRigidBody(mesh: THREE.Object3D): RigidBody {
  // Dimensões bíblicas
  const length = ARK_CONSTANTS.LENGTH;
  const width = ARK_CONSTANTS.WIDTH;
  const height = ARK_CONSTANTS.HEIGHT;
  
  // Dimensões (largura, altura, profundidade)
  const dimensions = new THREE.Vector3(length, height, width);
  
  // Volume aproximado (paralelepípedo)
  const volume = length * width * height;
  
  // Massa estimada (madeira + carga)
  const mass = volume * ARK_CONSTANTS.LOADED_DENSITY;
  
  // Centro de massa (no meio, um pouco abaixo do centro geométrico)
  const centerOfMass = new THREE.Vector3(
    0, 
    height * ARK_CONSTANTS.CENTER_OF_MASS_HEIGHT_FRACTION, 
    0
  );
  
  return new RigidBody({
    mass,
    volume,
    dimensions,
    centerOfMass,
    dragCoefficient: ARK_CONSTANTS.DRAG_COEFFICIENT,
  }, mesh);
}
