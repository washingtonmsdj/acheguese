/**
 * Helpers para gerenciamento de billboards (objetos que sempre olham para câmera)
 */

import * as THREE from "three";
// ✅ CORREÇÃO SSOT: Importar constante de performance
import { UPDATE_INTERVALS } from "../config/performance.config";

/**
 * Gerenciador de billboards com throttling para performance
 */
export class BillboardManager {
  private billboards: THREE.Object3D[] = [];
  private updateTimer: number = 0;
  private readonly updateInterval: number;
  
  /**
   * @param updateInterval - Intervalo entre atualizações em segundos (padrão vem de SSOT)
   */
  constructor(updateInterval: number = UPDATE_INTERVALS.BILLBOARD) {
    this.updateInterval = updateInterval;
  }
  
  /**
   * Registrar um billboard
   * 
   * @param object - Objeto 3D que deve sempre olhar para câmera
   */
  register(object: THREE.Object3D): void {
    if (!this.billboards.includes(object)) {
      this.billboards.push(object);
      object.userData.isBillboard = true;
    }
  }
  
  /**
   * Desregistrar um billboard
   * 
   * @param object - Objeto 3D a remover
   */
  unregister(object: THREE.Object3D): void {
    const index = this.billboards.indexOf(object);
    if (index !== -1) {
      this.billboards.splice(index, 1);
      object.userData.isBillboard = false;
    }
  }
  
  /**
   * Atualizar todos os billboards (com throttling)
   * 
   * @param deltaTime - Tempo desde último frame em segundos
   * @param camera - Câmera para olhar
   */
  update(deltaTime: number, camera: THREE.Camera): void {
    this.updateTimer += deltaTime;
    
    if (this.updateTimer >= this.updateInterval) {
      this.updateTimer = 0;
      
      for (const billboard of this.billboards) {
        billboard.lookAt(camera.position);
      }
    }
  }
  
  /**
   * Forçar atualização imediata (sem throttling)
   * 
   * @param camera - Câmera para olhar
   */
  forceUpdate(camera: THREE.Camera): void {
    for (const billboard of this.billboards) {
      billboard.lookAt(camera.position);
    }
  }
  
  /**
   * Limpar todos os billboards
   */
  clear(): void {
    for (const billboard of this.billboards) {
      billboard.userData.isBillboard = false;
    }
    this.billboards = [];
    this.updateTimer = 0;
  }
  
  /**
   * Obter quantidade de billboards registrados
   */
  get count(): number {
    return this.billboards.length;
  }
  
  /**
   * Obter todos os billboards
   */
  getAll(): readonly THREE.Object3D[] {
    return this.billboards;
  }
}

/**
 * Marcar objeto como billboard (helper)
 * 
 * @param object - Objeto 3D
 */
export function markAsBillboard(object: THREE.Object3D): void {
  object.userData.isBillboard = true;
}

/**
 * Verificar se objeto é billboard
 * 
 * @param object - Objeto 3D
 * @returns true se é billboard
 */
export function isBillboard(object: THREE.Object3D): boolean {
  return object.userData.isBillboard === true;
}

/**
 * Coletar todos os billboards de uma cena/grupo
 * 
 * @param root - Objeto raiz para buscar
 * @returns Array de billboards encontrados
 */
export function collectBillboards(root: THREE.Object3D): THREE.Object3D[] {
  const billboards: THREE.Object3D[] = [];
  
  root.traverse((obj) => {
    if (isBillboard(obj)) {
      billboards.push(obj);
    }
  });
  
  return billboards;
}
