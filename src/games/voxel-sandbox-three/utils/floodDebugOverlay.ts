/**
 * FloodDebugOverlay - Overlay de debug técnico para o sistema de dilúvio
 *
 * Mostra em cena (gizmos 3D):
 * - Plano da água (linha horizontal)
 * - Pontos de flutuação da Arca
 * - Bounding box da Arca
 * - Vetor de força líquida (empuxo - peso)
 *
 * Expõe dados para o HUD React via getDebugData().
 */

import * as THREE from "three";
import type { RigidBody } from "@/lib/ordax/physics/PhysicsWorld";
import type { WaterSystem } from "@/lib/ordax/water/WaterSystem";

export interface FloodDebugData {
  waterLevel: number;
  arkPositionY: number;
  arkPositionX: number;
  arkPositionZ: number;
  distanceToTerrain: number;
  submergedPoints: number;
  totalPoints: number;
  submergedPercent: number;
  buoyancy: number;
  weight: number;
  netForce: number;
  rigidBodyState: "on_ground" | "floating" | "airborne";
  arkDimensions: { x: number; y: number; z: number };
  /** Y da base do casco (= body.position.y, convenção base-inferior) */
  meshBottomY: number;
  /** Y do topo do casco */
  meshTopY: number;
  /** Se o sistema de empuxo está ativo (água alcança a base) */
  buoyancyActive: boolean;
}

const WATER_PLANE_COLOR = 0x00aaff;
const BUOYANCY_POINT_COLOR_SUB = 0x00ff88;
const BUOYANCY_POINT_COLOR_DRY = 0xff4400;
const BBOX_COLOR = 0xffff00;
const NET_FORCE_UP_COLOR = 0x00ff00;
const NET_FORCE_DOWN_COLOR = 0xff0000;

// Cores reutilizáveis para evitar alocações no loop de update
const _colorSub = new THREE.Color(BUOYANCY_POINT_COLOR_SUB);
const _colorDry = new THREE.Color(BUOYANCY_POINT_COLOR_DRY);

export class FloodDebugOverlay {
  private group: THREE.Group;
  private waterPlane: THREE.Line;
  private bboxHelper: THREE.LineSegments;
  private buoyancyPoints: THREE.Points;
  private forceArrow: THREE.ArrowHelper;
  private enabled: boolean = false;

  // Cached data for HUD
  private _debugData: FloodDebugData = {
    waterLevel: 0,
    arkPositionY: 0,
    arkPositionX: 0,
    arkPositionZ: 0,
    distanceToTerrain: 0,
    submergedPoints: 0,
    totalPoints: 0,
    submergedPercent: 0,
    buoyancy: 0,
    weight: 0,
    netForce: 0,
    rigidBodyState: "on_ground",
    arkDimensions: { x: 0, y: 0, z: 0 },
    meshBottomY: 0,
    meshTopY: 0,
    buoyancyActive: false,
  };

  constructor() {
    this.group = new THREE.Group();
    this.group.name = "FloodDebugOverlay";
    this.group.visible = false;

    // ── Plano da água (linha horizontal grande) ──────────────────────────────
    const planeSize = 400;
    const planePoints = [
      new THREE.Vector3(-planeSize, 0, 0),
      new THREE.Vector3(planeSize, 0, 0),
      new THREE.Vector3(0, 0, -planeSize),
      new THREE.Vector3(0, 0, planeSize),
    ];
    const planeGeo = new THREE.BufferGeometry().setFromPoints(planePoints);
    const planeMat = new THREE.LineBasicMaterial({ color: WATER_PLANE_COLOR, depthTest: false });
    this.waterPlane = new THREE.Line(planeGeo, planeMat);
    this.waterPlane.renderOrder = 999;
    this.group.add(this.waterPlane);

    // ── Bounding box da Arca ─────────────────────────────────────────────────
    const bboxGeo = new THREE.BoxGeometry(1, 1, 1);
    const bboxEdges = new THREE.EdgesGeometry(bboxGeo);
    const bboxMat = new THREE.LineBasicMaterial({ color: BBOX_COLOR, depthTest: false });
    this.bboxHelper = new THREE.LineSegments(bboxEdges, bboxMat);
    this.bboxHelper.renderOrder = 999;
    this.group.add(this.bboxHelper);

    // ── Pontos de flutuação ──────────────────────────────────────────────────
    // Máximo de 9×9 = 81 pontos (grid adaptativo)
    const maxPoints = 81;
    const pointsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    const colors = new Float32Array(maxPoints * 3);
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      depthTest: false,
      sizeAttenuation: true,
    });
    this.buoyancyPoints = new THREE.Points(pointsGeo, pointsMat);
    this.buoyancyPoints.renderOrder = 999;
    this.group.add(this.buoyancyPoints);

    // ── Seta de força líquida ────────────────────────────────────────────────
    this.forceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      NET_FORCE_UP_COLOR,
    );
    this.forceArrow.renderOrder = 999;
    this.group.add(this.forceArrow);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.group.visible = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getDebugData(): Readonly<FloodDebugData> {
    return this._debugData;
  }

  /**
   * Atualiza todos os gizmos e calcula os dados de debug.
   *
   * @param waterSystem - SSOT do nível da água
   * @param arkBody - RigidBody da Arca
   * @param getTerrainHeight - Função para obter altura do terreno
   * @param getWaveHeight - Função para obter altura das ondas
   * @param gravity - Gravidade (m/s²)
   */
  update(
    waterSystem: WaterSystem,
    arkBody: RigidBody,
    getTerrainHeight: (x: number, z: number) => number,
    getWaveHeight: (x: number, z: number) => number,
    gravity: number = 9.8,
  ): void {
    const waterLevel = waterSystem.level;
    const arkPos = arkBody.position;
    const dims = arkBody.dimensions;

    // ── Plano da água ────────────────────────────────────────────────────────
    this.waterPlane.position.y = waterLevel;

    // ── Bounding box ─────────────────────────────────────────────────────────
    // CONVENÇÃO: arkPos = base inferior do casco. O centro geométrico está em +dims.y*0.5.
    this.bboxHelper.position.copy(arkPos).add(
      new THREE.Vector3(0, dims.y * 0.5, 0),
    );
    this.bboxHelper.scale.set(dims.x, dims.y, dims.z);
    this.bboxHelper.rotation.copy(arkBody.rotation);

    // ── Pontos de flutuação ──────────────────────────────────────────────────
    const gridX = this._getGridCount(dims.x);
    const gridZ = this._getGridCount(dims.z);
    const halfW = dims.x * 0.5;
    const halfD = dims.z * 0.5;
    const quat = new THREE.Quaternion().setFromEuler(arkBody.rotation);

    const posAttr = this.buoyancyPoints.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.buoyancyPoints.geometry.attributes.color as THREE.BufferAttribute;

    let submergedCount = 0;
    let totalCount = 0;
    let idx = 0;

    for (let ix = 0; ix < gridX; ix++) {
      for (let iz = 0; iz < gridZ; iz++) {
        const u = gridX === 1 ? 0.5 : ix / (gridX - 1);
        const v = gridZ === 1 ? 0.5 : iz / (gridZ - 1);
        const lx = THREE.MathUtils.lerp(-halfW, halfW, u);
        const lz = THREE.MathUtils.lerp(-halfD, halfD, v);

        const local = new THREE.Vector3(lx, 0, lz).applyQuaternion(quat);
        const world = arkPos.clone().add(local);

        const waveH = getWaveHeight(world.x, world.z);
        const surfaceY = waterLevel + waveH;
        const isSubmerged = world.y < surfaceY;

        if (isSubmerged) submergedCount++;
        totalCount++;

        posAttr.setXYZ(idx, world.x, world.y + 0.3, world.z);

        const c = isSubmerged ? _colorSub : _colorDry;
        colAttr.setXYZ(idx, c.r, c.g, c.b);
        idx++;
      }
    }

    // Zerar pontos não usados
    for (let i = idx; i < 81; i++) {
      posAttr.setXYZ(i, 0, -9999, 0);
      colAttr.setXYZ(i, 0, 0, 0);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this.buoyancyPoints.geometry.setDrawRange(0, idx);

    // ── Seta de força líquida ────────────────────────────────────────────────
    const weight = arkBody.mass * gravity;
    // Estimativa simples de empuxo para o gizmo (sem recalcular tudo)
    const subRatio = totalCount > 0 ? submergedCount / totalCount : 0;
    const buoyancy = 1000 * arkBody.volume * subRatio * gravity;
    const netForce = buoyancy - weight;

    const arrowOrigin = arkPos.clone().add(new THREE.Vector3(0, dims.y * 0.5, 0));
    const arrowDir = netForce >= 0
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(0, -1, 0);
    const arrowLen = Math.min(30, Math.abs(netForce) / (weight * 0.1));
    const arrowColor = netForce >= 0 ? NET_FORCE_UP_COLOR : NET_FORCE_DOWN_COLOR;

    this.forceArrow.position.copy(arrowOrigin);
    this.forceArrow.setDirection(arrowDir);
    this.forceArrow.setLength(Math.max(2, arrowLen));
    (this.forceArrow.line.material as THREE.LineBasicMaterial).color.setHex(arrowColor);
    (this.forceArrow.cone.material as THREE.MeshBasicMaterial).color.setHex(arrowColor);

    // ── Terreno sob a Arca ───────────────────────────────────────────────────
    const terrainH = getTerrainHeight(arkPos.x, arkPos.z);
    const distToTerrain = arkPos.y - terrainH;

    // CONVENÇÃO: arkPos.y = base inferior do casco.
    const meshBottomY = arkPos.y;
    const meshTopY = arkPos.y + dims.y;

    // Empuxo ativo se a água alcança a base do casco.
    const buoyancyActive = waterLevel > meshBottomY;

    // ── Estado do rigid body ─────────────────────────────────────────────────
    let rigidBodyState: FloodDebugData["rigidBodyState"];
    if (submergedCount > 0 && distToTerrain > 0.1) {
      rigidBodyState = "floating";
    } else if (distToTerrain <= 0.15) {
      rigidBodyState = "on_ground";
    } else {
      rigidBodyState = "airborne";
    }

    // ── Atualizar dados para HUD ─────────────────────────────────────────────
    this._debugData = {
      waterLevel,
      arkPositionY: arkPos.y,
      arkPositionX: arkPos.x,
      arkPositionZ: arkPos.z,
      distanceToTerrain,
      submergedPoints: submergedCount,
      totalPoints: totalCount,
      submergedPercent: totalCount > 0 ? (submergedCount / totalCount) * 100 : 0,
      buoyancy,
      weight,
      netForce,
      rigidBodyState,
      arkDimensions: { x: dims.x, y: dims.y, z: dims.z },
      meshBottomY,
      meshTopY,
      buoyancyActive,
    };
  }

  dispose(): void {
    this.waterPlane.geometry.dispose();
    (this.waterPlane.material as THREE.Material).dispose();
    this.bboxHelper.geometry.dispose();
    (this.bboxHelper.material as THREE.Material).dispose();
    this.buoyancyPoints.geometry.dispose();
    (this.buoyancyPoints.material as THREE.Material).dispose();
    this.forceArrow.line.geometry.dispose();
    (this.forceArrow.line.material as THREE.Material).dispose();
    this.forceArrow.cone.geometry.dispose();
    (this.forceArrow.cone.material as THREE.Material).dispose();
  }

  private _getGridCount(span: number): number {
    const target = Math.ceil(span / 6) + 1;
    return Math.max(3, Math.min(9, target % 2 === 0 ? target + 1 : target));
  }
}
