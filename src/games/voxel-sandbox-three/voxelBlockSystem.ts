import * as THREE from "three";

/**
 * Sistema de Blocos Voxel
 * 
 * Features:
 * - Colocar blocos (click direito)
 * - Quebrar blocos (click esquerdo)
 * - Raycast para detectar bloco alvo
 * - Instanced rendering (performance)
 * - Múltiplos tipos de blocos
 */

export enum BlockType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  SAND = 5,
}

export interface Block {
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

export interface VoxelBlockSystemConfig {
  blockSize: number; // Tamanho do bloco (padrão: 1m)
  maxBlocks: number; // Máximo de blocos (para instancing)
  worldBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export class VoxelBlockSystem {
  private group: THREE.Group;
  private config: VoxelBlockSystemConfig;
  
  // Blocos armazenados por posição (key: "x,y,z")
  private blocks: Map<string, Block> = new Map();
  
  // Instanced meshes por tipo de bloco
  private instancedMeshes: Map<BlockType, THREE.InstancedMesh> = new Map();
  private instanceCounts: Map<BlockType, number> = new Map();
  
  // Raycaster para detecção
  private raycaster: THREE.Raycaster;
  
  // Bloco selecionado (highlight)
  private highlightMesh: THREE.Mesh | null = null;
  private currentTargetBlock: { x: number; y: number; z: number } | null = null;
  
  // Tipo de bloco atual (para colocar)
  private currentBlockType: BlockType = BlockType.DIRT;
  
  constructor(config: VoxelBlockSystemConfig) {
    this.group = new THREE.Group();
    this.config = config;
    this.raycaster = new THREE.Raycaster();
    
    // Criar instanced meshes para cada tipo de bloco
    this.createInstancedMeshes();
    
    // Criar highlight mesh
    this.createHighlightMesh();
    
    console.log(`🧱 Sistema de Blocos Voxel criado!`);
    console.log(`   Tamanho do bloco: ${config.blockSize}m`);
    console.log(`   Máximo de blocos: ${config.maxBlocks}`);
  }
  
  // ==========================================================================
  // CRIAÇÃO
  // ==========================================================================
  
  private createInstancedMeshes() {
    const blockGeo = new THREE.BoxGeometry(
      this.config.blockSize,
      this.config.blockSize,
      this.config.blockSize
    );
    
    // Cores por tipo de bloco
    const blockColors: Record<BlockType, number> = {
      [BlockType.AIR]: 0x000000,
      [BlockType.DIRT]: 0x8B4513,    // Marrom
      [BlockType.GRASS]: 0x7CFC00,   // Verde
      [BlockType.STONE]: 0x808080,   // Cinza
      [BlockType.WOOD]: 0xDEB887,    // Bege
      [BlockType.SAND]: 0xF4A460,    // Areia
    };
    
    // Criar instanced mesh para cada tipo (exceto AIR)
    for (const type of [BlockType.DIRT, BlockType.GRASS, BlockType.STONE, BlockType.WOOD, BlockType.SAND]) {
      const mat = new THREE.MeshStandardMaterial({
        color: blockColors[type],
        roughness: 0.8,
        metalness: 0.0,
      });
      
      const mesh = new THREE.InstancedMesh(
        blockGeo,
        mat,
        this.config.maxBlocks
      );
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.count = 0; // Começa vazio
      
      this.instancedMeshes.set(type, mesh);
      this.instanceCounts.set(type, 0);
      this.group.add(mesh);
    }
  }
  
  private createHighlightMesh() {
    const geo = new THREE.BoxGeometry(
      this.config.blockSize * 1.01,
      this.config.blockSize * 1.01,
      this.config.blockSize * 1.01
    );
    
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    
    this.highlightMesh = new THREE.Mesh(geo, mat);
    this.highlightMesh.visible = false;
    this.group.add(this.highlightMesh);
  }

  
  // ==========================================================================
  // BLOCOS
  // ==========================================================================
  
  /**
   * Adicionar bloco
   */
  public addBlock(x: number, y: number, z: number, type: BlockType): boolean {
    // Arredondar para grid
    x = Math.floor(x / this.config.blockSize) * this.config.blockSize;
    y = Math.floor(y / this.config.blockSize) * this.config.blockSize;
    z = Math.floor(z / this.config.blockSize) * this.config.blockSize;
    
    // Verificar bounds
    if (!this.isInBounds(x, y, z)) {
      console.warn(`Bloco fora dos limites: (${x}, ${y}, ${z})`);
      return false;
    }
    
    const key = this.getBlockKey(x, y, z);
    
    // Verificar se já existe bloco
    if (this.blocks.has(key)) {
      console.warn(`Já existe bloco em (${x}, ${y}, ${z})`);
      return false;
    }
    
    // Adicionar bloco
    const block: Block = { x, y, z, type };
    this.blocks.set(key, block);
    
    // Atualizar instanced mesh
    this.updateInstancedMesh(type);
    
    console.log(`✅ Bloco adicionado: ${BlockType[type]} em (${x}, ${y}, ${z})`);
    return true;
  }
  
  /**
   * Remover bloco
   */
  public removeBlock(x: number, y: number, z: number): boolean {
    // Arredondar para grid
    x = Math.floor(x / this.config.blockSize) * this.config.blockSize;
    y = Math.floor(y / this.config.blockSize) * this.config.blockSize;
    z = Math.floor(z / this.config.blockSize) * this.config.blockSize;
    
    const key = this.getBlockKey(x, y, z);
    const block = this.blocks.get(key);
    
    if (!block) {
      console.warn(`Nenhum bloco em (${x}, ${y}, ${z})`);
      return false;
    }
    
    // Remover bloco
    this.blocks.delete(key);
    
    // Atualizar instanced mesh
    this.updateInstancedMesh(block.type);
    
    console.log(`❌ Bloco removido: ${BlockType[block.type]} em (${x}, ${y}, ${z})`);
    return true;
  }
  
  /**
   * Obter bloco em posição
   */
  public getBlock(x: number, y: number, z: number): Block | null {
    x = Math.floor(x / this.config.blockSize) * this.config.blockSize;
    y = Math.floor(y / this.config.blockSize) * this.config.blockSize;
    z = Math.floor(z / this.config.blockSize) * this.config.blockSize;
    
    const key = this.getBlockKey(x, y, z);
    return this.blocks.get(key) || null;
  }
  
  /**
   * Verificar se existe bloco
   */
  public hasBlock(x: number, y: number, z: number): boolean {
    return this.getBlock(x, y, z) !== null;
  }
  
  // ==========================================================================
  // RAYCAST
  // ==========================================================================
  
  /**
   * Detectar bloco alvo (raycast)
   */
  public raycastBlock(camera: THREE.Camera, mouse: THREE.Vector2): {
    block: Block | null;
    face: THREE.Vector3 | null;
    position: THREE.Vector3 | null;
  } {
    this.raycaster.setFromCamera(mouse, camera);
    
    // Raycast em todos os instanced meshes
    const intersects: THREE.Intersection[] = [];
    
    for (const mesh of this.instancedMeshes.values()) {
      if (mesh.count > 0) {
        const hits = this.raycaster.intersectObject(mesh, false);
        intersects.push(...hits);
      }
    }
    
    if (intersects.length === 0) {
      return { block: null, face: null, position: null };
    }
    
    // Pegar o mais próximo
    intersects.sort((a, b) => a.distance - b.distance);
    const hit = intersects[0];
    
    // Obter posição do bloco
    const instanceId = hit.instanceId!;
    const mesh = hit.object as THREE.InstancedMesh;
    
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(instanceId, matrix);
    
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(matrix);
    
    const block = this.getBlock(position.x, position.y, position.z);
    
    // Calcular face normal
    const face = hit.face ? hit.face.normal.clone() : null;
    
    return { block, face, position };
  }
  
  /**
   * Atualizar highlight (bloco selecionado)
   */
  public updateHighlight(camera: THREE.Camera, mouse: THREE.Vector2) {
    const result = this.raycastBlock(camera, mouse);
    
    if (result.block && result.position) {
      // Mostrar highlight
      if (this.highlightMesh) {
        this.highlightMesh.position.copy(result.position);
        this.highlightMesh.visible = true;
      }
      
      this.currentTargetBlock = {
        x: result.position.x,
        y: result.position.y,
        z: result.position.z,
      };
    } else {
      // Esconder highlight
      if (this.highlightMesh) {
        this.highlightMesh.visible = false;
      }
      
      this.currentTargetBlock = null;
    }
  }
  
  /**
   * Quebrar bloco alvo (click esquerdo)
   */
  public breakTargetBlock(): boolean {
    if (!this.currentTargetBlock) return false;
    
    return this.removeBlock(
      this.currentTargetBlock.x,
      this.currentTargetBlock.y,
      this.currentTargetBlock.z
    );
  }
  
  /**
   * Colocar bloco adjacente (click direito)
   */
  public placeBlockAdjacent(camera: THREE.Camera, mouse: THREE.Vector2): boolean {
    const result = this.raycastBlock(camera, mouse);
    
    if (!result.block || !result.position || !result.face) {
      return false;
    }
    
    // Calcular posição adjacente (na direção da face)
    const adjacentPos = result.position.clone().add(
      result.face.multiplyScalar(this.config.blockSize)
    );
    
    return this.addBlock(
      adjacentPos.x,
      adjacentPos.y,
      adjacentPos.z,
      this.currentBlockType
    );
  }
  
  // ==========================================================================
  // INSTANCED MESH
  // ==========================================================================
  
  /**
   * Atualizar instanced mesh de um tipo
   */
  private updateInstancedMesh(type: BlockType) {
    if (type === BlockType.AIR) return;
    
    const mesh = this.instancedMeshes.get(type);
    if (!mesh) return;
    
    // Coletar todos os blocos deste tipo
    const blocksOfType: Block[] = [];
    for (const block of this.blocks.values()) {
      if (block.type === type) {
        blocksOfType.push(block);
      }
    }
    
    // Atualizar count
    mesh.count = blocksOfType.length;
    this.instanceCounts.set(type, blocksOfType.length);
    
    // Atualizar matrizes
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < blocksOfType.length; i++) {
      const block = blocksOfType[i];
      matrix.setPosition(block.x, block.y, block.z);
      mesh.setMatrixAt(i, matrix);
    }
    
    mesh.instanceMatrix.needsUpdate = true;
  }
  
  // ==========================================================================
  // UTILITÁRIOS
  // ==========================================================================
  
  private getBlockKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
  
  private isInBounds(x: number, y: number, z: number): boolean {
    const { minX, maxX, minY, maxY, minZ, maxZ } = this.config.worldBounds;
    return (
      x >= minX && x <= maxX &&
      y >= minY && y <= maxY &&
      z >= minZ && z <= maxZ
    );
  }
  
  // ==========================================================================
  // CONTROLE
  // ==========================================================================
  
  /**
   * Mudar tipo de bloco atual
   */
  public setCurrentBlockType(type: BlockType) {
    this.currentBlockType = type;
    console.log(`🎨 Tipo de bloco: ${BlockType[type]}`);
  }
  
  /**
   * Obter tipo de bloco atual
   */
  public getCurrentBlockType(): BlockType {
    return this.currentBlockType;
  }
  
  /**
   * Limpar todos os blocos
   */
  public clear() {
    this.blocks.clear();
    
    for (const type of this.instancedMeshes.keys()) {
      this.updateInstancedMesh(type);
    }
    
    console.log(`🧹 Todos os blocos removidos`);
  }
  
  // ==========================================================================
  // GETTERS
  // ==========================================================================
  
  public getGroup(): THREE.Group {
    return this.group;
  }
  
  public getBlockCount(): number {
    return this.blocks.size;
  }
  
  public getBlockCountByType(type: BlockType): number {
    return this.instanceCounts.get(type) || 0;
  }
  
  public getAllBlocks(): Block[] {
    return Array.from(this.blocks.values());
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  public dispose() {
    for (const mesh of this.instancedMeshes.values()) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    
    if (this.highlightMesh) {
      this.highlightMesh.geometry.dispose();
      if (Array.isArray(this.highlightMesh.material)) {
        this.highlightMesh.material.forEach(m => m.dispose());
      } else {
        this.highlightMesh.material.dispose();
      }
    }
    
    this.blocks.clear();
    this.instancedMeshes.clear();
    this.instanceCounts.clear();
  }
}
